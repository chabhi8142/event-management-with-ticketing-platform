const { getFirestore } = require('../config/firebase');
const { createTicketNumber } = require('../utils/generateTicketId');
const {
  calculateNextBookedCount,
} = require('../utils/bookingRules');
const {
  createSignedQrToken,
  createValidationCode,
  hashValue,
  verifySignedQrToken,
} = require('../utils/ticketSecurity');

const ticketsCollection = getFirestore().collection('tickets');
const eventsCollection = getFirestore().collection('events');
const validationStatsCollection = getFirestore().collection('validationStats');
const scanHistoryCollection = getFirestore().collection('ticketScanHistory');

async function ensureTicketSecurity(ticketDoc) {
  const ticket = ticketDoc.data();
  if (ticket.qrToken && ticket.qrTokenHash && ticket.validationCodeHash) {
    return { id: ticketDoc.id, ...ticket };
  }

  const validationCode = createValidationCode();
  const qrToken = createSignedQrToken({
    ticketId: ticketDoc.id,
    eventId: ticket.eventId,
    validationCode,
  });
  const updates = {
    qrToken,
    qrTokenHash: hashValue(qrToken),
    validationCodeHash: hashValue(validationCode),
    qrTokenVersion: 'v1',
    securityUpgradedAt: new Date().toISOString(),
  };
  await ticketDoc.ref.update(updates);
  return { id: ticketDoc.id, ...ticket, ...updates };
}

async function recordScanAttempt({
  eventId = null,
  ticketId = null,
  ticketNumber = null,
  scannedBy = null,
  scannedByRole = null,
  userAgent = null,
  ipAddress = null,
  deviceSource = null,
  result,
  message,
  method,
}) {
  try {
    await scanHistoryCollection.add({
      eventId,
      ticketId,
      ticketNumber,
      scannedBy,
      scannedByRole,
      userAgent,
      ipAddress,
      deviceSource,
      result,
      message,
      method,
      scannedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Unable to record ticket scan history:', error);
  }
}

function getRequestSource(req) {
  const userAgent = req.headers['user-agent'] || 'unknown';
  const forwardedFor = req.headers['x-forwarded-for'];
  const ipAddress = Array.isArray(forwardedFor)
    ? forwardedFor[0]
    : (forwardedFor || req.socket?.remoteAddress || 'unknown');
  const deviceSource = req.headers['x-scan-source'] || 'web';
  return { userAgent, ipAddress, deviceSource };
}

function toDateKey(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function createRecentDays(days = 14) {
  const result = [];
  const today = new Date();
  for (let index = days - 1; index >= 0; index -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - index);
    result.push({ date: date.toISOString().slice(0, 10), tickets: 0, revenue: 0 });
  }
  return result;
}

async function bookTicket(req, res) {
  try {
    const { eventId, attendeeName } = req.body;
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const ticketRef = ticketsCollection.doc();
    const validationCode = createValidationCode();
    const qrToken = createSignedQrToken({
      ticketId: ticketRef.id,
      eventId,
      validationCode,
    });
    const eventRef = eventsCollection.doc(eventId);
    const now = new Date().toISOString();

    const ticketPayload = await getFirestore().runTransaction(async (transaction) => {
      const eventDoc = await transaction.get(eventRef);
      if (!eventDoc.exists) {
        const error = new Error('Event not found');
        error.statusCode = 404;
        throw error;
      }

      const eventData = eventDoc.data();
      const nextBookedCount = calculateNextBookedCount(eventData);

      const payload = {
        eventId,
        userId: req.user.uid,
        userEmail: req.user.email,
        attendeeName,
        eventTitle: eventData.title,
        eventCategory: eventData.category || 'General',
        eventType: eventData.eventType || 'In person',
        eventDate: eventData.date,
        eventTime: eventData.time,
        eventLocation: eventData.location,
        eventVenueName: eventData.venueName || '',
        eventCity: eventData.city || '',
        eventPrice: eventData.price,
        status: 'booked',
        paymentStatus: Number(eventData.price || 0) > 0 ? 'paid' : 'not_required',
        refundStatus: 'not_requested',
        refundAmount: 0,
        createdAt: now,
        ticketNumber: createTicketNumber(),
        qrToken,
        qrTokenHash: hashValue(qrToken),
        validationCodeHash: hashValue(validationCode),
        qrTokenVersion: 'v1',
      };

      transaction.set(ticketRef, payload);
      transaction.update(eventRef, {
        bookedTickets: nextBookedCount,
        updatedAt: now,
      });

      return payload;
    });

    res.status(201).json({ id: ticketRef.id, ...ticketPayload });
  } catch (error) {
    console.error('Book ticket error:', error);
    res.status(error.statusCode || 500).json({ error: error.statusCode ? error.message : 'Unable to book ticket' });
  }
}

async function getMyTickets(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const querySnapshot = await ticketsCollection
      .where('userId', '==', req.user.uid)
      .orderBy('createdAt', 'desc')
      .get();

    const tickets = await Promise.all(querySnapshot.docs.map((doc) => ensureTicketSecurity(doc)));

    res.json(tickets);
  } catch (error) {
    console.error('Get my tickets error:', error);
    res.status(500).json({ error: 'Unable to fetch your tickets' });
  }
}

async function validateTicket(req, res) {
  try {
    let { ticketNumber, ticketId, qrToken, eventId: validationEventId } = req.body;
    
    // Trim whitespace from inputs
    if (ticketNumber) ticketNumber = ticketNumber.trim();
    if (ticketId) ticketId = ticketId.trim();
    if (qrToken) qrToken = qrToken.trim();
    if (validationEventId) validationEventId = validationEventId.trim();
    
    if (!ticketNumber && !ticketId && !qrToken) {
      return res.status(400).json({ valid: false, message: 'Please provide a signed QR token or ticket number' });
    }
    if (!validationEventId) {
      return res.status(400).json({ valid: false, message: 'Please select the event you are validating tickets for' });
    }

    let ticketDoc;
    let qrPayload = null;
    let validationMethod = 'ticket_number';
    const scanSource = getRequestSource(req);

    const selectedEventDoc = await eventsCollection.doc(validationEventId).get();
    if (!selectedEventDoc.exists) {
      await recordScanAttempt({
        eventId: validationEventId,
        scannedBy: req.user?.email,
        scannedByRole: req.user?.role,
        ...scanSource,
        result: 'failed',
        message: 'Selected validation event not found',
        method: validationMethod,
      });
      return res.status(404).json({ valid: false, message: 'Selected event not found' });
    }

    const selectedEventData = selectedEventDoc.data();
    const selectedEventOwnerId = selectedEventData?.organizerId || selectedEventData?.createdBy;
    if (req.user?.role !== 'admin' && selectedEventOwnerId !== req.user?.uid) {
      await recordScanAttempt({
        eventId: validationEventId,
        scannedBy: req.user?.email,
        scannedByRole: req.user?.role,
        ...scanSource,
        result: 'failed',
        message: 'Validator does not own selected validation event',
        method: validationMethod,
      });
      return res.status(403).json({ valid: false, message: 'You do not have permission to validate tickets for this event' });
    }

    const candidateQrToken = qrToken || (ticketId && ticketId.startsWith('EVTQR.') ? ticketId : null) || (ticketNumber && ticketNumber.startsWith('EVTQR.') ? ticketNumber : null);

    if (candidateQrToken) {
      validationMethod = 'signed_qr';
      try {
        qrPayload = verifySignedQrToken(candidateQrToken);
        if (qrPayload.eventId !== validationEventId) {
          await recordScanAttempt({
            eventId: validationEventId,
            scannedBy: req.user?.email,
            scannedByRole: req.user?.role,
            ...scanSource,
            result: 'failed',
            message: 'QR token belongs to a different event',
            method: validationMethod,
          });
          return res.status(400).json({ valid: false, message: 'This ticket belongs to a different event. Entry denied.' });
        }
        ticketDoc = await ticketsCollection.doc(qrPayload.ticketId).get();
      } catch (tokenError) {
        await recordScanAttempt({
          scannedBy: req.user?.email,
          scannedByRole: req.user?.role,
          ...scanSource,
          result: 'failed',
          message: tokenError.message,
          method: validationMethod,
        });
        return res.status(400).json({ valid: false, message: 'Invalid or tampered QR code' });
      }
    }
    
    if ((!ticketDoc || !ticketDoc.exists) && ticketNumber && !ticketNumber.startsWith('EVTQR.')) {
      const querySnapshot = await ticketsCollection.where('ticketNumber', '==', ticketNumber).get();
      if (!querySnapshot.empty) {
        ticketDoc = querySnapshot.docs[0];
      }
    }

    if (!ticketDoc || !ticketDoc.exists) {
      await recordScanAttempt({
        scannedBy: req.user?.email,
        scannedByRole: req.user?.role,
        ...scanSource,
        result: 'failed',
        message: 'Ticket not found',
        method: validationMethod,
      });
      return res.status(404).json({ valid: false, message: 'Ticket not found' });
    }

    const ticketData = ticketDoc.data();
    if (ticketData.eventId !== validationEventId) {
      await recordScanAttempt({
        eventId: validationEventId,
        ticketId: ticketDoc.id,
        ticketNumber: ticketData.ticketNumber,
        scannedBy: req.user?.email,
        scannedByRole: req.user?.role,
        ...scanSource,
        result: 'failed',
        message: `Ticket belongs to different event ${ticketData.eventId}`,
        method: validationMethod,
      });
      return res.status(400).json({ valid: false, message: 'This ticket belongs to a different event. Entry denied.' });
    }

    const eventDoc = await eventsCollection.doc(ticketData.eventId).get();
    const eventData = eventDoc.exists ? eventDoc.data() : null;
    const eventOwnerId = eventData?.organizerId || eventData?.createdBy;

    if (req.user?.role !== 'admin' && eventOwnerId !== req.user?.uid) {
      await recordScanAttempt({
        eventId: ticketData.eventId,
        ticketId: ticketDoc.id,
        ticketNumber: ticketData.ticketNumber,
        scannedBy: req.user?.email,
        scannedByRole: req.user?.role,
        ...scanSource,
        result: 'failed',
        message: 'Validator does not own this event',
        method: validationMethod,
      });
      return res.status(403).json({ valid: false, message: 'You do not have permission to validate this event ticket' });
    }

    if (qrPayload) {
      const tokenMatchesTicket =
        qrPayload.ticketId === ticketDoc.id &&
        qrPayload.eventId === ticketData.eventId &&
        hashValue(qrPayload.validationCode) === ticketData.validationCodeHash &&
        hashValue(candidateQrToken) === ticketData.qrTokenHash;

      if (!tokenMatchesTicket) {
        await recordScanAttempt({
          eventId: ticketData.eventId,
          ticketId: ticketDoc.id,
          ticketNumber: ticketData.ticketNumber,
          scannedBy: req.user?.email,
          scannedByRole: req.user?.role,
          ...scanSource,
          result: 'failed',
          message: 'QR token does not match stored ticket security fields',
          method: validationMethod,
        });
        return res.status(400).json({ valid: false, message: 'QR code is not valid for this ticket or event' });
      }
    }

    if (ticketData.status === 'cancelled') {
      await recordScanAttempt({
        eventId: ticketData.eventId,
        ticketId: ticketDoc.id,
        ticketNumber: ticketData.ticketNumber,
        scannedBy: req.user?.email,
        scannedByRole: req.user?.role,
        ...scanSource,
        result: 'failed',
        message: 'Ticket is cancelled',
        method: validationMethod,
      });
      return res.status(400).json({
        valid: false,
        message: 'Ticket is cancelled because the event was cancelled',
      });
    }

    // Always ensure a validation stat exists for validated tickets
    let validatedAt = ticketData.validatedAt;
    let alreadyValidated = false;
    if (ticketData.status === 'validated') {
      alreadyValidated = true;
      // Use existing validatedAt
    } else {
      // Validate ticket now
      validatedAt = new Date().toISOString();
      await ticketDoc.ref.update({ status: 'validated', validatedAt });
    }

    // Store validation statistics if not already present
    try {
      if (eventOwnerId && req.user) {
        // Check if a validation stat already exists for this ticket
        const existingStats = await validationStatsCollection
          .where('ticketId', '==', ticketDoc.id)
          .limit(1)
          .get();
        if (existingStats.empty) {
          await validationStatsCollection.add({
            eventId: ticketData.eventId,
            eventTitle: ticketData.eventTitle,
            organizerId: eventOwnerId,
            organizerEmail: eventData?.organizerEmail,
            ticketId: ticketDoc.id,
            ticketNumber: ticketData.ticketNumber,
            attendeeName: ticketData.attendeeName,
            validatedBy: req.user.email,
            validatedByRole: req.user.role,
            userAgent: scanSource.userAgent,
            ipAddress: scanSource.ipAddress,
            deviceSource: scanSource.deviceSource,
            validatedAt,
            createdAt: new Date().toISOString(),
            method: validationMethod,
          });
        }
      }
    } catch (statsError) {
      console.error('Error storing validation stats:', statsError);
      // Don't throw, just log - validation was successful
    }

    await recordScanAttempt({
      eventId: ticketData.eventId,
      ticketId: ticketDoc.id,
      ticketNumber: ticketData.ticketNumber,
      scannedBy: req.user?.email,
      scannedByRole: req.user?.role,
      ...scanSource,
      result: alreadyValidated ? 'duplicate' : 'success',
      message: alreadyValidated ? 'Ticket already validated' : 'Ticket validated successfully',
      method: validationMethod,
    });

    res.json({ 
      valid: !alreadyValidated, 
      message: alreadyValidated ? 'Ticket already validated' : 'Ticket validated successfully',
      ticket: {
        id: ticketDoc.id,
        ticketNumber: ticketData.ticketNumber,
        attendeeName: ticketData.attendeeName,
        eventTitle: ticketData.eventTitle,
        eventDate: ticketData.eventDate,
        eventTime: ticketData.eventTime,
        eventLocation: ticketData.eventLocation,
        status: 'validated',
        validatedAt,
        validationMethod,
        validatedBy: req.user?.email,
      }
    });
  } catch (error) {
    console.error('Validate ticket error:', error);
    res.status(500).json({ error: 'Unable to validate ticket' });
  }
}

async function getEventTickets(req, res) {
  try {
    const { eventId } = req.params;
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get event to verify ownership
    const eventDoc = await eventsCollection.doc(eventId).get();
    if (!eventDoc.exists) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const eventData = eventDoc.data();
    const eventOwnerId = eventData.organizerId || eventData.createdBy;
    // Allow organizer who owns event or admins to view
    if (req.user.role !== 'admin' && eventOwnerId !== req.user.uid) {
      return res.status(403).json({ error: 'You do not have permission to view these tickets' });
    }

    const querySnapshot = await ticketsCollection
      .where('eventId', '==', eventId)
      .orderBy('createdAt', 'desc')
      .get();

    const tickets = await Promise.all(querySnapshot.docs.map((doc) => ensureTicketSecurity(doc)));

    res.json({ event: { id: eventDoc.id, ...eventData }, tickets });
  } catch (error) {
    console.error('Get event tickets error:', error);
    res.status(500).json({ error: 'Unable to fetch event tickets' });
  }
}

async function getTicketById(req, res) {
  try {
    const { ticketId } = req.params;
    const doc = await ticketsCollection.doc(ticketId).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    const ticket = await ensureTicketSecurity(doc);
    res.json(ticket);
  } catch (error) {
    console.error('Get ticket error:', error);
    res.status(500).json({ error: 'Unable to fetch ticket' });
  }
}

async function getValidationStatsByEvent(req, res) {
  try {
    const { eventId } = req.params;
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get event to verify ownership
    const eventDoc = await eventsCollection.doc(eventId).get();
    if (!eventDoc.exists) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const eventData = eventDoc.data();
    const eventOwnerId = eventData.organizerId || eventData.createdBy;
    // Allow organizer who owns event or admins to view
    if (req.user.role !== 'admin' && eventOwnerId !== req.user.uid) {
      return res.status(403).json({ error: 'You do not have permission to view these statistics' });
    }

    // Get validation statistics for this event
    const querySnapshot = await validationStatsCollection
      .where('eventId', '==', eventId)
      .orderBy('validatedAt', 'desc')
      .get();

    const validationStats = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Calculate summary statistics
    const summary = {
      totalValidations: validationStats.length,
      uniqueAttendees: new Set(validationStats.map(s => s.attendeeName)).size,
      validationsByDate: {},
      latestValidation: validationStats.length > 0 ? validationStats[0].validatedAt : null,
    };

    // Group by date
    validationStats.forEach(stat => {
      const date = new Date(stat.validatedAt).toLocaleDateString('en-US');
      summary.validationsByDate[date] = (summary.validationsByDate[date] || 0) + 1;
    });

    res.json({ 
      eventTitle: eventData.title,
      summary,
      validationStats 
    });
  } catch (error) {
    console.error('Get validation stats error:', error);
    res.status(500).json({ error: 'Unable to fetch validation statistics' });
  }
}

async function getOrganizerAnalytics(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (!['organiser', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Only organisers and admins can view analytics' });
    }

    const eventSnapshot = req.user.role === 'admin'
      ? await eventsCollection.get()
      : await eventsCollection.where('organizerId', '==', req.user.uid).get();

    const events = eventSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    const eventIds = new Set(events.map((event) => event.id));

    if (events.length === 0) {
      return res.json({
        summary: {
          totalEvents: 0,
          totalCapacity: 0,
          totalTickets: 0,
          totalRevenue: 0,
          averageUtilisation: 0,
          validatedTickets: 0,
          notValidatedTickets: 0,
          cancelledTickets: 0,
        },
        salesTrend: createRecentDays(),
        events: [],
        topEvents: [],
        attendees: [],
      });
    }

    const [ticketSnapshot, validationSnapshot] = await Promise.all([
      ticketsCollection.get(),
      validationStatsCollection.get(),
    ]);

    const tickets = ticketSnapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((ticket) => eventIds.has(ticket.eventId));
    const validations = validationSnapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((stat) => eventIds.has(stat.eventId));

    const ticketsByEvent = {};
    tickets.forEach((ticket) => {
      if (!ticketsByEvent[ticket.eventId]) ticketsByEvent[ticket.eventId] = [];
      ticketsByEvent[ticket.eventId].push(ticket);
    });

    const validationsByTicket = new Set(validations.map((stat) => stat.ticketId).filter(Boolean));
    tickets.forEach((ticket) => {
      if (ticket.status === 'validated') {
        validationsByTicket.add(ticket.id);
      }
    });

    const salesTrend = createRecentDays();
    const salesTrendByDate = Object.fromEntries(salesTrend.map((item) => [item.date, item]));
    let totalCapacity = 0;
    let totalTickets = 0;
    let totalRevenue = 0;
    let validatedTickets = 0;
    let cancelledTickets = 0;

    tickets.forEach((ticket) => {
      const price = Number(ticket.eventPrice || 0);
      if (ticket.status === 'cancelled') {
        cancelledTickets += 1;
      } else {
        totalRevenue += price;
      }
      if (validationsByTicket.has(ticket.id)) {
        validatedTickets += 1;
      }
      const dateKey = toDateKey(ticket.createdAt);
      if (dateKey && salesTrendByDate[dateKey]) {
        salesTrendByDate[dateKey].tickets += 1;
        salesTrendByDate[dateKey].revenue += ticket.status === 'cancelled' ? 0 : price;
      }
    });

    const eventAnalytics = events.map((event) => {
      const eventTickets = ticketsByEvent[event.id] || [];
      const activeTickets = eventTickets.filter((ticket) => ticket.status !== 'cancelled');
      const eventValidated = eventTickets.filter((ticket) => validationsByTicket.has(ticket.id)).length;
      const eventCancelled = eventTickets.filter((ticket) => ticket.status === 'cancelled').length;
      const capacity = Number(event.capacity || 0);
      const revenue = activeTickets.reduce((sum, ticket) => sum + Number(ticket.eventPrice || event.price || 0), 0);
      const utilisation = capacity > 0 ? Math.round((activeTickets.length / capacity) * 100) : 0;
      totalCapacity += capacity;
      totalTickets += activeTickets.length;

      return {
        id: event.id,
        title: event.title || 'Untitled event',
        status: event.status || 'draft',
        date: event.date,
        capacity,
        ticketsBooked: activeTickets.length,
        cancelledTickets: eventCancelled,
        validatedTickets: eventValidated,
        notValidatedTickets: Math.max(0, activeTickets.length - eventValidated),
        utilisation,
        revenue,
      };
    });

    const averageUtilisation = totalCapacity > 0 ? Math.round((totalTickets / totalCapacity) * 100) : 0;
    const notValidatedTickets = Math.max(0, totalTickets - validatedTickets);
    const topEvents = [...eventAnalytics]
      .sort((a, b) => b.revenue - a.revenue || b.ticketsBooked - a.ticketsBooked || b.utilisation - a.utilisation)
      .slice(0, 5);

    const attendees = tickets.map((ticket) => ({
      ticketId: ticket.id,
      ticketNumber: ticket.ticketNumber,
      attendeeName: ticket.attendeeName,
      email: ticket.userEmail,
      eventId: ticket.eventId,
      eventTitle: ticket.eventTitle,
      eventDate: ticket.eventDate,
      status: ticket.status || 'booked',
      paymentStatus: ticket.paymentStatus || 'unknown',
      refundStatus: ticket.refundStatus || 'not_requested',
      price: Number(ticket.eventPrice || 0),
      bookedAt: ticket.createdAt,
      validatedAt: ticket.validatedAt || null,
    }));

    res.json({
      summary: {
        totalEvents: events.length,
        totalCapacity,
        totalTickets,
        totalRevenue,
        averageUtilisation,
        validatedTickets,
        notValidatedTickets,
        cancelledTickets,
      },
      salesTrend,
      events: eventAnalytics,
      topEvents,
      attendees,
    });
  } catch (error) {
    console.error('Get organiser analytics error:', error);
    res.status(500).json({ error: 'Unable to fetch organiser analytics' });
  }
}

module.exports = {
  bookTicket,
  getMyTickets,
  getEventTickets,
  validateTicket,
  getTicketById,
  getValidationStatsByEvent,
  getOrganizerAnalytics,
};

const { getFirestore } = require('../config/firebase');
const { getUserProfile } = require('../models/userModel');

const eventsCollection = getFirestore().collection('events');
const ticketsCollection = getFirestore().collection('tickets');
const notificationsCollection = getFirestore().collection('notifications');

const editableEventFields = [
  'title',
  'description',
  'category',
  'eventType',
  'date',
  'time',
  'location',
  'venueName',
  'address',
  'city',
  'postcode',
  'capacity',
  'price',
  'bookingDeadline',
  'contactEmail',
  'contactPhone',
  'agenda',
  'speakerName',
  'speakerBio',
  'tags',
  'minimumAge',
  'eligibilityNotes',
  'cancellationPolicy',
  'refundPolicy',
];

function normaliseEventPayload(body = {}) {
  const payload = {};

  editableEventFields.forEach((field) => {
    if (body[field] !== undefined) {
      payload[field] = body[field];
    }
  });

  payload.title = String(payload.title || '').trim();
  payload.description = String(payload.description || '').trim();
  payload.category = payload.category || 'General';
  payload.eventType = payload.eventType || 'In person';
  payload.location = String(payload.location || '').trim();
  payload.venueName = String(payload.venueName || '').trim();
  payload.address = String(payload.address || '').trim();
  payload.city = String(payload.city || '').trim();
  payload.postcode = String(payload.postcode || '').trim();
  payload.contactEmail = String(payload.contactEmail || '').trim();
  payload.contactPhone = String(payload.contactPhone || '').trim();
  payload.agenda = String(payload.agenda || '').trim();
  payload.speakerName = String(payload.speakerName || '').trim();
  payload.speakerBio = String(payload.speakerBio || '').trim();
  payload.eligibilityNotes = String(payload.eligibilityNotes || '').trim();
  payload.cancellationPolicy = String(payload.cancellationPolicy || '').trim();
  payload.refundPolicy = String(payload.refundPolicy || '').trim();
  payload.capacity = Number.parseInt(payload.capacity, 10);
  payload.price = Number.parseFloat(payload.price);
  payload.minimumAge = payload.minimumAge === '' || payload.minimumAge === undefined
    ? ''
    : Number.parseInt(payload.minimumAge, 10);
  payload.tags = Array.isArray(payload.tags)
    ? payload.tags.map((tag) => String(tag).trim()).filter(Boolean)
    : String(payload.tags || '').split(',').map((tag) => tag.trim()).filter(Boolean);

  return payload;
}

function validateEventPayload(payload = {}) {
  if (!payload.title || !payload.description || !payload.date || !payload.time || !payload.location) {
    return 'Title, description, date, time, and location are required.';
  }
  if (!Number.isFinite(payload.capacity) || payload.capacity <= 0) {
    return 'Capacity must be greater than zero.';
  }
  if (!Number.isFinite(payload.price) || payload.price < 0) {
    return 'Price cannot be negative.';
  }
  if (payload.bookingDeadline && payload.bookingDeadline > payload.date) {
    return 'Booking deadline cannot be after the event date.';
  }
  if (payload.minimumAge !== '' && (!Number.isFinite(payload.minimumAge) || payload.minimumAge < 0)) {
    return 'Minimum age cannot be negative.';
  }
  return null;
}

async function listEvents(req, res) {
  try {
    let query = eventsCollection;

    // If user is an attendee, only show published events
    // If user is an organiser, show their own events
    if (req.user) {
      if (req.user.role === 'organiser') {
        query = query.where('organizerId', '==', req.user.uid);
      } else if (req.user.role === 'attendee') {
        query = query.where('status', '==', 'published');
      }
    } else {
      // Public access - only show published events
      query = query.where('status', '==', 'published');
    }

    const snapshot = await query.get();
    const events = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json(events);
  } catch (error) {
    console.error('List events error:', error);
    res.status(500).json({ error: 'Unable to fetch events' });
  }
}

async function createEvent(req, res) {
  try {
    // Only organizers and admins can create events
    if (!req.user || !['organiser', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Only organizers and admins can create events' });
    }

    // Check if organiser (not admin) is approved
    if (req.user.role === 'organiser') {
      const organiserProfile = await getUserProfile(req.user.uid);
      if (!organiserProfile?.isApproved) {
        return res.status(403).json({ error: 'Your organiser account is pending admin approval. You cannot create events yet.' });
      }
    }
    // Admins bypass approval check

    const eventPayload = normaliseEventPayload(req.body);
    const validationError = validateEventPayload(eventPayload);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const eventData = {
      ...eventPayload,
      organizerId: req.user.uid,
      organizerEmail: req.user.email,
      status: 'draft', // Events start as draft
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const newEvent = await eventsCollection.add(eventData);
    res.status(201).json({ id: newEvent.id, ...eventData });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ error: 'Unable to create event' });
  }
}

async function listMyEvents(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required to list your events.' });
    }

    let query = eventsCollection;
    if (req.user.role === 'admin') {
      // Admin can see all events
      query = eventsCollection;
    } else {
      query = eventsCollection.where('organizerId', '==', req.user.uid);
    }

    const snapshot = await query.get();
    const events = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json(events);
  } catch (error) {
    console.error('List my events error:', error);
    res.status(500).json({ error: 'Unable to fetch your events' });
  }
}

async function getEventById(req, res) {
  try {
    const { eventId } = req.params;
    const doc = await eventsCollection.doc(eventId).get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const eventData = { id: doc.id, ...doc.data() };

    // Check permissions
    if (req.user) {
      // Organizers can see their own events (any status)
      // Attendees can see published events
      if (req.user.role === 'admin') {
        return res.json(eventData);
      } else if (req.user.role === 'organiser' && eventData.organizerId === req.user.uid) {
        return res.json(eventData);
      } else if (req.user.role === 'attendee' && eventData.status === 'published') {
        return res.json(eventData);
      }
    } else {
      // Public access - only published events
      if (eventData.status === 'published') {
        return res.json(eventData);
      }
    }

    return res.status(403).json({ error: 'Access denied' });
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({ error: 'Unable to fetch event' });
  }
}

async function updateEvent(req, res) {
  try {
    const { eventId } = req.params;

    // Check if event exists and user has permission
    const eventDoc = await eventsCollection.doc(eventId).get();
    if (!eventDoc.exists) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const eventData = eventDoc.data();

    // Only the organizer or admin can update event
    if (!req.user) {
      return res.status(403).json({ error: 'Authentication required' });
    }
    if (req.user.role === 'organiser' && req.user.uid !== eventData.organizerId) {
      return res.status(403).json({ error: 'Only the event organizer can update this event' });
    }
    // Admins can update any event

    const eventPayload = normaliseEventPayload(req.body);
    const validationError = validateEventPayload(eventPayload);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const updates = {
      ...eventPayload,
      updatedAt: new Date().toISOString(),
    };

    await eventsCollection.doc(eventId).update(updates);
    res.json({ message: 'Event updated successfully' });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ error: 'Unable to update event' });
  }
}

async function deleteEvent(req, res) {
  try {
    const { eventId } = req.params;

    // Check if event exists and user has permission
    const eventDoc = await eventsCollection.doc(eventId).get();
    if (!eventDoc.exists) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const eventData = eventDoc.data();

    // Only the organizer or admin can delete event
    if (!req.user) {
      return res.status(403).json({ error: 'Authentication required' });
    }
    if (req.user.role === 'organiser' && req.user.uid !== eventData.organizerId) {
      return res.status(403).json({ error: 'Only the event organizer can delete this event' });
    }
    // Admins can delete any event

    await eventsCollection.doc(eventId).delete();
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ error: 'Unable to delete event' });
  }
}

async function publishEvent(req, res) {
  try {
    const { eventId } = req.params;

    // Check if event exists and user has permission
    const eventDoc = await eventsCollection.doc(eventId).get();
    if (!eventDoc.exists) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const eventData = eventDoc.data();

    // Only the organizer or admin can publish event
    if (!req.user) {
      return res.status(403).json({ error: 'Authentication required' });
    }
    if (req.user.role === 'organiser' && req.user.uid !== eventData.organizerId) {
      return res.status(403).json({ error: 'Only the event organizer can publish this event' });
    }
    // Admins can publish any event

    await eventsCollection.doc(eventId).update({
      status: 'published',
      publishedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    res.json({ message: 'Event published successfully' });
  } catch (error) {
    console.error('Publish event error:', error);
    res.status(500).json({ error: 'Unable to publish event' });
  }
}

async function cancelEvent(req, res) {
  try {
    const { eventId } = req.params;
    const { reason = '' } = req.body;

    const eventDoc = await eventsCollection.doc(eventId).get();
    if (!eventDoc.exists) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const eventData = eventDoc.data();
    if (!req.user) {
      return res.status(403).json({ error: 'Authentication required' });
    }
    if (req.user.role === 'organiser' && req.user.uid !== eventData.organizerId) {
      return res.status(403).json({ error: 'Only the event organizer can cancel this event' });
    }
    if (eventData.status === 'cancelled') {
      return res.status(400).json({ error: 'Event is already cancelled' });
    }

    const cancelledAt = new Date().toISOString();
    const ticketSnapshot = await ticketsCollection.where('eventId', '==', eventId).get();
    let affectedTickets = 0;

    let batch = getFirestore().batch();
    let operationCount = 0;
    const commitIfNeeded = async () => {
      if (operationCount === 0) return;
      await batch.commit();
      batch = getFirestore().batch();
      operationCount = 0;
    };

    batch.update(eventsCollection.doc(eventId), {
      status: 'cancelled',
      cancellationReason: reason,
      cancelledAt,
      cancelledBy: req.user.uid,
      cancelledByEmail: req.user.email,
      updatedAt: cancelledAt,
    });
    operationCount += 1;

    for (const ticketDoc of ticketSnapshot.docs) {
      const ticket = ticketDoc.data();
      const refundAmount = Number(ticket.eventPrice || 0);

      batch.update(ticketDoc.ref, {
        status: 'cancelled',
        cancellationReason: reason,
        cancelledAt,
        paymentStatus: refundAmount > 0 ? 'refunded' : 'not_required',
        refundStatus: refundAmount > 0 ? 'completed' : 'not_required',
        refundAmount,
        refundProcessedAt: cancelledAt,
      });
      operationCount += 1;

      batch.set(notificationsCollection.doc(), {
        userId: ticket.userId,
        userEmail: ticket.userEmail,
        type: 'event_cancelled',
        title: `Event cancelled: ${eventData.title}`,
        message: reason
          ? `The event "${eventData.title}" has been cancelled. Reason: ${reason}`
          : `The event "${eventData.title}" has been cancelled.`,
        eventId,
        eventTitle: eventData.title,
        ticketId: ticketDoc.id,
        ticketNumber: ticket.ticketNumber,
        refundStatus: refundAmount > 0 ? 'completed' : 'not_required',
        refundAmount,
        read: false,
        createdAt: cancelledAt,
      });
      operationCount += 1;
      affectedTickets += 1;

      if (operationCount >= 450) {
        await commitIfNeeded();
      }
    }

    await commitIfNeeded();

    res.json({
      message: 'Event cancelled successfully',
      affectedTickets,
      notificationsCreated: affectedTickets,
    });
  } catch (error) {
    console.error('Cancel event error:', error);
    res.status(500).json({ error: 'Unable to cancel event' });
  }
}

module.exports = {
  listEvents,
  listMyEvents,
  createEvent,
  getEventById,
  updateEvent,
  deleteEvent,
  publishEvent,
  cancelEvent,
};

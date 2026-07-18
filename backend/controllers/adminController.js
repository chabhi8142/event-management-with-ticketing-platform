const {
  getFirestore,
} = require('../config/firebase');
const {
  getAllUsers,
  getUsersByRole,
  blockUser,
  unblockUser,
  deleteUserProfile,
  approveOrganiser,
  rejectOrganiser,
} = require('../models/userModel');

const db = getFirestore();

function incrementCounter(target, key) {
  const normalizedKey = key || 'unknown';
  target[normalizedKey] = (target[normalizedKey] || 0) + 1;
}

function toDateKey(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function createLastSevenDays() {
  const days = [];
  const today = new Date();
  for (let index = 6; index >= 0; index -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - index);
    const key = date.toISOString().slice(0, 10);
    days.push({ date: key, count: 0, revenue: 0 });
  }
  return days;
}

function addActivity(activities, type, title, description, createdAt) {
  if (!createdAt) return;
  activities.push({ type, title, description, createdAt });
}

async function listAllUsers(req, res) {
  try {
    const users = await getAllUsers();
    res.json(users);
  } catch (error) {
    console.error('List users error:', error);
    res.status(500).json({ error: 'Unable to fetch users' });
  }
}

async function getPendingOrganisers(req, res) {
  try {
    const organisers = await getUsersByRole('organiser');
    const pending = organisers.filter((org) => !org.isApproved);
    res.json(pending);
  } catch (error) {
    console.error('Get pending organisers error:', error);
    res.status(500).json({ error: 'Unable to fetch pending organisers' });
  }
}

async function approveOrganiserAccount(req, res) {
  try {
    const { userId } = req.params;
    await approveOrganiser(userId);
    res.json({ message: 'Organiser approved successfully' });
  } catch (error) {
    console.error('Approve organiser error:', error);
    res.status(500).json({ error: 'Unable to approve organiser' });
  }
}

async function rejectOrganiserAccount(req, res) {
  try {
    const { userId } = req.params;
    await rejectOrganiser(userId);
    res.json({ message: 'Organiser rejected and deleted' });
  } catch (error) {
    console.error('Reject organiser error:', error);
    res.status(500).json({ error: 'Unable to reject organiser' });
  }
}

async function blockUserAccount(req, res) {
  try {
    const { userId } = req.params;
    await blockUser(userId);
    res.json({ message: 'User blocked successfully' });
  } catch (error) {
    console.error('Block user error:', error);
    res.status(500).json({ error: 'Unable to block user' });
  }
}

async function unblockUserAccount(req, res) {
  try {
    const { userId } = req.params;
    await unblockUser(userId);
    res.json({ message: 'User unblocked successfully' });
  } catch (error) {
    console.error('Unblock user error:', error);
    res.status(500).json({ error: 'Unable to unblock user' });
  }
}

async function deleteUser(req, res) {
  try {
    const { userId } = req.params;
    await deleteUserProfile(userId);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Unable to delete user' });
  }
}

async function getSystemMonitoring(req, res) {
  try {
    const [users, eventsSnapshot, ticketsSnapshot, validationSnapshot, scanHistorySnapshot, notificationsSnapshot] = await Promise.all([
      getAllUsers(),
      db.collection('events').get(),
      db.collection('tickets').get(),
      db.collection('validationStats').get(),
      db.collection('ticketScanHistory').get(),
      db.collection('notifications').orderBy('createdAt', 'desc').limit(20).get(),
    ]);

    const events = eventsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    const tickets = ticketsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    const validations = validationSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    const scanHistory = scanHistorySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    const notifications = notificationsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    const usersByRole = {};
    const usersByStatus = {};
    let pendingOrganisers = 0;
    users.forEach((user) => {
      incrementCounter(usersByRole, user.role || 'attendee');
      incrementCounter(usersByStatus, user.status || 'active');
      if (user.role === 'organiser' && !user.isApproved) {
        pendingOrganisers += 1;
      }
    });

    const eventsByStatus = {};
    events.forEach((event) => {
      incrementCounter(eventsByStatus, event.status || 'draft');
    });

    const ticketTrend = createLastSevenDays();
    const ticketTrendByDate = Object.fromEntries(ticketTrend.map((item) => [item.date, item]));
    let grossRevenue = 0;
    let refundedRevenue = 0;
    let netRevenue = 0;
    let activeTickets = 0;
    let cancelledTickets = 0;
    let validatedTickets = 0;

    tickets.forEach((ticket) => {
      const price = Number(ticket.eventPrice || 0);
      grossRevenue += price;
      if (ticket.status === 'cancelled') {
        cancelledTickets += 1;
        refundedRevenue += Number(ticket.refundAmount || price || 0);
      } else {
        activeTickets += 1;
        netRevenue += price;
      }
      if (ticket.status === 'validated') {
        validatedTickets += 1;
      }

      const dateKey = toDateKey(ticket.createdAt);
      if (dateKey && ticketTrendByDate[dateKey]) {
        ticketTrendByDate[dateKey].count += 1;
        ticketTrendByDate[dateKey].revenue += price;
      }
    });

    const validationSuccesses = scanHistory.filter((item) => item.result === 'success').length || validations.length;
    const duplicateValidations = scanHistory.filter((item) => item.result === 'duplicate').length;
    const failedValidations = scanHistory.filter((item) => item.result === 'failed').length;
    const validationAttempts = scanHistory.length || validations.length;
    const validationSummary = {
      successful: validationSuccesses,
      duplicates: duplicateValidations,
      failed: failedValidations,
      attempts: validationAttempts,
      successRate: validationAttempts > 0 ? Math.round((validationSuccesses / validationAttempts) * 100) : 0,
      duplicateRate: validationAttempts > 0 ? Math.round((duplicateValidations / validationAttempts) * 100) : 0,
    };

    const recentActivity = [];
    users.forEach((user) => {
      addActivity(recentActivity, 'user_registered', 'User registered', `${user.name || user.email} joined as ${user.role || 'attendee'}`, user.createdAt);
    });
    events.forEach((event) => {
      addActivity(recentActivity, 'event_created', 'Event created', event.title || 'Untitled event', event.createdAt);
      addActivity(recentActivity, 'event_published', 'Event published', event.title || 'Untitled event', event.publishedAt);
      addActivity(recentActivity, 'event_cancelled', 'Event cancelled', event.title || 'Untitled event', event.cancelledAt);
    });
    tickets.forEach((ticket) => {
      addActivity(recentActivity, 'ticket_booked', 'Ticket booked', `${ticket.attendeeName || ticket.userEmail} booked ${ticket.eventTitle || 'an event'}`, ticket.createdAt);
      addActivity(recentActivity, 'ticket_cancelled', 'Ticket cancelled/refunded', `${ticket.ticketNumber || ticket.id} for ${ticket.eventTitle || 'an event'}`, ticket.cancelledAt);
    });
    validations.forEach((validation) => {
      addActivity(recentActivity, 'ticket_validated', 'Ticket validated', `${validation.ticketNumber || validation.ticketId} checked in`, validation.validatedAt || validation.createdAt);
    });
    scanHistory.forEach((scan) => {
      addActivity(recentActivity, 'ticket_scan', 'Ticket scan', `${scan.ticketNumber || 'Unknown ticket'}: ${scan.result} (${scan.method || 'manual'})`, scan.scannedAt);
    });
    notifications.forEach((notification) => {
      addActivity(recentActivity, notification.type || 'notification', notification.title || 'Notification created', notification.userEmail || notification.message, notification.createdAt);
    });

    recentActivity.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      totals: {
        users: users.length,
        events: events.length,
        tickets: tickets.length,
        validations: validations.length,
        activeTickets,
        cancelledTickets,
        validatedTickets,
      },
      usersByRole,
      usersByStatus,
      pendingOrganisers,
      eventsByStatus,
      ticketTrend,
      validationSummary,
      revenueSummary: {
        grossRevenue,
        refundedRevenue,
        netRevenue,
      },
      recentActivity: recentActivity.slice(0, 15),
    });
  } catch (error) {
    console.error('System monitoring error:', error);
    res.status(500).json({ error: 'Unable to fetch system monitoring data' });
  }
}

module.exports = {
  listAllUsers,
  getPendingOrganisers,
  approveOrganiserAccount,
  rejectOrganiserAccount,
  blockUserAccount,
  unblockUserAccount,
  deleteUser,
  getSystemMonitoring,
};

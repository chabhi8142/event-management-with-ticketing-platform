const express = require('express');
const router = express.Router();
const { authenticateFirebaseToken, optionalAuthenticateFirebaseToken, requireRole } = require('../middlewares/authMiddleware');
const {
  listEvents,
  listMyEvents,
  createEvent,
  getEventById,
  updateEvent,
  deleteEvent,
  publishEvent,
  cancelEvent,
} = require('../controllers/eventController');

// Public routes (optional authentication)
router.get('/', optionalAuthenticateFirebaseToken, listEvents);
router.get('/mine', authenticateFirebaseToken, requireRole(['organiser', 'admin']), listMyEvents);
router.get('/:eventId', optionalAuthenticateFirebaseToken, getEventById);

// Protected routes (require authentication)
router.use(authenticateFirebaseToken);

// Organizer and Admin routes (Admins can manage all, organisers can manage their own)
router.post('/', requireRole(['organiser', 'admin']), createEvent);
router.put('/:eventId', requireRole(['organiser', 'admin']), updateEvent);
router.delete('/:eventId', requireRole(['organiser', 'admin']), deleteEvent);
router.post('/:eventId/publish', requireRole(['organiser', 'admin']), publishEvent);
router.post('/:eventId/cancel', requireRole(['organiser', 'admin']), cancelEvent);

module.exports = router;

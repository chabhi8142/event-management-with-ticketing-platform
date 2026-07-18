const express = require('express');
const router = express.Router();
const { authenticateFirebaseToken, requireRole } = require('../middlewares/authMiddleware');
const {
  bookTicket,
  getMyTickets,
  getEventTickets,
  validateTicket,
  getTicketById,
  getValidationStatsByEvent,
  getOrganizerAnalytics,
} = require('../controllers/ticketController');

// Protected routes (require authentication)
router.use(authenticateFirebaseToken);

router.post('/book', bookTicket);
router.get('/my-tickets', getMyTickets);
router.get('/organizer/analytics', getOrganizerAnalytics);
router.post('/validate', requireRole(['organiser', 'admin']), validateTicket);
router.get('/event/:eventId', getEventTickets);
router.get('/event/:eventId/validation-stats', getValidationStatsByEvent);
router.get('/:ticketId', getTicketById);

module.exports = router;

const express = require('express');
const router = express.Router();
const { authenticateFirebaseToken, requireRole } = require('../middlewares/authMiddleware');
const {
  listAllUsers,
  getPendingOrganisers,
  approveOrganiserAccount,
  rejectOrganiserAccount,
  blockUserAccount,
  unblockUserAccount,
  deleteUser,
  getSystemMonitoring,
} = require('../controllers/adminController');

// All admin routes require authentication and admin role
router.use(authenticateFirebaseToken);
router.use(requireRole(['admin']));

// User management
router.get('/system-monitoring', getSystemMonitoring);
router.get('/users', listAllUsers);
router.post('/users/:userId/block', blockUserAccount);
router.post('/users/:userId/unblock', unblockUserAccount);
router.delete('/users/:userId', deleteUser);

// Organiser approval
router.get('/organisers/pending', getPendingOrganisers);
router.post('/organisers/:userId/approve', approveOrganiserAccount);
router.post('/organisers/:userId/reject', rejectOrganiserAccount);

module.exports = router;

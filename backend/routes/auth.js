const express = require('express');
const router = express.Router();
const {
  createUserAccount,
  loginUser,
  verifyIdToken,
  sendVerificationEmail,
  sendPasswordResetLink,
} = require('../controllers/authController');

router.post('/register', createUserAccount);
router.post('/login', loginUser);
router.post('/verify-token', verifyIdToken);
router.post('/send-verification-email', sendVerificationEmail);
router.post('/send-password-reset', sendPasswordResetLink);

module.exports = router;

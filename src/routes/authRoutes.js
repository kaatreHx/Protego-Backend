const express = require('express');
const router = express.Router();
const { register, login, resendOTP, verifyUser } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.post('/verify', verifyUser);
router.post('/resend-otp', resendOTP);

// Protected test route
router.get('/profile', authMiddleware, (req, res) => {
  res.json({ message: `Welcome, user ID: ${req.user.id}` });
});

module.exports = router;
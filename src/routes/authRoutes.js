const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);

// Protected test route
router.get('/profile', authMiddleware, (req, res) => {
  res.json({ message: `Welcome, user ID: ${req.user.id}` });
});

module.exports = router;
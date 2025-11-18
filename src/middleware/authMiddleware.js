const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Access denied. No token provided.' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id); // fetch full user
    if (!user) return res.status(401).json({ message: 'User not found' });

    req.user = user; // now you can use req.user._id
    next();
  } catch (err) {
    res.status(400).json({ message: 'Invalid token' });
  }
};

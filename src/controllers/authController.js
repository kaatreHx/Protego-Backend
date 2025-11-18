const User = require('../models/User');
const Org = require('../models/Org');
const KYC = require('../models/KYC');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      role, // 'user', 'org', or 'admin'
      companyName,
      companyAddress,
      profilePic,
      orgProfilePic,
      panNumber,
      docPic,
    } = req.body;

    // 1️⃣ Check common required fields
    if (!name || !email || !password || !role) {
      return res
        .status(400)
        .json({ message: 'Name, email, password, and role are required' });
    }

    // 2️⃣ Check role-specific required fields
    if (role === 'user' && !phone) {
      return res
        .status(400)
        .json({ message: 'Phone number is required for user registration' });
    }

    if (role === 'org') {
      if (!companyName) return res.status(400).json({ message: 'Company name is required' });
      if (!companyAddress) return res.status(400).json({ message: 'Company address is required' });
      if (!panNumber) return res.status(400).json({ message: 'PAN is required for KYC' });
      if (!docPic) return res.status(400).json({ message: 'Document image is required for KYC' });
    }

    // 3️⃣ Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // 4️⃣ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5️⃣ Create new user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      phone: phone || '',
      role,
      profilePic: profilePic || '', // default empty string
    });

    let organization = null;
    let kyc = null;

    // 6️⃣ Create organization if role is 'org'
    if (role === 'org') {
      organization = await Org.create({
        user: user._id,
        companyName,
        address: companyAddress || '',
        profilePic: orgProfilePic || '',
      });

      kyc = await KYC.create({
        org: organization._id,
        panNumber,
        docPic,
      });
    }

    res.status(201).json({
      message: 'Registration successful',
      user,
      organization, // null if role is not 'org'
      kyc, // null if role is not 'org'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1️⃣ Special admin login
    if (email === 'admin' && password === 'admin@123') {
      const adminToken = jwt.sign(
        { id: 'admin-id', email: 'admin', role: 'admin' }, // static admin id
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      return res.json({
        message: 'Admin login successful',
        token: adminToken,
        role: 'admin',
      });
    }

    // 2️⃣ Find user in DB
    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: 'Invalid email or password' });

    // 3️⃣ Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: 'Invalid email or password' });

    // 4️⃣ Create JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // 5️⃣ Respond with token and role
    res.json({
      message: 'Login successful',
      token,
      role: user.role,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error });
  }
};
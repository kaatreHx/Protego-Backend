const User = require('../models/User');
const Org = require('../models/Org');
const KYC = require('../models/KYC');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendOTPEmail } = require('../utils/MailSetup');

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
      profilePic: profilePic || '',
      isVerified: false,
      isBlocked: false,
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

    const otp = Math.floor(100000 + Math.random() * 900000);
    user.OTP = await bcrypt.hash(otp.toString(), 10);
    user.otpTime = Date.now();
    await user.save();

    await sendOTPEmail(user.email, otp);

    res.status(201).json({
      message: 'OTP sent successfully to your email.',
      user,
      organization, // null if role is not 'org'
      kyc, // null if role is not 'org'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.verifyUser = async function handleOTPVerify(req, res) {
  try {
    const { email, submittedOTP } = req.body;

    // Find user
    const userData = await User.findOne({ email });
    if (!userData) {
      return res.status(400).json({ message: 'Verification failed. No user found!' });
    }

    // Check if OTP exists
    if (!userData.OTP || !userData.otpTime) {
      return res.status(400).json({ message: 'No OTP request found. Please request a new OTP.' });
    }

    // Initialize otpAttempts if not present
    if (typeof userData.otpAttempts !== 'number') userData.otpAttempts = 0;

    // Check max attempts
    if (userData.otpAttempts >= 20) {
      return res.status(429).json({ message: 'Maximum OTP attempts reached. Please request a new OTP.' });
    }

    // Check OTP expiry (5 minutes)
    const expiryTime = userData.otpTime.getTime() + 5 * 60 * 1000;
    const now = Date.now();
    if (now > expiryTime) {
      // Invalidate expired OTP
      userData.OTP = undefined;
      userData.otpTime = undefined;
      userData.otpAttempts = 0;
      await userData.save();
      return res.status(401).json({ message: 'OTP has expired. Please request a new code.' });
    }

    // Compare OTP
    const isValid = await bcrypt.compare(submittedOTP.toString(), userData.OTP);
    if (!isValid) {
      userData.otpAttempts += 1; // increment failed attempt
      await userData.save();
      return res.status(401).json({ 
        message: `Invalid OTP. You have ${20 - userData.otpAttempts} attempts left.` 
      });
    }

    // OTP valid → mark user as verified
    userData.isVerified = true;

    // Clear OTP fields
    userData.OTP = undefined;
    userData.otpTime = undefined;
    userData.otpAttempts = 0; // reset attempts

    await userData.save();

    return res.status(200).json({ message: 'Verification successful!' });

  } catch (error) {
    console.error('OTP verification error:', error);
    return res.status(500).json({ message: 'Server error during OTP verification.' });
  }
};

exports.resendOTP = async function resendOTPUser(req, res) {
  const { email } = req.body;

  const userData = await User.findOne({ email: email });
  if (!userData) return res.status(400).json({ message: 'User not found' });
  const otp = Math.floor(100000 + Math.random() * 900000);
  userData.OTP = await bcrypt.hash(otp.toString(), 10);
  userData.otpTime = Date.now();
  await userData.save();

  await sendOTPEmail(userData.email, otp);

  res.status(200).json({ message: 'OTP sent successfully to your email.'});
}

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000);

  // Hash OTP before storing
  user.OTP = await bcrypt.hash(otp.toString(), 10);
  user.otpTime = Date.now();
  user.otpVerified = false;
  user.otpAttempts = 0; // reset failed attempts

  await user.save();

  // Send OTP email
  await passwordResetMail(user.email, otp);

  res.status(200).json({ message: 'Password reset OTP sent to your email.' });
};

exports.verifyPasswordResetOTP = async (req, res) => {
  const { email, submittedOTP } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).json({ message: 'No user found with this email.' });
  }

  // Check OTP expiry (5 minutes)
  const expiryTime = user.otpTime.getTime() + 5 * 60 * 1000;
  const now = Date.now();
  if (now > expiryTime) {
    user.OTP = undefined;
    user.otpTime = undefined;
    await user.save();
    return res.status(401).json({ message: 'OTP has expired. Request a new one.' });
  }

  // Check failed attempts (optional)
  if (user.otpAttempts >= 5) {
    return res.status(429).json({ message: 'Too many failed attempts. Request a new OTP.' });
  }

  // Compare OTP
  const isValid = await bcrypt.compare(submittedOTP.toString(), user.OTP);
  if (!isValid) {
    user.otpAttempts += 1;
    await user.save();
    return res.status(401).json({ message: 'Invalid OTP. Try again.' });
  }

  // OTP is valid
  user.otpVerified = true;
  await user.save();

  res.status(200).json({ message: 'OTP verified successfully. You can now reset your password.' });
};

exports.resetPassword = async (req, res) => {
  const { email, password, confirmPassword } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  // Ensure OTP was verified
  if (!user.otpVerified) {
    return res.status(403).json({ message: 'OTP not verified. Cannot reset password.' });
  }

  // Check password match
  if (password !== confirmPassword) {
    return res.status(400).json({ message: 'Passwords do not match.' });
  }

  // Hash and save new password
  user.password = await bcrypt.hash(password, 10);

  // Clear OTP data
  user.OTP = undefined;
  user.otpTime = undefined;
  user.otpVerified = false;
  user.otpAttempts = 0;

  await user.save();

  res.status(200).json({ message: 'Password reset successful!' });
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
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
  const { email, submittedOTP } = req.body;

  const userData = await User.findOne({ email: email });
  const expiryTime = userData.otpTime.getTime() + 5 * 60 * 1000;
  const now = Date.now();

  if (!userData) {
      return res.status(400).json({ message: 'Verification failed. No user found!' });
  }

  if (now > expiryTime) {
    return res.status(401).json({ message: 'OTP has expired. Please request a new code.' });
  }

  const resultCompare = await bcrypt.compare(submittedOTP.toString(), userData.OTP);
  if (resultCompare) {
    userData.isVerified = true;
    await userData.save();
    return res.status(200).json({ message: 'Verification successful!' });
  }
  else{
    return res.status(401).json({ message: 'Invalid OTP. Please check the code and try again.' });
  }

}

exports.resendOTP = async function resendOTPUser(req, res) {
  const { email } = req.body;

  const userData = await User.findOne({ email: email });
  const otp = Math.floor(100000 + Math.random() * 900000);
  userData.OTP = await bcrypt.hash(otp.toString(), 10);
  userData.otpTime = Date.now();
  await userData.save();

  await sendOTPEmail(userData.email, otp);

  res.status(200).json({ message: 'OTP sent successfully to your email.'});
}

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
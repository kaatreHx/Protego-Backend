const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true, 
      trim: true,
      match: [/.+\@.+\..+/, 'Please fill a valid email address'], 
    },
    phone: {
      type: String,
      required: false,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
      enum: ['user', 'admin', 'org'], 
      default: 'user',
    },
    profilePic: {
      type: String, 
      default: '',  
    },
    OTP: {
      type: String,
      default: '',
      required: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    otpTime: {
      type: Date,
      default: null,
    },
    otpVerified: { type: Boolean, default: false },
    otpAttempts: { type: Number, default: 0 }, 
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);

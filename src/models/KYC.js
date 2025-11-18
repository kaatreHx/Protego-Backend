const mongoose = require('mongoose');

const kycSchema = new mongoose.Schema(
  {
    org: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Org', 
      required: true,
    },
    panNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    docPic: {
      type: String, 
      required: false,
      default: '',
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'approved', 'rejected'], 
      default: 'pending',
    },
  },
  { timestamps: true } 
);

module.exports = mongoose.model('KYC', kycSchema);

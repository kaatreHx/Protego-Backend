const mongoose = require('mongoose');
const Org = require('./Org');

const staffSchema = new mongoose.Schema(
  {
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Org',
      required: true,
    },
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
      match: [/.+\@.+\..+/, 'Please fill a valid email address'],
    },
    phone: {
      type: String,
      required: false,
      unique: true,
      trim: true,
    },
    profilePic: {
      type: String, 
      default: '',  
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
  },
  { timestamps: true } // automatically adds createdAt and updatedAt
);

module.exports = mongoose.model('Staff', staffSchema);

const mongoose = require('mongoose');

const orgSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', 
      required: true,
    },
    companyName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    address: {
      type: String,
      required: false,
      trim: true,
    },
    profilePic: {
      type: String, 
      default: '',  
    }
  },
  { timestamps: true } 
);

module.exports = mongoose.model('Org', orgSchema);

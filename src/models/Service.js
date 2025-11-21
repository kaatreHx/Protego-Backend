const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Org',
      required: true,
    },
    types: {
      type: String,
      enum: ['service', 'product'],
      default: 'service',
    },
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },

    description: {
      type: String,
      required: false,
      trim: true,
    },

    price: {
      type: mongoose.Schema.Types.Decimal128,   // ⬅️ Decimal price
      required: true,
      min: 0,
      get: (value) => parseFloat(value.toString()),  // Convert for JSON
    },

    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    }
  },
  { 
    timestamps: true,
    toJSON: { getters: true },   // Ensure decimal converts to number
    toObject: { getters: true }
  }
);

module.exports = mongoose.model('Service', serviceSchema);

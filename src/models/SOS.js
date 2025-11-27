const mongoose = require("mongoose");

const sosSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  orgsNotified: [{ type: mongoose.Schema.Types.ObjectId, ref: "Org" }],
  location: { lat: Number, lng: Number },
  status: { type: String, enum: ["pending", "accepted", "completed", "cancelled"], default: "pending" },
  acceptedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Org", default: null },
  completedAt: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model("SOS", sosSchema);

const User = require('../models/User');

// ===============================
// Get all users
// ===============================
exports.listUsers = async (req, res) => {
  try {
    const { includeBlocked } = req.query;

    // If admin wants blocked users also
    const filter = includeBlocked === "true" ? {} : { isBlocked: false };

    const users = await User.find(filter).select("-password -OTP");
    res.status(200).json(users);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// Get single user
// ===============================
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password -OTP");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json(user);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// Update user (Only basic info)
// ===============================
exports.updateUser = async (req, res) => {
  try {
    const { name, email, phone, profilePic } = req.body;

    // Prevent email/phone duplication
    if (email) {
      const exists = await User.findOne({ email, _id: { $ne: req.params.id } });
      if (exists) return res.status(400).json({ message: "Email already exists" });
    }

    if (phone) {
      const exists = await User.findOne({ phone, _id: { $ne: req.params.id } });
      if (exists) return res.status(400).json({ message: "Phone already exists" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, phone, profilePic },
      { new: true, runValidators: true }
    ).select("-password -OTP");

    if (!updatedUser)
      return res.status(404).json({ message: "User not found" });

    res.status(200).json({ message: "User updated", user: updatedUser });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// Delete user
// ===============================
exports.deleteUser = async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);

    if (!deletedUser)
      return res.status(404).json({ message: "User not found" });

    // If org user is deleted, also delete organization entry
    if (deletedUser.role === "org" && typeof Org !== "undefined") {
      await Org.deleteOne({ user: deletedUser._id });
    }

    res.status(200).json({ message: "User deleted", user: deletedUser });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// Block User
// ===============================
exports.blockUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isBlocked: true },
      { new: true }
    ).select("-password -OTP");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ message: "User blocked", user });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// Unblock User
// ===============================
exports.unblockUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isBlocked: false },
      { new: true }
    ).select("-password -OTP");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ message: "User unblocked", user });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

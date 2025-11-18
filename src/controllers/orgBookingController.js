const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Org = require('../models/Org');

// Get all bookings for the organization
exports.listBookings = async (req, res) => {
  try {
    const org = await Org.findOne({ user: req.user.id });
    if (!org) return res.status(404).json({ message: 'Organization not found' });

    const bookings = await Booking.find({ organizationId: org._id })
      .populate('serviceId')
      .populate('userId');

    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Accept (confirm) a booking
exports.acceptBooking = async (req, res) => {
  try {
    const org = await Org.findOne({ user: req.user.id });
    if (!org) return res.status(404).json({ message: 'Organization not found' });

    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    if (booking.organizationId.toString() !== org._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to manage this booking' });
    }

    booking.status = 'confirmed';
    await booking.save();

    // Optionally update payment status
    await Payment.findOneAndUpdate({ bookingId: booking._id }, { paymentStatus: 'pending' });

    res.status(200).json({ message: 'Booking accepted', booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Cancel a booking (organization cancels)
exports.cancelBooking = async (req, res) => {
  try {
    const org = await Org.findOne({ user: req.user.id });
    if (!org) return res.status(404).json({ message: 'Organization not found' });

    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    if (booking.organizationId.toString() !== org._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to manage this booking' });
    }

    booking.status = 'cancelled';
    await booking.save();

    // Update payment status
    await Payment.findOneAndUpdate({ bookingId: booking._id }, { paymentStatus: 'cancelled' });

    res.status(200).json({ message: 'Booking cancelled by organization', booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

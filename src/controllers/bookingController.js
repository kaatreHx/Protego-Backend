const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Org = require('../models/Org');
const Service = require('../models/Service');

// Create a new booking and corresponding payment
exports.create = async (req, res) => {
  try {
    const { serviceId, requiredDate, contact, address } = req.body;

    // 1️⃣ Validate required fields
    if (!serviceId || !requiredDate || !address) {
      return res.status(400).json({ message: 'Service, required date, address, and payment method are required' });
    }

    // 2️⃣ Find service and organization
    const service = await Service.findById(serviceId);
    if (!service) return res.status(404).json({ message: 'Service not found' });

    const org = await Org.findById(service.organizationId);
    if (!org) return res.status(404).json({ message: 'Organization not found' });

    // 3️⃣ Create booking
    const booking = await Booking.create({
      userId: req.user.id,       // assuming auth middleware sets req.user.id
      organizationId: org._id,
      serviceId,
      requiredDate,
      contact: contact || '',
      address,
      status: 'pending'
    });

    // 4️⃣ Create payment linked to booking
    const payment = await Payment.create({
      userId: req.user.id,
      bookingId: booking._id,
      paymentMethod: 'other',
      paymentStatus: 'pending',
      statementPic: ''
    });

    res.status(201).json({
      message: 'Booking created successfully',
      booking,
      payment
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// Get all bookings for logged-in user
exports.list = async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user.id })
      .populate('serviceId')
      .populate('organizationId')
      .populate('userId');

    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single booking by ID
exports.get = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('serviceId')
      .populate('organizationId')
      .populate('userId');

    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    // Only owner can access
    if (booking.userId._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to view this booking' });
    }

    res.status(200).json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a booking (e.g., required date, contact, address)
exports.update = async (req, res) => {
  try {
    const { requiredDate, contact, address } = req.body;

    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    // Only owner can update
    if (booking.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this booking' });
    }

    booking.requiredDate = requiredDate || booking.requiredDate;
    booking.contact = contact || booking.contact;
    booking.address = address || booking.address;

    const updatedBooking = await booking.save();
    res.status(200).json(updatedBooking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Cancel a booking instead of deleting
exports.cancel = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    // Only owner can cancel
    if (booking.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to cancel this booking' });
    }

    booking.status = 'cancelled';
    await booking.save();

    // Optionally, update payment status
    await Payment.findOneAndUpdate(
      { bookingId: booking._id },
      { paymentStatus: 'cancelled' }
    );

    res.status(200).json({ message: 'Booking cancelled successfully', booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const express = require('express');
const router = express.Router();
const orgBookingController = require('../controllers/orgBookingController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware, orgBookingController.listBookings);

router.put('/accept/:id', authMiddleware, orgBookingController.acceptBooking);

router.put('/cancel/:id', authMiddleware, orgBookingController.cancelBooking);

module.exports = router;

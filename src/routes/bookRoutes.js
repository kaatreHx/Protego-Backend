const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, bookingController.create);
router.get('/', authMiddleware, bookingController.list);
router.get('/:id', authMiddleware, bookingController.get);
router.put('/:id', authMiddleware, bookingController.update);
router.delete('/:id', authMiddleware, bookingController.cancel);

module.exports = router;

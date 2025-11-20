const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware, userController.listUsers);

router.get('/:id', authMiddleware, userController.getUser);

router.put('/:id', authMiddleware, userController.updateUser);

router.delete('/:id', authMiddleware, userController.deleteUser);

router.put('/:id/block', authMiddleware, userController.blockUser);

router.put('/:id/unblock', authMiddleware, userController.unblockUser);

module.exports = router;

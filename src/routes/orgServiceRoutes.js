const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/orgServiceController'); 
const authMiddleware = require('../middleware/authMiddleware'); 

router.post('/', authMiddleware, serviceController.create);

router.get('/', authMiddleware, serviceController.list);

router.get('/:id', authMiddleware, serviceController.get);

router.put('/:id', authMiddleware, serviceController.update);

router.delete('/:id', authMiddleware, serviceController.remove);

module.exports = router;
 
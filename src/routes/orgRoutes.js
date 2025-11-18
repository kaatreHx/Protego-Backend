const express = require('express');
const router = express.Router();
const orgController = require('../controllers/orgController');
const authMiddleware = require('../middleware/authMiddleware');


router.get('/',  authMiddleware, orgController.listOrgs);

router.get('/:id', authMiddleware, orgController.getOrg);

router.put('/:id', authMiddleware, orgController.updateOrg);

router.delete('/:id', authMiddleware, orgController.deleteOrg);

module.exports = router;

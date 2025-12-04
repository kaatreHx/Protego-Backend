const express = require("express");
const router = express.Router();
const controller = require("../controllers/sosController");
const auth = require("../middleware/authMiddleware");

// User sends SOS
router.post("/create", auth, controller.createSOS);

// Org accepts SOS
router.post("/accept/:sosId", auth, controller.acceptSOS);

// User live location update
router.patch("/update-location/:sosId", auth, controller.updateLocation);

// Org gets pending SOS
router.get("/pending", auth, controller.getSOSForOrg);

module.exports = router;

const SOS = require("../models/SOS");
const io = require("../sockets/sosSocket");

exports.createSOS = async (req, res) => {
  const { lat, lng } = req.body;
  const userId = req.user.id;

  const sos = await SOS.create({
    userId,
    location: { lat, lng },
  });

  io.emit("new_sos", sos);

  res.json({ message: "SOS created", sos });
};

exports.acceptSOS = async (req, res) => {
  const orgId = req.user.id;
  const { sosId } = req.params;

  const sos = await SOS.findById(sosId);

  if (!sos) return res.status(404).json({ message: "SOS not found" });
  if (sos.status === "accepted") {
    return res.status(400).json({ message: "Already accepted" });
  }

  sos.status = "accepted";
  sos.acceptedBy = orgId;
  await sos.save();

  io.emit("sos_removed", sosId);

  res.json({ message: "SOS accepted", sos });
};

exports.updateLocation = async (req, res) => {
  const { lat, lng } = req.body;
  const { sosId } = req.params;

  await SOS.findByIdAndUpdate(sosId, {
    location: { lat, lng },
  });

  io.emit(`location_update_${sosId}`, { lat, lng });

  res.json({ message: "Location updated" });
};

exports.getSOSForOrg = async (req, res) => {
  try {
      const orgId = req.org.id; // from JWT

      // 1️⃣ Fetch pending SOS that notify this org
      const pendingSOS = await SOS.find({
          status: "pending",
          orgsNotified: orgId
      })
      .populate("userId", "name phone")
      .sort({ createdAt: -1 });

      // 2️⃣ Fetch SOS already accepted by this org
      const acceptedSOS = await SOS.find({
          status: "accepted",
          acceptedBy: orgId
      })
      .populate("userId", "name phone")
      .sort({ createdAt: -1 });

      return res.status(200).json({
          success: true,
          pending: pendingSOS,
          accepted: acceptedSOS
      });

  } catch (error) {
      console.error("Error fetching SOS:", error);
      res.status(500).json({
          success: false,
          message: "Server error while fetching SOS"
      });
  }
};

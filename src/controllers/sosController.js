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
  if (sos.status === "accepted") return res.status(400).json({ message: "Already accepted" });

  sos.status = "accepted";
  sos.acceptedBy = orgId;
  await sos.save();

  io.emit("sos_removed", sosId); // remove from other org dashboards

  res.json({ message: "SOS accepted", sos });
};

exports.updateLocation = async (req, res) => {
  const { lat, lng } = req.body;
  const { sosId } = req.params;

  const sos = await SOS.findById(sosId);
  if (!sos) return res.status(404).json({ message: "SOS not found" });
  if (sos.status !== "accepted") {
    return res.status(400).json({ message: "SOS not active or completed" });
  }

  sos.location = { lat, lng };
  await sos.save();

  io.emit(`location_update_${sosId}`, sos.location);

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

exports.completeSOS = async (req, res) => {
  const { sosId } = req.params;
  const orgId = req.user.id;

  const sos = await SOS.findById(sosId);
  if (!sos) return res.status(404).json({ message: "SOS not found" });
  if (sos.acceptedBy.toString() !== orgId) return res.status(403).json({ message: "Not authorized" });

  sos.status = "completed";
  sos.completedAt = new Date();
  await sos.save();

  io.emit("sos_completed", sosId); // notify frontend

  res.json({ message: "SOS completed", sos });
};
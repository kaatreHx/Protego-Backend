const Org = require('../models/Org');
const User = require('../models/User');

// Get all organizations
exports.listOrgs = async (req, res) => {
  try {
    const orgs = await Org.find().populate('user', 'name email role');
    res.status(200).json(orgs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single organization
exports.getOrg = async (req, res) => {
  try {
    const org = await Org.findById(req.params.id).populate('user', 'name email role');
    if (!org) return res.status(404).json({ message: 'Organization not found' });

    res.status(200).json(org);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update organization
exports.updateOrg = async (req, res) => {
  try {
    const { companyName, address, profilePic } = req.body;

    const updatedOrg = await Org.findByIdAndUpdate(
      req.params.id,
      { companyName, address, profilePic },
      { new: true, runValidators: true }
    );

    if (!updatedOrg) return res.status(404).json({ message: 'Organization not found' });

    res.status(200).json({ message: 'Organization updated', updatedOrg });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete organization
exports.deleteOrg = async (req, res) => {
  try {
    const deletedOrg = await Org.findByIdAndDelete(req.params.id);
    if (!deletedOrg) return res.status(404).json({ message: 'Organization not found' });

    // Optional: also delete the user associated with this org
    await User.findByIdAndDelete(deletedOrg.user);

    res.status(200).json({ message: 'Organization deleted', deletedOrg });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

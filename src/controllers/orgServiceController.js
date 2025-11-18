const Service = require('../models/Service');
const Org = require('../models/Org');

// Create a new service
exports.create = async (req, res) => {
  try {
    const { name, description, price } = req.body;

    // Find organization of logged-in user
    const org = await Org.findOne({ user: req.user._id });
    if (!org) return res.status(400).json({ message: 'Organization not found for this user' });

    const service = new Service({
      organizationId: org._id,
      name,
      description,
      price,
      status: 'active',
    });

    const savedService = await service.save();
    res.status(201).json(savedService);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Service name must be unique' });
    }
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// Get all services for the logged-in organization
exports.list = async (req, res) => {
  try {
    const org = await Org.findOne({ user: req.user._id });
    if (!org) return res.status(400).json({ message: 'Organization not found for this user' });

    const services = await Service.find({ organizationId: org._id }).populate('organizationId');
    res.status(200).json(services);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single service by ID
exports.get = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id).populate('organizationId');
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    // Optional: check if logged-in user owns this service
    const org = await Org.findOne({ user: req.user._id });
    if (!org || service.organizationId._id.toString() !== org._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this service' });
    }

    res.status(200).json(service);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a service by ID
exports.update = async (req, res) => {
  try {
    const { name, description, price, status } = req.body;

    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ message: 'Service not found' });

    // Check ownership
    const org = await Org.findOne({ user: req.user._id });
    if (!org || service.organizationId.toString() !== org._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this service' });
    }

    service.name = name || service.name;
    service.description = description || service.description;
    service.price = price !== undefined ? price : service.price;
    service.status = status || service.status;

    const updatedService = await service.save();
    res.status(200).json(updatedService);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Service name must be unique' });
    }
    res.status(500).json({ message: error.message });
  }
};

// Delete a service by ID
exports.remove = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ message: 'Service not found' });

    // Check ownership
    const org = await Org.findOne({ user: req.user._id });
    if (!org || service.organizationId.toString() !== org._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this service' });
    }

    await Service.deleteOne({ _id: req.params.id });
    res.status(200).json({ message: 'Service deleted successfully', service });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

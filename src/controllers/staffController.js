const Staff = require('../models/Staff'); 


const getOrgId = (req) => {
    return req.user ? req.user.orgId : req.body.orgId; 
};


exports.createStaff = async (req, res) => {
    try {
        const orgId = getOrgId(req);
        if (!orgId) {
            return res.status(401).json({ message: 'Organization context is missing.' });
        }
        
        // Ensure the new staff member is associated with the correct organization
        const newStaffData = { ...req.body, orgId: orgId, status: 'active' };
        
        const newStaff = new Staff(newStaffData);
        const savedStaff = await newStaff.save();
        
        return res.status(201).json(savedStaff);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                message: 'A staff member with this email or phone already exists.',
                fields: Object.keys(error.keyValue),
            });
        }
        return res.status(400).json({ message: 'Error creating staff member.', error: error.message });
    }
};

exports.getAllStaff = async (req, res) => {
    try {
        const orgId = getOrgId(req);
        if (!orgId) {
            return res.status(401).json({ message: 'Organization context is missing.' });
        }
        
        // Find staff members belonging only to the given organization
        const staffList = await Staff.find({ 
            orgId: orgId, 
            status: 'active' // Filter to show only active staff by default
        }).select('-__v'); // Exclude the Mongoose version key
        
        return res.status(200).json(staffList);
    } catch (error) {
        return res.status(500).json({ message: 'Error retrieving staff list.', error: error.message });
    }
};

exports.getStaffById = async (req, res) => {
    try {
        const orgId = getOrgId(req);
        if (!orgId) {
            return res.status(401).json({ message: 'Organization context is missing.' });
        }
        
        const staffId = req.params.id;
        
        // Find by ID and ensure it belongs to the organization
        const staff = await Staff.findOne({ _id: staffId, orgId: orgId });
        
        if (!staff) {
            return res.status(404).json({ message: 'Staff member not found in this organization.' });
        }
        return res.status(200).json(staff);
    } catch (error) {
        return res.status(500).json({ message: 'Error retrieving staff member.', error: error.message });
    }
};

exports.updateStaff = async (req, res) => {
    try {
        const orgId = getOrgId(req);
        if (!orgId) {
            return res.status(401).json({ message: 'Organization context is missing.' });
        }
        
        const staffId = req.params.id;
        
        // Note: Prevent accidental changes to orgId
        const updates = { ...req.body };
        delete updates.orgId; 
        
        const updatedStaff = await Staff.findOneAndUpdate(
            { _id: staffId, orgId: orgId }, // Filter by ID AND OrgId for security
            updates,
            { new: true, runValidators: true }
        );

        if (!updatedStaff) {
            return res.status(404).json({ message: 'Staff member not found or does not belong to your organization.' });
        }
        return res.status(200).json(updatedStaff);
    } catch (error) {
        return res.status(400).json({ message: 'Error updating staff member.', error: error.message });
    }
};

exports.deactivateStaff = async (req, res) => {
    try {
        const orgId = getOrgId(req);
        if (!orgId) {
            return res.status(401).json({ message: 'Organization context is missing.' });
        }
        
        const staffId = req.params.id;

        // Find and update the 'status' field, ensuring organization scoping
        const deactivatedStaff = await Staff.findOneAndUpdate(
            { _id: staffId, orgId: orgId },
            { status: 'inactive' }, // Set the status to inactive (suspended)
            { new: true } 
        );

        if (!deactivatedStaff) {
            return res.status(404).json({ message: 'Staff member not found or already inactive.' });
        }

        return res.status(200).json({
            message: `Staff member '${deactivatedStaff.name}' has been successfully deactivated (status: inactive).`,
            staff: deactivatedStaff,
        });

    } catch (error) {
        return res.status(500).json({
            message: 'Error deactivating staff member.',
            error: error.message,
        });
    }
};

exports.deleteStaff = async (req, res) => {
    try {
        const orgId = getOrgId(req);
        if (!orgId) {
            return res.status(401).json({ message: 'Organization context is missing.' });
        }
        
        const staffId = req.params.id;
        
        // Find and delete, ensuring organization scoping
        const deletedStaff = await Staff.findOneAndDelete({ _id: staffId, orgId: orgId });

        if (!deletedStaff) {
            return res.status(404).json({ message: 'Staff member not found or does not belong to your organization.' });
        }
        return res.status(200).json({ message: 'Staff member successfully deleted.' });
    } catch (error) {
        return res.status(500).json({ message: 'Error deleting staff member.', error: error.message });
    }
};
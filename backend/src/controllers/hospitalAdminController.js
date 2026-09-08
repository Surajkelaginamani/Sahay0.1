import User from '../models/User.js';

const STAFF_ROLES = ['ASHA', 'Doctor', 'LabHead', 'FacilityAdmin', 'Receptionist', 'Nurse'];

// @desc    Create a staff member for the admin's hospital
// @route   POST /api/hospital/create-staff
// @access  Private (HospitalAdmin only)
export const createStaff = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        message: 'Please provide all required fields: name, email, password, role',
      });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (cleanPassword.length < 6) {
      return res.status(400).json({
        message: 'Password must be at least 6 characters long',
      });
    }

    if (!STAFF_ROLES.includes(role)) {
      return res.status(400).json({
        message: `Invalid role. Must be one of: ${STAFF_ROLES.join(', ')}`,
      });
    }

    const userExists = await User.findOne({ email: cleanEmail });
    if (userExists) {
      return res.status(400).json({ message: 'A user with this email already exists' });
    }

    // Attach the admin's hospitalId to the new staff member
    const staffMember = await User.create({
      name: cleanName,
      email: cleanEmail,
      password: cleanPassword,
      role,
      hospitalId: req.user.hospitalId,
    });

    res.status(201).json({
      message: `Staff member (${role}) created successfully`,
      staff: {
        _id: staffMember._id,
        name: staffMember.name,
        email: staffMember.email,
        role: staffMember.role,
        hospitalId: staffMember.hospitalId,
        createdAt: staffMember.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all staff members for the admin's hospital
// @route   GET /api/hospital/staff
// @access  Private (HospitalAdmin only)
export const getHospitalStaff = async (req, res) => {
  try {
    const staffList = await User.find({
      hospitalId: req.user.hospitalId,
      role: { $in: STAFF_ROLES },
    })
      .select('-password')
      .sort({ createdAt: -1 });

    res.json(staffList);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reset password for a staff member
// @route   PUT /api/hospital/staff/:id/password
// @access  Private (HospitalAdmin only)
export const resetStaffPassword = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password || password.trim().length < 6) {
      return res.status(400).json({
        message: 'New password must be at least 6 characters long',
      });
    }

    const staff = await User.findOne({
      _id: req.params.id,
      hospitalId: req.user.hospitalId,
    });

    if (!staff) {
      return res.status(404).json({
        message: 'Staff member not found in your hospital facility',
      });
    }

    staff.password = password.trim();
    await staff.save();

    res.json({
      message: `Password for ${staff.name} (${staff.role}) updated successfully.`,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete/remove a staff member from the hospital
// @route   DELETE /api/hospital/staff/:id
// @access  Private (HospitalAdmin only)
export const deleteStaff = async (req, res) => {
  try {
    const staff = await User.findOne({
      _id: req.params.id,
      hospitalId: req.user.hospitalId,
    });

    if (!staff) {
      return res.status(404).json({
        message: 'Staff member not found in your hospital facility',
      });
    }

    await User.deleteOne({ _id: staff._id });

    res.json({
      message: `Staff member ${staff.name} has been removed from your hospital registry.`,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


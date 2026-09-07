import User from '../models/User.js';

const STAFF_ROLES = ['ASHA', 'Doctor', 'LabHead', 'FacilityAdmin'];

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

    if (!STAFF_ROLES.includes(role)) {
      return res.status(400).json({
        message: `Invalid role. Must be one of: ${STAFF_ROLES.join(', ')}`,
      });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'A user with this email already exists' });
    }

    // Attach the admin's hospitalId to the new staff member
    const staffMember = await User.create({
      name,
      email,
      password,
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

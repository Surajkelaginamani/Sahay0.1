import Hospital from '../models/Hospital.js';
import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';

// @desc    Register a new Hospital and its Hospital Admin
// @route   POST /api/hospital-auth/register
// @access  Public
export const registerHospitalAdmin = async (req, res) => {
  try {
    const {
      hospitalName,
      registrationNumber,
      address,
      contactPhone,
      adminName,
      adminEmail,
      password,
    } = req.body;

    if (
      !hospitalName ||
      !registrationNumber ||
      !address ||
      !contactPhone ||
      !adminName ||
      !adminEmail ||
      !password
    ) {
      return res.status(400).json({
        message:
          'Please provide all required fields: hospitalName, registrationNumber, address, contactPhone, adminName, adminEmail, password',
      });
    }

    const hospitalExists = await Hospital.findOne({ registrationNumber });
    if (hospitalExists) {
      return res.status(400).json({
        message: 'A hospital with this registration number is already registered',
      });
    }

    const userExists = await User.findOne({ email: adminEmail });
    if (userExists) {
      return res.status(400).json({
        message: 'A user with this admin email is already registered',
      });
    }

    // Create the Hospital document with verificationStatus 'pending'
    const hospital = await Hospital.create({
      hospitalName,
      registrationNumber,
      address,
      contactPhone,
      adminEmail,
      verificationStatus: 'pending',
    });

    // Create the User document for the Hospital Admin linked to the hospital
    const user = await User.create({
      name: adminName,
      email: adminEmail,
      password,
      role: 'HospitalAdmin',
      hospitalId: hospital._id,
    });

    res.status(201).json({
      message:
        'Hospital registered successfully. Verification is pending government approval.',
      hospital,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        hospitalId: user.hospitalId,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Authenticate Hospital Admin & check verification status
// @route   POST /api/hospital-auth/login
// @access  Public
export const loginHospitalAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const cleanEmail = email.trim();
    console.log(`[Hospital Login] Attempt for email: "${cleanEmail}"`);

    // Case-insensitive query for HospitalAdmin
    const escapedEmail = cleanEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    let user = await User.findOne({
      email: { $regex: new RegExp(`^${escapedEmail}$`, 'i') },
      role: 'HospitalAdmin',
    });

    // Handle common typo: @gmail.com entered when registered with @gail.com (or vice versa)
    if (!user) {
      let alternateEmail = null;
      if (cleanEmail.toLowerCase().endsWith('@gmail.com')) {
        alternateEmail = cleanEmail.replace(/@gmail\.com$/i, '@gail.com');
      } else if (cleanEmail.toLowerCase().endsWith('@gail.com')) {
        alternateEmail = cleanEmail.replace(/@gail\.com$/i, '@gmail.com');
      }

      if (alternateEmail) {
        const escapedAlt = alternateEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        user = await User.findOne({
          email: { $regex: new RegExp(`^${escapedAlt}$`, 'i') },
          role: 'HospitalAdmin',
        });
        if (user) {
          console.log(`[Hospital Login] Matched alternate typo email: "${user.email}" for entered: "${cleanEmail}"`);
        }
      }
    }

    if (!user) {
      console.log(`[Hospital Login] No HospitalAdmin found for email: "${cleanEmail}"`);
      return res.status(401).json({
        message: 'Invalid admin credentials: No hospital admin account found with this email',
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      console.log(`[Hospital Login] Password mismatch for user: "${user.email}"`);
      return res.status(401).json({
        message: 'Invalid admin credentials: Password does not match',
      });
    }

    const hospital = await Hospital.findById(user.hospitalId);

    if (!hospital) {
      return res.status(404).json({ message: 'Associated hospital record not found' });
    }

    // Check verification status case-insensitively
    const vStatus = (hospital.verificationStatus || hospital.status || '').toLowerCase();

    if (vStatus === 'pending') {
      return res.status(403).json({
        message:
          'Access denied: Hospital verification is currently pending government approval.',
        verificationStatus: hospital.verificationStatus || 'pending',
      });
    }

    if (vStatus === 'rejected') {
      return res.status(403).json({
        message:
          'Access denied: Hospital registration has been rejected by government authorities.',
        verificationStatus: hospital.verificationStatus || 'rejected',
      });
    }

    console.log(`[Hospital Login] SUCCESS for user: "${user.email}", Hospital: "${hospital.hospitalName}"`);

    // Verification approved: issue JWT token
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      hospitalId: user.hospitalId,
      hospitalName: hospital.hospitalName,
      verificationStatus: hospital.verificationStatus || 'approved',
      token: generateToken(user._id, user.role),
    });
  } catch (error) {
    console.error('[Hospital Login] Error:', error);
    res.status(500).json({ message: error.message });
  }
};


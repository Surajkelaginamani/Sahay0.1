import Patient from '../../models/Patient.js';
import Appointment from '../../models/Appointment.js';
import User from '../../models/User.js';
import bcrypt from 'bcrypt';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns the start (00:00:00.000) and end (23:59:59.999) of today in UTC
 * so Mongoose date-range queries cover the full calendar day.
 */
function getTodayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

// ─── registerPatient ──────────────────────────────────────────────────────────
// @route   POST /api/receptionist/patient
// @access  Private (Receptionist)
export const registerPatient = async (req, res) => {
  let createdUser = null; // track so we can roll back on Patient failure

  try {
    const {
      firstName, lastName, dob, gender,
      contactPhone, address, abhaId,
      email, password,
    } = req.body;

    // ── Required field validation ──────────────────────────────────────────────
    if (!firstName || !lastName || !dob || !gender) {
      return res.status(400).json({
        message: 'firstName, lastName, dob, and gender are required.',
      });
    }

    if (!email || !password) {
      return res.status(400).json({
        message: 'email and password are required to create a patient login account.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    // ── Duplicate phone check ──────────────────────────────────────────────────
    if (contactPhone) {
      const phoneExists = await Patient.findOne({ contactPhone: contactPhone.trim() });
      if (phoneExists) {
        return res.status(400).json({
          message: `A patient with phone ${contactPhone} is already registered.`,
          existingPatient: {
            _id: phoneExists._id,
            fullName: `${phoneExists.firstName} ${phoneExists.lastName}`,
            contactPhone: phoneExists.contactPhone,
          },
        });
      }
    }

    // ── Duplicate email check ──────────────────────────────────────────────────
    const emailExists = await User.findOne({ email: email.trim().toLowerCase() });
    if (emailExists) {
      return res.status(400).json({
        message: `An account with email ${email.trim()} already exists.`,
      });
    }

    // ── Step 1: Create User login account ─────────────────────────────────────
    // User.pre('save') will hash the password automatically
    const fullName = `${firstName.trim()} ${lastName.trim()}`;
    createdUser = await User.create({
      name:     fullName,
      email:    email.trim().toLowerCase(),
      password, // hashed by pre-save hook in User.js
      role:     'Patient',
      hospitalId: null,
    });

    // ── Step 2: Create Patient medical profile linked to User ─────────────────
    const patient = await Patient.create({
      firstName:            firstName.trim(),
      lastName:             lastName.trim(),
      dob:                  new Date(dob),
      gender,
      contactPhone:         contactPhone?.trim()  || undefined,
      address:              address               || {},
      abhaId:               abhaId?.trim()        || undefined,
      registeredAtFacility: req.user.hospitalId,
      userId:               createdUser._id,
    });

    res.status(201).json({
      message: 'Patient registered successfully with a login account.',
      patient: {
        _id:                  patient._id,
        fullName:             `${patient.firstName} ${patient.lastName}`,
        dob:                  patient.dob,
        gender:               patient.gender,
        contactPhone:         patient.contactPhone,
        abhaId:               patient.abhaId,
        registeredAtFacility: patient.registeredAtFacility,
        userId:               createdUser._id,
        email:                createdUser.email,
        createdAt:            patient.createdAt,
      },
    });
  } catch (error) {
    // Roll back: if Patient creation fails after User was created, delete the orphan User
    if (createdUser) {
      await User.findByIdAndDelete(createdUser._id).catch(() => null);
    }

    // Handle Mongoose duplicate key (abhaId unique index)
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || 'field';
      return res.status(400).json({
        message: `A patient with this ${field} already exists.`,
      });
    }

    res.status(500).json({ message: error.message });
  }
};


// ─── searchPatients ───────────────────────────────────────────────────────────
// @route   GET /api/receptionist/patient/search?q=<name|phone>
// @access  Private (Receptionist)
export const searchPatients = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        message: 'Search query must be at least 2 characters.',
      });
    }

    const term = q.trim();

    // Build OR query: phone exact match OR name partial match (case-insensitive)
    const isPhone = /^\d+$/.test(term);

    const filter = isPhone
      ? { contactPhone: { $regex: term, $options: 'i' } }
      : {
          $or: [
            { firstName: { $regex: term, $options: 'i' } },
            { lastName:  { $regex: term, $options: 'i' } },
          ],
        };

    // Scope to the receptionist's facility
    filter.registeredAtFacility = req.user.hospitalId;

    const patients = await Patient.find(filter)
      .select('firstName lastName dob gender contactPhone abhaId registeredAtFacility createdAt')
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    res.json({
      count: patients.length,
      patients: patients.map((p) => ({
        ...p,
        fullName: `${p.firstName} ${p.lastName}`,
      })),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── createAppointment ────────────────────────────────────────────────────────
// @route   POST /api/receptionist/appointment
// @access  Private (Receptionist)
export const createAppointment = async (req, res) => {
  try {
    const {
      patientId, appointmentDate, assignedDoctorId,
      visitType, chiefComplaint, timeSlot, staffNotes,
    } = req.body;

    if (!patientId || !appointmentDate) {
      return res.status(400).json({
        message: 'patientId and appointmentDate are required.',
      });
    }

    // Verify patient belongs to this facility
    const patient = await Patient.findOne({
      _id: patientId,
      registeredAtFacility: req.user.hospitalId,
    });
    if (!patient) {
      return res.status(404).json({
        message: 'Patient not found in your facility.',
      });
    }

    const appointment = await Appointment.create({
      patientId,
      facilityId:       req.user.hospitalId,
      receptionistId:   req.user._id,
      assignedDoctorId: assignedDoctorId || null,
      appointmentDate:  new Date(appointmentDate),
      status:           'Scheduled',
      visitType:        visitType?.trim()       || undefined,
      chiefComplaint:   chiefComplaint?.trim()  || undefined,
      timeSlot:         timeSlot?.trim()        || undefined,
      staffNotes:       staffNotes?.trim()      || undefined,
    });

    await appointment.populate([
      { path: 'patientId',         select: 'firstName lastName contactPhone' },
      { path: 'assignedDoctorId',  select: 'name' },
    ]);

    res.status(201).json({
      message: 'Appointment scheduled successfully.',
      appointment,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── checkInPatient ───────────────────────────────────────────────────────────
// @route   PATCH /api/receptionist/appointment/:id/checkin
// @access  Private (Receptionist)
export const checkInPatient = async (req, res) => {
  try {
    const appointment = await Appointment.findOne({
      _id:        req.params.id,
      facilityId: req.user.hospitalId,
    });

    if (!appointment) {
      return res.status(404).json({
        message: 'Appointment not found in your facility.',
      });
    }

    if (appointment.status === 'CheckedIn') {
      return res.status(400).json({
        message: 'Patient is already checked in.',
        queueNumber: appointment.queueNumber,
      });
    }

    if (['Completed', 'Cancelled'].includes(appointment.status)) {
      return res.status(400).json({
        message: `Cannot check in — appointment is already '${appointment.status}'.`,
      });
    }

    // Assign daily sequential queue number:
    // Count how many appointments at this facility are already CheckedIn today
    const { start, end } = getTodayRange();
    const checkedInCount = await Appointment.countDocuments({
      facilityId:      req.user.hospitalId,
      status:          'CheckedIn',
      appointmentDate: { $gte: start, $lte: end },
    });

    appointment.status      = 'CheckedIn';
    appointment.queueNumber = checkedInCount + 1;
    await appointment.save();

    await appointment.populate([
      { path: 'patientId',        select: 'firstName lastName contactPhone' },
      { path: 'assignedDoctorId', select: 'name' },
    ]);

    res.json({
      message: `Patient checked in. Queue number: ${appointment.queueNumber}.`,
      appointment,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── getTodayQueue ────────────────────────────────────────────────────────────
// @route   GET /api/receptionist/queue/today
// @access  Private (Receptionist)
export const getTodayQueue = async (req, res) => {
  try {
    const { start, end } = getTodayRange();

    const { status } = req.query; // optional filter e.g. ?status=CheckedIn

    const filter = {
      facilityId:      req.user.hospitalId,
      appointmentDate: { $gte: start, $lte: end },
    };

    if (status && ['Scheduled', 'CheckedIn', 'Completed', 'Cancelled'].includes(status)) {
      filter.status = status;
    }

    const queue = await Appointment.find(filter)
      .populate('patientId',        'firstName lastName contactPhone gender')
      .populate('assignedDoctorId', 'name')
      .populate('receptionistId',   'name')
      .sort({ queueNumber: 1, createdAt: 1 }) // checked-in first (by queue#), then scheduled
      .lean();

    // Attach computed fullName for convenience
    const enriched = queue.map((appt) => ({
      ...appt,
      patientFullName: appt.patientId
        ? `${appt.patientId.firstName} ${appt.patientId.lastName}`
        : 'Unknown',
    }));

    // Summary counts
    const summary = {
      total:     enriched.length,
      scheduled: enriched.filter((a) => a.status === 'Scheduled').length,
      checkedIn: enriched.filter((a) => a.status === 'CheckedIn').length,
      completed: enriched.filter((a) => a.status === 'Completed').length,
      cancelled: enriched.filter((a) => a.status === 'Cancelled').length,
    };

    res.json({ summary, queue: enriched });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

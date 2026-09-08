import Appointment from '../../models/Appointment.js';
import Vitals from '../../models/Vitals.js';

// ─── Helper to calculate BMI ──────────────────────────────────────────────────
function calculateBMI(heightCm, weightKg) {
  const h = parseFloat(heightCm);
  const w = parseFloat(weightKg);
  if (!h || !w || h <= 0 || w <= 0) return null;
  const meters = h / 100;
  const bmi = w / (meters * meters);
  return bmi.toFixed(1);
}

// ─── getTriageQueue ───────────────────────────────────────────────────────────
// @route   GET /api/nurse/queue
// @access  Private (Nurse)
// Queries appointments for the nurse's facility where status is 'At Triage' or 'CheckedIn'.
export const getTriageQueue = async (req, res) => {
  try {
    const facilityId = req.user.hospitalId;
    if (!facilityId) {
      return res.status(400).json({ message: 'Nurse account is not linked to a hospital facility.' });
    }

    // Query appointments waiting for vitals / triage
    const appointments = await Appointment.find({
      facilityId,
      status: { $in: ['At Triage', 'CheckedIn'] },
    })
      .populate('patientId', 'firstName lastName contactPhone gender dob abhaId bloodGroup address emergencyContact')
      .populate('assignedDoctorId', 'name email')
      .lean();

    // Sort: Urgent triage patients first, then by queueNumber or appointmentDate
    appointments.sort((a, b) => {
      const aUrgent = a.priority === 'Urgent';
      const bUrgent = b.priority === 'Urgent';
      if (aUrgent && !bUrgent) return -1;
      if (!aUrgent && bUrgent) return 1;

      if (a.queueNumber && b.queueNumber) return a.queueNumber - b.queueNumber;

      const dateA = new Date(a.appointmentDate || a.createdAt).getTime();
      const dateB = new Date(b.appointmentDate || b.createdAt).getTime();
      return dateA - dateB;
    });

    // Enrich with computed patientFullName
    const enriched = appointments.map((appt) => ({
      ...appt,
      patientFullName: appt.patientId
        ? `${appt.patientId.firstName} ${appt.patientId.lastName}`
        : 'Unknown Patient',
    }));

    // Metrics summary
    const summary = {
      total:    enriched.length,
      urgent:   enriched.filter((a) => a.priority === 'Urgent').length,
      routine:  enriched.filter((a) => a.priority !== 'Urgent').length,
      atTriage: enriched.filter((a) => a.status === 'At Triage').length,
    };

    res.status(200).json({
      count: enriched.length,
      summary,
      queue: enriched,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── captureVitals ────────────────────────────────────────────────────────────
// @route   POST /api/nurse/vitals
// @access  Private (Nurse)
// Captures patient vitals, saves a Vitals record, and transitions appointment to 'Waiting for Doctor'.
export const captureVitals = async (req, res) => {
  try {
    const {
      appointmentId,
      bloodPressure,
      bloodSugar,
      height,
      weight,
      temperature,
      pulse,
      spO2,
      notes,
    } = req.body;

    if (!appointmentId) {
      return res.status(400).json({ message: 'Appointment ID is required.' });
    }

    if (!bloodPressure || !bloodSugar || !height || !weight) {
      return res.status(400).json({
        message: 'Please provide all core vitals: Blood Pressure, Blood Sugar, Height, and Weight.',
      });
    }

    // Verify appointment exists
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found.' });
    }

    const facilityId = req.user.hospitalId || appointment.facilityId;
    const patientId = appointment.patientId;
    const nurseId = req.user._id;

    // Calculate BMI
    const computedBmi = calculateBMI(height, weight);

    // 1. Create Vitals record (Prompt 6.2)
    const vitalsRecord = await Vitals.create({
      appointmentId,
      patientId,
      nurseId,
      facilityId,
      bloodPressure: String(bloodPressure).trim(),
      bloodSugar:    String(bloodSugar).trim(),
      height:        String(height).trim(),
      weight:        String(weight).trim(),
      temperature:   temperature ? String(temperature).trim() : undefined,
      pulse:         pulse ? String(pulse).trim() : undefined,
      spO2:          spO2 ? String(spO2).trim() : undefined,
      bmi:           computedBmi || undefined,
      notes:         notes?.trim() || undefined,
    });

    // 2. Snapshot vitals directly on the appointment document
    appointment.vitals = {
      bloodPressure: String(bloodPressure).trim(),
      bloodSugar:    String(bloodSugar).trim(),
      height:        String(height).trim(),
      weight:        String(weight).trim(),
      temperature:   temperature ? String(temperature).trim() : undefined,
      pulse:         pulse ? String(pulse).trim() : undefined,
      spO2:          spO2 ? String(spO2).trim() : undefined,
      bmi:           computedBmi || undefined,
      notes:         notes?.trim() || undefined,
      recordedBy:    nurseId,
      recordedAt:    new Date(),
    };

    // 3. Immediately update Appointment status from 'At Triage' to 'Waiting for Doctor' (Prompt 6.2)
    appointment.status = 'Waiting for Doctor';
    await appointment.save();

    await appointment.populate([
      { path: 'patientId', select: 'firstName lastName contactPhone gender dob' },
      { path: 'assignedDoctorId', select: 'name email' },
    ]);

    res.status(201).json({
      message: 'Vitals captured successfully. Patient forwarded to Doctor queue.',
      vitals: vitalsRecord,
      appointment,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

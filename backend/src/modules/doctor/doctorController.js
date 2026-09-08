import Appointment from '../../models/Appointment.js';
import Consultation from '../../models/Consultation.js';
import Patient from '../../models/Patient.js';

// ─── getDoctorQueue ───────────────────────────────────────────────────────────
// @route   GET /api/doctor/queue
// @access  Private (Doctor)
// Returns all waiting and checked-in patients assigned to the logged-in doctor,
// prioritized with 'Urgent' triage first, then chronologically / sequential queue.
export const getDoctorQueue = async (req, res) => {
  try {
    const doctorId = req.user._id;

    // Fetch appointments where assignedDoctorId is this doctor and status is Waiting, CheckedIn, or Waiting for Doctor
    const appointments = await Appointment.find({
      assignedDoctorId: doctorId,
      status: { $in: ['Waiting', 'CheckedIn', 'Waiting for Doctor'] },
    })
      .populate('patientId', 'firstName lastName contactPhone gender dob abhaId address bloodGroup emergencyContact')
      .populate('facilityId', 'hospitalName address')
      .lean();

    // Explicit JS sort to guarantee Urgent first, then chronological
    appointments.sort((a, b) => {
      // Urgent first
      const aUrgent = a.priority === 'Urgent';
      const bUrgent = b.priority === 'Urgent';
      if (aUrgent && !bUrgent) return -1;
      if (!aUrgent && bUrgent) return 1;

      // If both same priority, triaged/checked in before generic waiting
      const aActive = ['CheckedIn', 'Waiting for Doctor'].includes(a.status);
      const bActive = ['CheckedIn', 'Waiting for Doctor'].includes(b.status);
      if (aActive && !bActive) return -1;
      if (!aActive && bActive) return 1;

      // Sequential queueNumber if available
      if (a.queueNumber && b.queueNumber) return a.queueNumber - b.queueNumber;

      // Otherwise chronological by appointmentDate / createdAt
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

    // Categorized arrays for compatibility with both DoctorQueue and PatientQueue
    const waiting    = enriched.filter((a) => a.status === 'Waiting');
    const inProgress = enriched.filter((a) => ['CheckedIn', 'Waiting for Doctor', 'In Progress'].includes(a.status));
    const completed  = enriched.filter((a) => a.status === 'Completed');

    // Calculate queue summary metrics
    const summary = {
      total:     enriched.length,
      urgent:    enriched.filter((a) => a.priority === 'Urgent').length,
      routine:   enriched.filter((a) => a.priority !== 'Urgent').length,
      checkedIn: enriched.filter((a) => a.status === 'CheckedIn').length,
      waiting:   waiting.length,
    };

    res.status(200).json({
      count: enriched.length,
      summary,
      queue: enriched,
      waiting,
      inProgress,
      completed,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── startAppointment ─────────────────────────────────────────────────────────
// @route   PATCH /api/doctor/appointment/:appointmentId/start
// @access  Private (Doctor)
export const startAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findOneAndUpdate(
      {
        _id: req.params.appointmentId,
        assignedDoctorId: req.user._id,
      },
      { status: 'CheckedIn' },
      { new: true }
    ).populate('patientId', 'firstName lastName contactPhone gender dob abhaId');

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found.' });
    }

    res.status(200).json(appointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── getPatientTimeline ───────────────────────────────────────────────────────
// @route   GET /api/doctor/patient/:patientId/timeline
// @access  Private (Doctor)
export const getPatientTimeline = async (req, res) => {
  try {
    const { patientId } = req.params;
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const appointments = await Appointment.find({ patientId })
      .populate('facilityId', 'hospitalName address')
      .populate('assignedDoctorId', 'name')
      .sort({ appointmentDate: -1 });

    const consultations = await Consultation.find({ patientId })
      .populate('facilityId', 'hospitalName address')
      .populate('doctorId', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({ patient, appointments, consultations });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── getPatientProfile ────────────────────────────────────────────────────────
// @route   GET /api/doctor/patient/:patientId
// @access  Private (Doctor)
export const getPatientProfile = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.patientId);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    res.status(200).json(patient);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── submitConsultation ───────────────────────────────────────────────────────
// @route   POST /api/doctor/consultation
// @access  Private (Doctor)
// Saves an ABDM-compliant Consultation document and marks the Appointment 'Completed'.
export const submitConsultation = async (req, res) => {
  try {
    const {
      appointmentId,
      patientId,
      vitals,
      chiefComplaints,
      medicalHistory,
      clinicalObservations,
      diagnosis,
      clinicalNotes,
      medications,
      investigationAdvice,
      referral,
      followUpDate,
      status = 'Finalized',
    } = req.body;

    if (!appointmentId) {
      return res.status(400).json({ message: 'Appointment ID is required.' });
    }

    // Verify appointment exists
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found.' });
    }

    const doctorId = req.user._id;
    const facilityId = req.user.hospitalId || appointment.facilityId;
    const targetPatientId = patientId || appointment.patientId;

    if (!targetPatientId) {
      return res.status(400).json({ message: 'Patient reference is required.' });
    }

    // Format medications array safely
    const formattedMedications = Array.isArray(medications)
      ? medications.map((m) => ({
          drugName:     m.drugName || m.medicineName || 'Unnamed Medicine',
          medicineName: m.medicineName || m.drugName || 'Unnamed Medicine',
          dosage:       m.dosage?.trim() || undefined,
          frequency:    m.frequency?.trim() || undefined,
          durationDays: m.durationDays ? Number(m.durationDays) : undefined,
          instructions: m.instructions?.trim() || undefined,
        }))
      : [];

    // Format investigationAdvice array safely
    const formattedInvestigations = Array.isArray(investigationAdvice)
      ? investigationAdvice.map((inv) => ({
          testName: typeof inv === 'string' ? inv.trim() : inv.testName?.trim() || 'Laboratory Test',
          notes:    typeof inv === 'object' ? inv.notes?.trim() : undefined,
          status:   'Ordered',
        }))
      : [];

    // Create the Consultation record
    const consultation = await Consultation.create({
      appointmentId,
      appointment: appointmentId, // backward compat
      patientId:   targetPatientId,
      doctorId,
      doctor:      doctorId,      // backward compat
      facilityId,
      hospital:    facilityId,    // backward compat
      vitals:      vitals || {},
      chiefComplaints: chiefComplaints || appointment.chiefComplaint || '',
      medicalHistory:  medicalHistory || '',
      clinicalObservations: clinicalObservations?.trim() || undefined,
      diagnosis: diagnosis?.trim() || undefined,
      clinicalNotes: clinicalNotes?.trim() || undefined,
      medications: formattedMedications,
      prescription: formattedMedications, // backward compat
      investigationAdvice: formattedInvestigations,
      investigationOrders: formattedInvestigations, // backward compat
      referral: referral || undefined,
      followUpDate: followUpDate ? new Date(followUpDate) : undefined,
      status: ['Draft', 'Finalized'].includes(status) ? status : 'Finalized',
    });

    // Populate patient & doctor references on the returned consultation
    await consultation.populate([
      { path: 'patientId', select: 'firstName lastName contactPhone gender dob abhaId' },
      { path: 'doctorId',  select: 'name email' },
      { path: 'facilityId', select: 'hospitalName' },
    ]);

    // Update the associated Appointment status to 'Completed' (Prompt 5.2 requirement)
    appointment.status = 'Completed';
    await appointment.save();

    res.status(201).json({
      message: 'Consultation saved successfully and appointment marked Completed.',
      consultation,
      appointment,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

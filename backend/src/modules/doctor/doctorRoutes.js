import express from 'express';
import { protect, authorize } from '../../middlewares/authMiddleware.js';
import {
  getDoctorQueue,
  submitConsultation,
  startAppointment,
  getPatientTimeline,
  getPatientProfile,
} from './doctorController.js';

const router = express.Router();

// All doctor routes require a valid JWT + Doctor role
router.use(protect, authorize('Doctor'));

// ── Queue routes ──────────────────────────────────────────────────────────────
// GET  /api/doctor/queue          → today's waiting/checked-in queue for logged-in doctor
router.get('/queue', getDoctorQueue);

// ── Appointment workflow routes ───────────────────────────────────────────────
// PATCH /api/doctor/appointment/:appointmentId/start → mark appointment CheckedIn/In-Progress
router.patch('/appointment/:appointmentId/start', startAppointment);

// ── Patient history & profile routes ──────────────────────────────────────────
// GET  /api/doctor/patient/:patientId/timeline       → longitudinal patient history
router.get('/patient/:patientId/timeline', getPatientTimeline);

// GET  /api/doctor/patient/:patientId                → patient demographic profile
router.get('/patient/:patientId', getPatientProfile);

// ── Consultation routes ───────────────────────────────────────────────────────
// POST /api/doctor/consultation   → save ABDM clinical consultation & complete appointment
router.post('/consultation', submitConsultation);

export default router;

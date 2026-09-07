import express from 'express';
import { protect, authorize } from '../../middlewares/authMiddleware.js';
import {
  registerPatient,
  searchPatients,
  createAppointment,
  checkInPatient,
  getTodayQueue,
} from './receptionistController.js';

const router = express.Router();

// All receptionist routes require a valid JWT + Receptionist role
router.use(protect, authorize('Receptionist'));

// ── Patient routes ────────────────────────────────────────────────────────────
// POST   /api/receptionist/patient          → register a new walk-in patient
// GET    /api/receptionist/patient/search   → search by name or phone (?q=...)
router.post('/patient',          registerPatient);
router.get('/patient/search',    searchPatients);

// ── Appointment routes ────────────────────────────────────────────────────────
// POST   /api/receptionist/appointment           → schedule an appointment
// PATCH  /api/receptionist/appointment/:id/checkin → check in, assign queue number
router.post('/appointment',                createAppointment);
router.patch('/appointment/:id/checkin',   checkInPatient);

// ── Queue routes ──────────────────────────────────────────────────────────────
// GET    /api/receptionist/queue/today      → today's full queue (optional ?status=)
router.get('/queue/today', getTodayQueue);

export default router;

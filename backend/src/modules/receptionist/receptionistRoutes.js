import express from 'express';
import { protect, authorize } from '../../middlewares/authMiddleware.js';
import {
  registerPatient,
  searchPatients,
  createAppointment,
  checkInPatient,
  getTodayQueue,
  addToQueue,
  getFacilityPatients,
} from './receptionistController.js';

const router = express.Router();

// All receptionist routes require a valid JWT + Receptionist role
router.use(protect, authorize('Receptionist'));

// ── Patient routes ────────────────────────────────────────────────────────────
// POST   /api/receptionist/patient          → register a new walk-in patient
// GET    /api/receptionist/patient/search   → search by name or phone (?q=...)
// GET    /api/receptionist/patients         → all patients who visited this facility (?today=true)
router.post('/patient',          registerPatient);
router.get('/patient/search',    searchPatients);
router.get('/patients',          getFacilityPatients);

// ── Appointment routes ────────────────────────────────────────────────────────
// POST   /api/receptionist/appointment           → schedule an appointment
// PATCH  /api/receptionist/appointment/:id/checkin → check in, assign queue number
router.post('/appointment',                createAppointment);
router.patch('/appointment/:id/checkin',   checkInPatient);

// ── Queue routes ──────────────────────────────────────────────────────────────
// POST   /api/receptionist/queue            → add existing patient to today's queue (Waiting)
// GET    /api/receptionist/queue/today      → today's full queue (optional ?status=)
router.post('/queue',        addToQueue);
router.get('/queue/today',   getTodayQueue);

export default router;

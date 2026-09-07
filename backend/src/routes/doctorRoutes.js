import express from 'express';
import { protect, authorize } from '../middlewares/authMiddleware.js';
import {
  getTodayQueue,
  startAppointment,
  getPatientTimeline,
  saveConsultation,
  getPatientProfile,
} from '../controllers/doctorController.js';

const router = express.Router();

// All doctor routes require a valid JWT and the Doctor role
router.use(protect, authorize('Doctor'));

// Today's patient queue for the authenticated doctor's hospital
router.get('/queue', getTodayQueue);

// Mark an appointment as "In Progress" (called when doctor clicks Consult)
router.patch('/appointment/:appointmentId/start', startAppointment);

// Patient profile
router.get('/patient/:patientId', getPatientProfile);

// Patient longitudinal history / timeline (network-wide)
router.get('/patient/:patientId/timeline', getPatientTimeline);

// Save a completed consultation (also routes investigations to LabHead queue)
router.post('/consultation', saveConsultation);

export default router;

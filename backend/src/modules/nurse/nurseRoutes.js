import express from 'express';
import { protect, authorize } from '../../middlewares/authMiddleware.js';
import {
  getTriageQueue,
  captureVitals,
} from './nurseController.js';

const router = express.Router();

// All nurse routes require a valid JWT + Nurse role
router.use(protect, authorize('Nurse'));

// ── Triage Queue routes ───────────────────────────────────────────────────────
// GET  /api/nurse/queue         → active triage patients ('At Triage' / 'CheckedIn')
// GET  /api/nurse/triage/queue  → alias
router.get('/queue',        getTriageQueue);
router.get('/triage/queue', getTriageQueue);

// ── Vitals capture routes ─────────────────────────────────────────────────────
// POST /api/nurse/vitals          → capture vitals and push to 'Waiting for Doctor'
// POST /api/nurse/capture-vitals  → alias
router.post('/vitals',         captureVitals);
router.post('/capture-vitals', captureVitals);

export default router;

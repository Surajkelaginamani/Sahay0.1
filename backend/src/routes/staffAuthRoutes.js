import express from 'express';
import { staffLogin } from '../controllers/staffAuthController.js';

const router = express.Router();

// POST /api/auth/staff-login
// Unified login for all hospital staff roles (HospitalAdmin, Doctor, ASHA, LabHead, FacilityAdmin, Receptionist)
router.post('/staff-login', staffLogin);

export default router;

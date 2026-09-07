import express from 'express';
import { createStaff, getHospitalStaff } from '../controllers/hospitalAdminController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

// All routes require a valid JWT and HospitalAdmin role
router.use(protect, authorize('HospitalAdmin'));

router.post('/create-staff', createStaff);
router.get('/staff', getHospitalStaff);

export default router;

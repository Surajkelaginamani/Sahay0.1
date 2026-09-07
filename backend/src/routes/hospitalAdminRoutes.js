import express from 'express';
import {
  createStaff,
  getHospitalStaff,
  resetStaffPassword,
  deleteStaff,
} from '../controllers/hospitalAdminController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

// All routes require a valid JWT and HospitalAdmin role
router.use(protect, authorize('HospitalAdmin'));

router.post('/create-staff', createStaff);
router.get('/staff', getHospitalStaff);
router.put('/staff/:id/password', resetStaffPassword);
router.delete('/staff/:id', deleteStaff);

export default router;


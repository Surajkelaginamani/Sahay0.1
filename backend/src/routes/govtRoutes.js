import express from 'express';
import {
  registerGovtEmployee,
  loginGovtEmployee,
  getPendingHospitals,
  verifyHospital,
} from '../controllers/govtController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/register', registerGovtEmployee);
router.post('/login', loginGovtEmployee);

// Protected Government routes
router.get(
  '/pending-hospitals',
  protect,
  authorize('GovtEmployee'),
  getPendingHospitals
);

router.put(
  '/verify-hospital/:id',
  protect,
  authorize('GovtEmployee'),
  verifyHospital
);

export default router;

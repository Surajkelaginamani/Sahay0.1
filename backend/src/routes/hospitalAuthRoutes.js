import express from 'express';
import {
  registerHospitalAdmin,
  loginHospitalAdmin,
} from '../controllers/hospitalAuthController.js';

const router = express.Router();

router.post('/register', registerHospitalAdmin);
router.post('/login', loginHospitalAdmin);

export default router;

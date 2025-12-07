import { Router } from 'express';
import { saveStep, getProgress } from '../controllers/onboardingController';

const router = Router();

router.post('/save-step', saveStep);
router.get('/get-progress', getProgress);

export default router;

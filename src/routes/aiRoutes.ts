import { Router } from 'express';
import { brandAudit, strategy, contentCalendar, campaign } from '../controllers/aiController';

const router = Router();

router.post('/brand-audit', brandAudit);
router.post('/strategy', strategy);
router.post('/content-calendar', contentCalendar);
router.post('/campaign', campaign);

export default router;

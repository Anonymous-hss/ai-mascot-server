import { Router } from 'express';
import { getActivityLogs, getActivityStats, getActivitySummary } from '../controllers/activityController';

const router = Router();

// Get user activity logs
router.get('/logs', getActivityLogs);

// Get activity statistics for dashboard
router.get('/stats', getActivityStats);

// Get activity summary for a time period
router.get('/summary', getActivitySummary);

export default router;

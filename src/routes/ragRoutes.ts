import { Router } from 'express';
import { ingestController, queryController } from '../controllers/ragController';

const router = Router();

router.post('/ingest', ingestController);
router.post('/query', queryController);

export default router;

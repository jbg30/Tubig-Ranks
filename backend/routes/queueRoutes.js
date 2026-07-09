import express from 'express';
import { joinQueue, leaveQueue, getQueueStatus, heartbeat, joinQueueAsParty } from '../controllers/queueController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/join', protect, joinQueue);
router.post('/leave', protect, leaveQueue);
router.get('/status', getQueueStatus);
router.post('/heartbeat', protect, heartbeat);
router.post('/join-party', protect, joinQueueAsParty);

export default router;
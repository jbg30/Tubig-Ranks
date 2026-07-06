import express from 'express';
import { joinQueue, leaveQueue, getQueueStatus, heartbeat, joinQueueAsParty } from '../controllers/queueController.js';

const router = express.Router();

router.post('/join', joinQueue);
router.post('/leave', leaveQueue);
router.get('/status', getQueueStatus);
router.post('/heartbeat', heartbeat);
router.post('/join-party', joinQueueAsParty);

export default router;
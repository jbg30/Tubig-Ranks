import express from 'express';
import { createMatch, getMatches, getMatchById, leaveMatch, reportResult, getMatchHistory, getPlayerStats, createChallengeMatch } from '../controllers/matchController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/', protect, createMatch);
router.get('/', getMatches);
router.get('/:id', getMatchById);
router.post('/leave', protect, leaveMatch);
router.post('/:id/result', protect, reportResult);
router.get('/history/:userId', getMatchHistory);
router.get('/stats/:userId', getPlayerStats);
router.post('/challenge', protect, createChallengeMatch);

export default router;
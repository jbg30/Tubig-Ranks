import express from 'express';
import { createMatch, getMatches, getMatchById, leaveMatch, reportResult, getMatchHistory, getPlayerStats, createChallengeMatch } from '../controllers/matchController.js';

const router = express.Router();

router.post('/', createMatch);
router.get('/', getMatches);
router.get('/:id', getMatchById);
router.post('/leave', leaveMatch);
router.post('/:id/result', reportResult);
router.get('/history/:userId', getMatchHistory);
router.get('/stats/:userId', getPlayerStats);
router.post('/challenge', createChallengeMatch);

export default router;
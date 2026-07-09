import express from 'express';
import {
  createTournament,
  joinTournament,
  leaveTournament,
  cancelTournament,
  startTournament,
  getTournament,
  getAllTournaments,
  getTournamentById,
  getTournamentLeaderboard,
  reportTournamentMatch,
} from '../controllers/tournamentController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/create', protect, createTournament);
router.post('/join', protect, joinTournament);
router.post('/leave', protect, leaveTournament);
router.post('/cancel', protect, cancelTournament);
router.post('/start', protect, startTournament);
router.get('/current', getTournament);
router.get('/all', getAllTournaments);
router.get('/leaderboard', getTournamentLeaderboard);
router.post('/report', protect, reportTournamentMatch);
router.get('/:id', getTournamentById);

export default router;

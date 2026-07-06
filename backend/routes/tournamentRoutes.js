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

const router = express.Router();

router.post('/create', createTournament);
router.post('/join', joinTournament);
router.post('/leave', leaveTournament);
router.post('/cancel', cancelTournament);
router.post('/start', startTournament);
router.get('/current', getTournament);
router.get('/all', getAllTournaments);
router.get('/leaderboard', getTournamentLeaderboard);
router.post('/report', reportTournamentMatch);
router.get('/:id', getTournamentById);

export default router;

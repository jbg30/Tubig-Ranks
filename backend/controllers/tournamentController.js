import Tournament from '../models/Tournament.js';
import User from '../models/User.js';
import { getRankName } from '../utils/ranks.js';
import {
  generateSingleElimination,
  generateRoundRobin,
  generateDoubleElimination,
  advanceDoubleElimination,
  getBracketRounds,
} from '../utils/bracket.js';

const RANK_MULTIPLIERS = {
  Unranked: 0.25,
  Coal: 0.25,
  Bronze: 0.3,
  Silver: 0.4,
  Gold: 0.5,
  Amethyst: 0.6,
  Emerald: 0.8,
  Ruby: 1.0,
  Diamond: 1.25,
};

const getPodiumIds = (tournament) => {
  const bracket = tournament.bracket;

  if (tournament.format === 'single-elimination') {
    const wbMatches = bracket.filter((m) => (m.bracketType || 'winners') === 'winners');
    const finalRound = Math.max(...wbMatches.map((m) => m.round));
    const finalMatch = wbMatches.find((m) => m.round === finalRound && m.matchIndex === 0);
    if (!finalMatch?.winner) return {};
    const first = finalMatch.winner;
    const second = finalMatch.player1?.toString() === first.toString() ? finalMatch.player2 : finalMatch.player1;
    const thirdMatch = bracket.find((m) => m.bracketType === 'third-place' && m.status === 'completed');
    return { first, second, third: thirdMatch?.winner || null };
  }

  if (tournament.format === 'double-elimination') {
    const gfMatches = bracket
      .filter((m) => m.bracketType === 'grand-final' && m.status === 'completed')
      .sort((a, b) => a.matchIndex - b.matchIndex);
    const lastGF = gfMatches[gfMatches.length - 1];
    if (!lastGF?.winner) return {};
    const first = lastGF.winner;
    const second = lastGF.player1?.toString() === first.toString() ? lastGF.player2 : lastGF.player1;
    const lbMatches = bracket.filter((m) => m.bracketType === 'losers');
    const lbFinalRound = lbMatches.length ? Math.max(...lbMatches.map((m) => m.round)) : null;
    const lbFinal = lbFinalRound != null ? lbMatches.find((m) => m.round === lbFinalRound) : null;
    const third =
      lbFinal?.status === 'completed' && lbFinal.winner
        ? lbFinal.player1?.toString() === lbFinal.winner.toString() ? lbFinal.player2 : lbFinal.player1
        : null;
    return { first, second, third };
  }

  if (tournament.format === 'round-robin') {
    const winsMap = {};
    tournament.participants.forEach((p) => { winsMap[p.toString()] = { id: p, wins: 0 }; });
    bracket
      .filter((m) => (m.bracketType || 'winners') === 'winners' && m.status === 'completed' && m.winner)
      .forEach((m) => { if (winsMap[m.winner.toString()]) winsMap[m.winner.toString()].wins++; });
    const ranked = Object.values(winsMap).sort((a, b) => b.wins - a.wins);
    const thirdMatch = bracket.find((m) => m.bracketType === 'third-place' && m.status === 'completed');
    return {
      first: ranked[0]?.id,
      second: ranked[1]?.id,
      third: thirdMatch?.winner || ranked[2]?.id || null,
    };
  }

  return {};
};

const awardTournamentPoints = async (tournament) => {
  if (tournament.pointsAwarded) return;

  const numPlayers = tournament.participants.length;
  const rewardSpots = Math.min(3, Math.floor(numPlayers / 4));
  if (rewardSpots === 0) return;

  const populated = await Tournament.findById(tournament._id).populate('participants', 'mmr isPlaced');
  const avgMmr = populated.participants.reduce((sum, p) => sum + p.mmr, 0) / populated.participants.length;
  const avgRankName = getRankName(avgMmr);
  const multiplier = RANK_MULTIPLIERS[avgRankName] ?? 0.25;

  const firstPoints = Math.round(multiplier * numPlayers);
  const secondPoints = Math.round(firstPoints / 2);
  const thirdPoints = Math.round(secondPoints / 2);

  const { first, second, third } = getPodiumIds(tournament);

  if (first && rewardSpots >= 1) await User.findByIdAndUpdate(first, { $inc: { tournamentPoints: firstPoints } });
  if (second && rewardSpots >= 2) await User.findByIdAndUpdate(second, { $inc: { tournamentPoints: secondPoints } });
  if (third && rewardSpots >= 3) await User.findByIdAndUpdate(third, { $inc: { tournamentPoints: thirdPoints } });

  tournament.pointsAwarded = true;
};

const getFinishPositions = (tournament) => {
  const positions = {};
  const n = tournament.participants.length;
  const bracket = tournament.bracket;

  if (tournament.format === 'single-elimination') {
    const wbMatches = bracket.filter((m) => (m.bracketType || 'winners') === 'winners' && m.status === 'completed');
    const totalRounds = Math.max(...wbMatches.map((m) => m.round), 0);

    const finalMatch = wbMatches.find((m) => m.round === totalRounds);
    if (finalMatch?.winner) {
      positions[finalMatch.winner.toString()] = 1;
      const fl = finalMatch.player1?.toString() === finalMatch.winner.toString() ? finalMatch.player2 : finalMatch.player1;
      if (fl) positions[fl.toString()] = 2;
    }

    for (let r = 1; r < totalRounds; r++) {
      const groupPos = Math.round(n / Math.pow(2, r)) + 1;
      wbMatches.filter((m) => m.round === r).forEach((m) => {
        const loser = m.player1?.toString() === m.winner?.toString() ? m.player2 : m.player1;
        if (loser) positions[loser.toString()] = groupPos;
      });
    }

    const tp = bracket.find((m) => m.bracketType === 'third-place' && m.status === 'completed');
    if (tp?.winner) {
      positions[tp.winner.toString()] = 3;
      const tpL = tp.player1?.toString() === tp.winner.toString() ? tp.player2 : tp.player1;
      if (tpL) positions[tpL.toString()] = 4;
    }
  }

  else if (tournament.format === 'double-elimination') {
    const gfDone = bracket
      .filter((m) => m.bracketType === 'grand-final' && m.status === 'completed')
      .sort((a, b) => a.matchIndex - b.matchIndex);
    const lastGF = gfDone[gfDone.length - 1];
    if (lastGF?.winner) {
      positions[lastGF.winner.toString()] = 1;
      const gfL = lastGF.player1?.toString() === lastGF.winner.toString() ? lastGF.player2 : lastGF.player1;
      if (gfL) positions[gfL.toString()] = 2;
    }

    const lbCompleted = bracket.filter((m) => m.bracketType === 'losers' && m.status === 'completed');
    const lbMaxRound = lbCompleted.length ? Math.max(...lbCompleted.map((m) => m.round)) : 0;

    let runningPos = 3;
    for (let r = lbMaxRound; r >= 1; r--) {
      const roundMatches = lbCompleted.filter((m) => m.round === r);
      roundMatches.forEach((m) => {
        const loser = m.player1?.toString() === m.winner?.toString() ? m.player2 : m.player1;
        if (loser && !positions[loser.toString()]) positions[loser.toString()] = runningPos;
      });
      runningPos += roundMatches.length;
    }
  }

  else if (tournament.format === 'round-robin') {
    const winsMap = {};
    tournament.participants.forEach((p) => { winsMap[p.toString()] = { id: p, wins: 0 }; });
    bracket
      .filter((m) => (m.bracketType || 'winners') === 'winners' && m.status === 'completed' && m.winner)
      .forEach((m) => { if (winsMap[m.winner.toString()]) winsMap[m.winner.toString()].wins++; });
    Object.values(winsMap).sort((a, b) => b.wins - a.wins)
      .forEach((p, i) => { positions[p.id.toString()] = i + 1; });

    const tp = bracket.find((m) => m.bracketType === 'third-place' && m.status === 'completed');
    if (tp?.winner) {
      positions[tp.winner.toString()] = 3;
      const tpL = tp.player1?.toString() === tp.winner.toString() ? tp.player2 : tp.player1;
      if (tpL) positions[tpL.toString()] = 4;
    }
  }

  return positions;
};

const awardTournamentElo = async (tournament) => {
  if (tournament.eloAwarded) return;

  const n = tournament.participants.length;
  const halfSize = Math.floor(n / 2);
  if (halfSize === 0) return;

  const populated = await Tournament.findById(tournament._id).populate('participants', 'mmr');
  const avgMmr = populated.participants.reduce((sum, p) => sum + p.mmr, 0) / n;
  const kHalf = Math.round(avgMmr / 100) * 0.5;

  const positions = getFinishPositions(tournament);

  for (const participant of populated.participants) {
    const rank = positions[participant._id.toString()];
    if (rank == null) continue;

    const gap = avgMmr - participant.mmr;
    let eloChange = 0;

    const aboveAvg = participant.mmr > avgMmr;

    if (rank <= halfSize) {
      const baseGain = Math.round(kHalf * Math.pow(halfSize + 1 - rank, 1.25));
      const modifier = aboveAvg
        ? Math.round(gap * 0.12)
        : Math.min(75, Math.round(gap * 0.15));
      eloChange = baseGain + modifier;
    } else {
      const penalty = aboveAvg
        ? Math.round(gap * 0.15)
        : -Math.min(15, Math.round(kHalf * 0.5));
      eloChange = penalty;
    }

    if (eloChange !== 0) {
      await User.findByIdAndUpdate(participant._id, { $inc: { mmr: eloChange } });
    }
  }

  tournament.eloAwarded = true;
};

export const createTournament = async (req, res) => {
  try {
    const { adminId, name, format, seeding } = req.body;

    const admin = await User.findById(adminId);
    if (!admin?.isAdmin) {
      return res.status(403).json({ error: 'Only admins can create tournaments' });
    }

    const existing = await Tournament.findOne({ status: { $in: ['registration', 'active'] } });
    if (existing) {
      return res.status(409).json({ error: 'A tournament is already in progress' });
    }

    const tournament = await Tournament.create({
      name,
      format,
      seeding: seeding || 'shuffled',
      createdBy: adminId,
      participants: [],
    });

    res.status(201).json(tournament);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const joinTournament = async (req, res) => {
  try {
    const { userId } = req.body;

    const tournament = await Tournament.findOne({ status: 'registration' });
    if (!tournament) {
      return res.status(404).json({ error: 'No tournament open for registration' });
    }

    if (tournament.participants.includes(userId)) {
      return res.status(409).json({ error: 'Already registered' });
    }

    tournament.participants.push(userId);
    await tournament.save();

    res.status(200).json(tournament);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const leaveTournament = async (req, res) => {
  try {
    const { userId } = req.body;

    const tournament = await Tournament.findOne({ status: 'registration' });
    if (!tournament) {
      return res.status(404).json({ error: 'No tournament open for registration' });
    }

    tournament.participants = tournament.participants.filter(
      (p) => p.toString() !== userId
    );
    await tournament.save();

    res.status(200).json(tournament);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const cancelTournament = async (req, res) => {
  try {
    const { adminId } = req.body;

    const admin = await User.findById(adminId);
    if (!admin?.isAdmin) {
      return res.status(403).json({ error: 'Only admins can cancel tournaments' });
    }

    const tournament = await Tournament.findOne({ status: 'registration' });
    if (!tournament) {
      return res.status(404).json({ error: 'No tournament found' });
    }

    await tournament.deleteOne();

    res.status(200).json({ message: 'Tournament cancelled' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const startTournament = async (req, res) => {
  try {
    const { adminId } = req.body;

    const admin = await User.findById(adminId);
    if (!admin?.isAdmin) {
      return res.status(403).json({ error: 'Only admins can start tournaments' });
    }

    const tournament = await Tournament.findOne({ status: 'registration' }).populate('participants', 'mmr');
    if (!tournament) {
      return res.status(404).json({ error: 'No tournament found' });
    }

    if (tournament.participants.length < 2) {
      return res.status(400).json({ error: 'Need at least 2 players to start' });
    }

    const participantIds = tournament.seeding === 'seeded'
      ? [...tournament.participants].sort((a, b) => b.mmr - a.mmr).map((p) => p._id)
      : tournament.participants.map((p) => p._id);

    const bracketOpts = tournament.seeding === 'seeded' ? { shuffle: false } : { shuffle: true };
    let bracket = [];
    if (tournament.format === 'single-elimination') {
      bracket = generateSingleElimination(participantIds, bracketOpts);
    } else if (tournament.format === 'round-robin') {
      bracket = generateRoundRobin(participantIds);
    } else if (tournament.format === 'double-elimination') {
      bracket = generateDoubleElimination(participantIds, bracketOpts);
    } else {
      return res.status(400).json({ error: 'Unsupported tournament format' });
    }

    tournament.bracket = bracket;
    tournament.status = 'active';
    await tournament.save();

    res.status(200).json(tournament);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getTournament = async (req, res) => {
  try {
    const tournament = await Tournament.findOne({})
      .sort({ createdAt: -1 })
      .populate('participants')
      .populate('bracket.player1')
      .populate('bracket.player2')
      .populate('bracket.winner')
      .populate('createdBy');

    res.status(200).json(tournament);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllTournaments = async (req, res) => {
  try {
    const tournaments = await Tournament.find({})
      .sort({ createdAt: -1 })
      .select('name format status createdAt participants')
      .populate('participants', 'username');

    res.status(200).json(tournaments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getTournamentById = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id)
      .populate('participants')
      .populate('bracket.player1')
      .populate('bracket.player2')
      .populate('bracket.winner')
      .populate('createdBy');

    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    res.status(200).json(tournament);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const reportTournamentMatch = async (req, res) => {
  try {
    const { adminId, tournamentId, round, matchIndex, bracketType, winnerId } = req.body;

    const admin = await User.findById(adminId);
    if (!admin?.isAdmin) {
      return res.status(403).json({ error: 'Only admins can report tournament results' });
    }

    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    const match = tournament.bracket.find(
      (m) =>
        m.round === round &&
        m.matchIndex === matchIndex &&
        (m.bracketType || 'winners') === (bracketType || 'winners')
    );
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    match.winner = winnerId;
    match.status = 'completed';

    if (tournament.format === 'single-elimination') {
      const totalRounds = Math.max(
        ...tournament.bracket.filter((m) => (m.bracketType || 'winners') === 'winners').map((m) => m.round)
      );

      const nextRoundMatch = tournament.bracket.find(
        (m) =>
          m.round === round + 1 &&
          m.matchIndex === Math.floor(matchIndex / 2) &&
          (m.bracketType || 'winners') === 'winners'
      );

      if (nextRoundMatch) {
        if (matchIndex % 2 === 0) {
          nextRoundMatch.player1 = winnerId;
        } else {
          nextRoundMatch.player2 = winnerId;
        }

        if (nextRoundMatch.player1 && nextRoundMatch.player2) {
          nextRoundMatch.status = 'ready';
        }
      } else {
        const allCompleted = tournament.bracket
          .filter((m) => m.round === round && m.status !== 'bye' && (m.bracketType || 'winners') === 'winners')
          .every((m) => m.status === 'completed');

        if (allCompleted) {
          tournament.status = 'completed';
        }
      }

      const semiRound = totalRounds - 1;
      if (semiRound >= 1 && round === semiRound) {
        const semiMatches = tournament.bracket.filter(
          (m) => m.round === semiRound && (m.bracketType || 'winners') === 'winners'
        );
        const semisDone = semiMatches.every((m) => m.status === 'completed' || m.status === 'bye');
        const thirdPlaceExists = tournament.bracket.some((m) => m.bracketType === 'third-place');

        if (semisDone && !thirdPlaceExists) {
          const losers = semiMatches
            .filter((m) => m.status === 'completed')
            .map((m) => (m.player1?.toString() === m.winner?.toString() ? m.player2 : m.player1))
            .filter(Boolean);

          if (losers.length === 2) {
            tournament.bracket.push({
              player1: losers[0],
              player2: losers[1],
              winner: null,
              status: 'ready',
              round: totalRounds,
              matchIndex: 0,
              bracketType: 'third-place',
            });
          }
        }
      }
    }

    if (tournament.format === 'round-robin') {
      const allCompleted = tournament.bracket
        .filter((m) => (m.bracketType || 'winners') === 'winners')
        .every((m) => m.status === 'completed');

      if (allCompleted) {
        tournament.status = 'completed';

        const thirdPlaceExists = tournament.bracket.some((m) => m.bracketType === 'third-place');
        if (!thirdPlaceExists && tournament.participants.length >= 4) {
          const winsMap = {};
          tournament.participants.forEach((p) => {
            winsMap[p.toString()] = { id: p, wins: 0 };
          });
          tournament.bracket
            .filter((m) => (m.bracketType || 'winners') === 'winners' && m.status === 'completed' && m.winner)
            .forEach((m) => {
              const wId = m.winner.toString();
              if (winsMap[wId]) winsMap[wId].wins++;
            });

          const ranked = Object.values(winsMap).sort((a, b) => b.wins - a.wins);
          const third = ranked[2];
          const fourth = ranked[3];

          if (third && fourth) {
            tournament.bracket.push({
              player1: third.id,
              player2: fourth.id,
              winner: null,
              status: 'ready',
              round: 2,
              matchIndex: 0,
              bracketType: 'third-place',
            });
          }
        }
      }
    }

    if (tournament.format === 'double-elimination') {
      if (match.bracketType === 'grand-final') {
        if (match.matchIndex === 0) {
          const wbChampionId = match.player1?.toString();
          if (winnerId.toString() === wbChampionId) {
            tournament.status = 'completed';
          } else {
            tournament.bracket.push({
              player1: match.player1,
              player2: match.player2,
              winner: null,
              status: 'ready',
              round: 1,
              matchIndex: 1,
              bracketType: 'grand-final',
            });
          }
        } else {
          tournament.status = 'completed';
        }
      } else {
        const { wbRounds, lbRounds } = getBracketRounds(tournament.bracket);
        advanceDoubleElimination(tournament.bracket, wbRounds, lbRounds, match);
      }
    }

    const rewardSpots = Math.min(3, Math.floor(tournament.participants.length / 4));
    const needsThirdPlace = rewardSpots >= 3;
    const shouldAward =
      !tournament.pointsAwarded &&
      tournament.status === 'completed' &&
      (tournament.format === 'double-elimination' || !needsThirdPlace || match.bracketType === 'third-place');

    if (shouldAward) {
      await awardTournamentPoints(tournament);
      await awardTournamentElo(tournament);
    }

    await tournament.save();
    res.status(200).json(tournament);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getTournamentLeaderboard = async (req, res) => {
  try {
    const users = await User.find({ tournamentPoints: { $gt: 0 } })
      .select('username mmr isPlaced tournamentPoints')
      .sort({ tournamentPoints: -1 })
      .limit(50);
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
import Match from '../models/Match.js';
import User from '../models/User.js';
import { calculateEloChange } from '../utils/elo.js';
import { getKFactor, getRankName } from '../utils/ranks.js';
import Party from '../models/Party.js';

export const reportResult = async (req, res) => {
  try {
    const { userId, winningTeam } = req.body;

    if (!userId || !winningTeam) {
      return res.status(400).json({ error: 'userId and winningTeam are required' });
    }

    const match = await Match.findById(req.params.id).populate('players.userId');

    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    if (match.status !== 'active') {
      return res.status(400).json({ error: `Match is already ${match.status}` });
    }

    const isPlayerInMatch = match.players.some((p) => p.userId._id.toString() === userId);
    if (!isPlayerInMatch) {
      return res.status(403).json({ error: 'You are not part of this match' });
    }

    const alreadyReported = match.reports.find((r) => r.reportedBy.toString() === userId);
    if (alreadyReported) {
      return res.status(409).json({ error: 'You already reported a result for this match' });
    }

    match.reports.push({ reportedBy: userId, winningTeam });
    await match.save();

    if (match.reports.length < 2) {
      return res.status(200).json({ status: 'pending', reportsNeeded: 2 - match.reports.length });
    }

    const [firstReport, secondReport] = match.reports;

    if (firstReport.winningTeam !== secondReport.winningTeam) {
      match.status = 'disputed';
      await match.save();
      return res.status(200).json({ status: 'disputed' });
    }

    const finalWinningTeam = firstReport.winningTeam;

    const teamAPlayers = match.players.filter((p) => p.team === 'A');
    const teamBPlayers = match.players.filter((p) => p.team === 'B');

    const teamAAvgMmr = teamAPlayers.reduce((sum, p) => sum + p.userId.mmr, 0) / teamAPlayers.length;
    const teamBAvgMmr = teamBPlayers.reduce((sum, p) => sum + p.userId.mmr, 0) / teamBPlayers.length;

    const teamAWon = finalWinningTeam === 'A';

    const PLACEMENT_GAMES = 5;

    const processPlayer = async (player, didWin, opponentAvgMmr) => {
      const user = player.userId;
      const playerMmr = user.mmr;

      if (!user.isPlaced) {
        const eloChange = calculateEloChange(playerMmr, opponentAvgMmr, didWin, 80);
        const newMmr = Math.max(900, playerMmr + eloChange);

        const newGamesPlayed = user.placementGamesPlayed + 1;
        const newWins = user.placementWins + (didWin ? 1 : 0);
        const newOpponentMmrs = [...user.placementOpponentMmrs, opponentAvgMmr];

        let updateData = {
          mmr: newMmr,
          placementGamesPlayed: newGamesPlayed,
          placementWins: newWins,
          placementOpponentMmrs: newOpponentMmrs,
          status: 'idle',
          lastMatchEloChange: null,
        };

        if (newGamesPlayed >= PLACEMENT_GAMES) {
          const ratio = newWins / PLACEMENT_GAMES;
          const wlBonus = Math.round((ratio - 0.5) * 100);

          const avgOpponent = newOpponentMmrs.reduce((a, b) => a + b, 0) / newOpponentMmrs.length;
          const gapBonus = Math.round(Math.max(-150, Math.min(150, (avgOpponent - newMmr) * 0.25)));

          const placementBonus = wlBonus + gapBonus;
          const finalMmr = Math.max(900, newMmr + placementBonus);

          updateData.mmr = finalMmr;
          updateData.isPlaced = true;
          updateData.lastMatchEloChange = placementBonus;
          updateData.lastRankChange = { from: 'Unranked', to: getRankName(finalMmr) };
        }

        await User.findByIdAndUpdate(user._id, { $set: updateData });

        const entry = match.players.find((mp) => mp.userId._id.toString() === user._id.toString());
        if (entry) entry.eloChange = updateData.lastMatchEloChange ?? 0;

      } else {
        const kFactor = getKFactor(playerMmr);
        const eloChange = calculateEloChange(playerMmr, opponentAvgMmr, didWin, kFactor);
        const rankBefore = getRankName(playerMmr);
        const rankAfter = getRankName(playerMmr + eloChange);

        await User.findByIdAndUpdate(user._id, {
          $inc: { mmr: eloChange },
          $set: {
            status: 'idle',
            lastMatchEloChange: eloChange,
            lastRankChange: rankBefore !== rankAfter ? { from: rankBefore, to: rankAfter } : null,
          },
        });

        const entry = match.players.find((mp) => mp.userId._id.toString() === user._id.toString());
        if (entry) entry.eloChange = eloChange;
      }
    };

    for (const p of teamAPlayers) await processPlayer(p, teamAWon, teamBAvgMmr);
    for (const p of teamBPlayers) await processPlayer(p, !teamAWon, teamAAvgMmr);

    match.status = 'completed';
    match.winningTeam = finalWinningTeam;
    await match.save();

    res.status(200).json({
      status: 'completed',
      winningTeam: finalWinningTeam,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createMatch = async (req, res) => {
  try {
    const { mode, maxPlayers } = req.body;

    if (!mode || !maxPlayers) {
      return res.status(400).json({ error: 'mode and maxPlayers are required' });
    }

    const match = await Match.create({ mode, maxPlayers });
    res.status(201).json(match);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getMatches = async (req, res) => {
  try {
    const matches = await Match.find().populate('players.userId');
    res.status(200).json(matches);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getMatchById = async (req, res) => {
  try {
    const match = await Match.findById(req.params.id).populate('players.userId');

    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    res.status(200).json(match);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getMatchHistory = async (req, res) => {
  try {
    const { userId } = req.params;

    const matches = await Match.find({
      'players.userId': userId,
      status: { $in: ['completed', 'abandoned', 'disputed'] },
    })
      .populate('players.userId')
      .sort({ updatedAt: -1 })
      .limit(20);

    res.status(200).json(matches);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getPlayerStats = async (req, res) => {
  try {
    const { userId } = req.params;

    const matches = await Match.find({
      'players.userId': userId,
      status: 'completed',
    });

    let wins = 0;
    let losses = 0;

    matches.forEach((match) => {
      const playerEntry = match.players.find((p) => p.userId.toString() === userId);
      if (playerEntry?.team === match.winningTeam) {
        wins++;
      } else {
        losses++;
      }
    });

    res.status(200).json({ wins, losses, totalGames: wins + losses });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const leaveMatch = async (req, res) => {
  try {
    const { userId, matchId } = req.body;

    const user = await User.findById(userId);
    if (user) {
      user.status = 'idle';
      await user.save();
    }

    if (matchId) {
      const match = await Match.findById(matchId);
      if (match && match.status === 'active') {
        match.status = 'abandoned';
        await match.save();

        const otherPlayerIds = match.players
          .map((p) => p.userId.toString())
          .filter((id) => id !== userId);

        await User.updateMany(
          { _id: { $in: otherPlayerIds } },
          { status: 'idle' }
        );
      }
    }

    res.status(200).json({ status: 'ok' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createChallengeMatch = async (req, res) => {
  try {
    const { challengerId, opponentId } = req.body;

    const party = await Party.findOne({
      status: 'active',
      members: { $all: [challengerId, opponentId] },
    });

    if (!party) {
      return res.status(400).json({ error: 'You must be in a party together to challenge each other' });
    }

    const match = await Match.create({
      mode: '1v1',
      maxPlayers: 2,
      players: [
        { userId: challengerId, team: 'A' },
        { userId: opponentId, team: 'B' },
      ],
      status: 'active',
    });

    await User.updateMany(
      { _id: { $in: [challengerId, opponentId] } },
      { status: 'in-game' }
    );

    res.status(201).json(match);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
// populate players swaps the ObjectId with the actual user document, allowing you to access user details directly in the match response
import User from '../models/User.js';
import Match from '../models/Match.js';
import Party from '../models/Party.js';

// in-memory queue: { userId, mode, joinedAt }
let queue = [];

const MODE_SIZES = {
  '2v2': 4,
  '1v1': 2,
};

const BASE_RANGE = 50;
const RANGE_PER_5_SEC = 50;

const getCurrentRange = (joinedAt) => {
  const secondsWaited = (Date.now() - joinedAt) / 1000;
  const widenSteps = Math.floor(secondsWaited / 5);
  return BASE_RANGE + widenSteps * RANGE_PER_5_SEC;
};

const findMatchGroup = (playersForMode, neededCount) => {
  for (const candidate of playersForMode) {
    const candidateRange = getCurrentRange(candidate.joinedAt);

    const compatible = playersForMode.filter((other) => {
      const otherRange = getCurrentRange(other.joinedAt);
      const allowedGap = Math.max(candidateRange, otherRange);
      return Math.abs(other.mmr - candidate.mmr) <= allowedGap;
    });

    const totalSlots = compatible.reduce(
      (sum, entry) => sum + (entry.partyMemberIds?.length || 1), 0
    );
    if (totalSlots < neededCount) continue;

    const sorted = [...compatible].sort(
      (a, b) => Math.abs(a.mmr - candidate.mmr) - Math.abs(b.mmr - candidate.mmr)
    );

    const group = findExactCombination(sorted, neededCount);
    if (group) return group;
  }
  return null;
};

const findExactCombination = (entries, target, start = 0, current = [], usedUserIds = new Set()) => {
  const currentSlots = current.reduce((sum, e) => sum + (e.partyMemberIds?.length || 1), 0);
  if (currentSlots === target) return current;
  if (currentSlots > target || start >= entries.length) return null;

  for (let i = start; i < entries.length; i++) {
    const entry = entries[i];
    const entryUserIds = entry.partyMemberIds || [entry.userId];
    const hasOverlap = entryUserIds.some((id) => usedUserIds.has(id));
    if (hasOverlap) continue;

    const newUsedIds = new Set([...usedUserIds, ...entryUserIds]);
    const result = findExactCombination(entries, target, i + 1, [...current, entry], newUsedIds);
    if (result) return result;
  }
  return null;
};

export const joinQueue = async (req, res) => {
  try {
    await removeStaleEntries();
    const { userId, mode } = req.body;

    if (!userId || !mode) {
      return res.status(400).json({ error: 'userId and mode are required' });
    }

    if (!MODE_SIZES[mode]) {
      return res.status(400).json({ error: 'Invalid mode' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.isApproved) {
    return res.status(403).json({ error: 'Your account is pending approval' });
    }

    const alreadyQueued = queue.find((entry) => entry.userId === userId);
    if (alreadyQueued) {
      return res.status(409).json({ error: 'User already in queue' });
    }

    queue.push({ userId, mode, mmr: user.mmr, joinedAt: Date.now(), lastSeen: Date.now() });
    user.status = 'queued';
    await user.save();

    const formedMatches = await tryFormMatches();
    const myMatchResult = formedMatches.find((m) => m.userIds.includes(userId));

    if (myMatchResult) {
      const match = await Match.findById(myMatchResult.matchId);
      return res.status(200).json({ status: 'matched', match });
    }

    const playersForMode = queue.filter((entry) => entry.mode === mode);
    const currentRange = getCurrentRange(Date.now());
    res.status(200).json({
      status: 'waiting',
      queueSize: playersForMode.length,
      needed: MODE_SIZES[mode],
      currentRange,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const leaveQueue = async (req, res) => {
  try {
    const { userId } = req.body;

    const entry = queue.find((e) => e.userId === userId);
    const idsToReset = entry?.partyMemberIds || [userId];

    queue = queue.filter((e) => e.userId !== userId);

    await User.updateMany(
      { _id: { $in: idsToReset } },
      { status: 'idle' }
    );

    res.status(200).json({ status: 'left' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getQueueStatus = async (req, res) => {
  await removeStaleEntries();
  await tryFormMatches();
  res.status(200).json({ queue, modeSizes: MODE_SIZES });
};

const tryFormMatches = async () => {
  const modes = [...new Set(queue.map((entry) => entry.mode))];
  const newlyMatchedUserIds = [];

  for (const mode of modes) {
    const playersForMode = queue.filter((entry) => entry.mode === mode);

    const totalPlayerSlots = playersForMode.reduce(
      (sum, entry) => sum + (entry.partyMemberIds?.length || 1), 0
    );

    if (totalPlayerSlots < MODE_SIZES[mode]) continue;

    const matchGroup = findMatchGroup(playersForMode, MODE_SIZES[mode]);

    if (matchGroup) {
      const allUserIds = matchGroup.flatMap((entry) => entry.partyMemberIds || [entry.userId]);

      queue = queue.filter((entry) =>
        !matchGroup.some((m) => m.partyId ? m.partyId === entry.partyId : m.userId === entry.userId)
      );

      const { teamA, teamB } = assignTeamsWithParties(matchGroup);

      const players = [
        ...teamA.flatMap((p) => (p.partyMemberIds || [p.userId]).map((id) => ({ userId: id, team: 'A' }))),
        ...teamB.flatMap((p) => (p.partyMemberIds || [p.userId]).map((id) => ({ userId: id, team: 'B' }))),
      ];

      const match = await Match.create({
        mode,
        maxPlayers: MODE_SIZES[mode],
        players,
        status: 'active',
      });

      await User.updateMany({ _id: { $in: allUserIds } }, { status: 'in-game' });

      newlyMatchedUserIds.push({ userIds: allUserIds, matchId: match._id });
    }
  }

  return newlyMatchedUserIds;
};

const QUEUE_TIMEOUT_MS = 30000; // 30 seconds without being "seen" = stale

const removeStaleEntries = async () => {
  const now = Date.now();
  const staleEntries = queue.filter((entry) => now - entry.lastSeen > QUEUE_TIMEOUT_MS);

  if (staleEntries.length === 0) return;

  const staleUserIds = staleEntries.map((entry) => entry.userId);
  queue = queue.filter((entry) => now - entry.lastSeen <= QUEUE_TIMEOUT_MS);

  await User.updateMany(
    { _id: { $in: staleUserIds }, status: 'queued' },
    { status: 'idle' }
  );
};

export const heartbeat = async (req, res) => {
  try {
    const { userId } = req.body;
    const entry = queue.find((e) => e.userId === userId);

    if (entry) {
      entry.lastSeen = Date.now();
    }

    res.status(200).json({ status: 'ok' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const assignTeams = (matchedEntries) => {
  const shuffled = [...matchedEntries].sort(() => Math.random() - 0.5);
  const half = Math.ceil(shuffled.length / 2);

  const teamA = shuffled.slice(0, half);
  const teamB = shuffled.slice(half);

  return { teamA, teamB };
};

export const joinQueueAsParty = async (req, res) => {
  try {
    await removeStaleEntries();
    const { partyId, userId } = req.body;

    const party = await Party.findById(partyId);
    if (!party || party.status !== 'active') {
      return res.status(400).json({ error: 'No active party found' });
    }

    if (party.members.length !== 2) {
      return res.status(400).json({ error: 'Party must have exactly 2 members' });
    }

    if (party.leader.toString() !== userId) {
      return res.status(403).json({ error: 'Only the party leader can start queueing' });
    }

    const alreadyQueued = queue.find((entry) =>
      entry.partyId === partyId || party.members.map(String).includes(entry.userId)
    );
    if (alreadyQueued) {
      return res.status(409).json({ error: 'Party is already in queue' });
    }

    const users = await User.find({ _id: { $in: party.members } });
    const unapprovedUser = users.find((u) => !u.isApproved);
    if (unapprovedUser) {
    return res.status(403).json({ error: `${unapprovedUser.username} is pending approval` });
    }
    const avgMmr = users.reduce((sum, u) => sum + u.mmr, 0) / users.length;

    queue.push({
      userId: party.members[0].toString(),
      partyId,
      partyMemberIds: party.members.map(String),
      mode: '2v2',
      mmr: avgMmr,
      joinedAt: Date.now(),
      lastSeen: Date.now(),
    });

    await User.updateMany({ _id: { $in: party.members } }, { status: 'queued' });

    const formedMatches = await tryFormMatches();
    const myMatchResult = formedMatches.find((m) =>
      m.userIds.some((id) => party.members.map(String).includes(id))
    );

    if (myMatchResult) {
      const match = await Match.findById(myMatchResult.matchId);
      return res.status(200).json({ status: 'matched', match });
    }

    res.status(200).json({ status: 'waiting' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const assignTeamsWithParties = (matchGroup) => {
  const parties = matchGroup.filter((e) => e.partyMemberIds);
  const solos = matchGroup.filter((e) => !e.partyMemberIds);

  if (parties.length === 1) {
    const teamA = [parties[0]];
    const teamB = solos;
    return { teamA, teamB };
  }

  if (parties.length === 2) {
    return { teamA: [parties[0]], teamB: [parties[1]] };
  }

  const shuffled = [...solos].sort(() => Math.random() - 0.5);
  const half = Math.ceil(shuffled.length / 2);
  return { teamA: shuffled.slice(0, half), teamB: shuffled.slice(half) };
};

export const removePartyFromQueue = async (partyId) => {
  const entry = queue.find((e) => e.partyId === partyId);
  if (!entry) return;

  queue = queue.filter((e) => e.partyId !== partyId);

  await User.updateMany(
    { _id: { $in: entry.partyMemberIds } },
    { status: 'idle' }
  );
};

/* This is an alternative team assignment algorithm that tries to balance MMR across teams. Uncomment and use this if you want a more balanced matchmaking experience.
const assignTeams = (matchedEntries) => {
  const shuffled = [...matchedEntries].sort(() => Math.random() - 0.5);
  const sorted = shuffled.sort((a, b) => b.mmr - a.mmr);

  if (sorted.length === 2) {
    return { teamA: [sorted[0]], teamB: [sorted[1]] };
  }

  const teamA = [];
  const teamB = [];

  let left = 0;
  let right = sorted.length - 1;
  let turn = 0;

  while (left <= right) {
    if (left === right) {
      (teamA.length <= teamB.length ? teamA : teamB).push(sorted[left]);
    } else if (turn % 2 === 0) {
      teamA.push(sorted[left]);
      teamA.push(sorted[right]);
    } else {
      teamB.push(sorted[left]);
      teamB.push(sorted[right]);
    }
    left++;
    right--;
    turn++;
  }

  return { teamA, teamB };
};
*/
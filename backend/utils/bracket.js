const standardSeedOrder = (n) => {
  if (n <= 2) return Array.from({ length: n }, (_, i) => i);
  const prev = standardSeedOrder(n / 2);
  const result = [];
  for (const s of prev) result.push(s, n - 1 - s);
  return result;
};

const applySeeding = (participants, shuffle) => {
  if (shuffle) return [...participants].sort(() => Math.random() - 0.5);
  const n = Math.pow(2, Math.ceil(Math.log2(participants.length)));
  const padded = [...participants];
  while (padded.length < n) padded.push(null);
  return standardSeedOrder(n).map((i) => padded[i]);
};

export const generateSingleElimination = (participants, { shuffle = true } = {}) => {
  const roundPlayers = applySeeding(participants, shuffle);
  const nextPowerOfTwo = roundPlayers.length;
  const bracket = [];
  const round = 1;

  let matchIndex = 0;
  for (let i = 0; i < roundPlayers.length; i += 2) {
    const player1 = roundPlayers[i];
    const player2 = roundPlayers[i + 1];

    bracket.push({
      player1: player1 || null,
      player2: player2 || null,
      winner: player1 && !player2 ? player1 : null,
      status: !player2 ? 'bye' : 'ready',
      round,
      matchIndex: matchIndex++,
    });
  }

  const totalRounds = Math.log2(nextPowerOfTwo);
  for (let r = 2; r <= totalRounds; r++) {
    const prevRoundMatchCount = bracket.filter((m) => m.round === r - 1).length;
    const thisRoundMatchCount = prevRoundMatchCount / 2;
    for (let i = 0; i < thisRoundMatchCount; i++) {
      bracket.push({
        player1: null,
        player2: null,
        winner: null,
        status: 'pending',
        round: r,
        matchIndex: i,
      });
    }
  }

  bracket.forEach((m) => {
    if (m.status !== 'bye') return;
    const dest = bracket.find((d) => d.round === m.round + 1 && d.matchIndex === Math.floor(m.matchIndex / 2));
    if (!dest) return;
    if (m.matchIndex % 2 === 0) dest.player1 = m.winner;
    else dest.player2 = m.winner;
    if (dest.player1 && dest.player2) dest.status = 'ready';
  });

  return bracket;
};

export const generateRoundRobin = (participants) => {
  const bracket = [];
  let matchIndex = 0;
  const round = 1;

  for (let i = 0; i < participants.length; i++) {
    for (let j = i + 1; j < participants.length; j++) {
      bracket.push({
        player1: participants[i],
        player2: participants[j],
        winner: null,
        status: 'ready',
        round,
        matchIndex: matchIndex++,
      });
    }
  }

  return bracket;
};

// --- Double elimination -----------------------------------------------
//
// Bracket layout:
//   winners bracket: rounds 1..wbRounds, standard single-elimination shape.
//   losers bracket: rounds 1..lbRounds (lbRounds = 2*(wbRounds-1), 0 if wbRounds===1).
//     Odd losers rounds only re-pair survivors of the previous losers round.
//     Even losers rounds merge the previous losers round's winners with the
//     fresh losers dropping out of the corresponding winners round.
//   grand final: bracketType 'grand-final', round 1. matchIndex 0 is the
//     first meeting (player1 = winners-bracket champion, player2 = losers-
//     bracket champion). If the losers-bracket champion wins that match, a
//     matchIndex 1 "bracket reset" match is created and decides the title.

const placeInMatch = (bracket, bracketType, round, matchIndex, slot, playerId) => {
  const target = bracket.find(
    (m) => m.bracketType === bracketType && m.round === round && m.matchIndex === matchIndex
  );
  if (!target) return;
  target[slot] = playerId;
  if (target.player1 && target.player2 && target.status !== 'completed') {
    target.status = 'ready';
  }
};

const placeWinner = (bracket, wbRounds, lbRounds, match, winnerId) => {
  if (winnerId == null) return;

  if (match.bracketType === 'winners') {
    if (match.round < wbRounds) {
      placeInMatch(
        bracket,
        'winners',
        match.round + 1,
        Math.floor(match.matchIndex / 2),
        match.matchIndex % 2 === 0 ? 'player1' : 'player2',
        winnerId
      );
    } else {
      placeInMatch(bracket, 'grand-final', 1, 0, 'player1', winnerId);
    }
  } else if (match.bracketType === 'losers') {
    if (match.round === lbRounds) {
      placeInMatch(bracket, 'grand-final', 1, 0, 'player2', winnerId);
    } else if (match.round % 2 === 1) {
      placeInMatch(bracket, 'losers', match.round + 1, match.matchIndex, 'player1', winnerId);
    } else {
      placeInMatch(
        bracket,
        'losers',
        match.round + 1,
        Math.floor(match.matchIndex / 2),
        match.matchIndex % 2 === 0 ? 'player1' : 'player2',
        winnerId
      );
    }
  }
};

const placeLoser = (bracket, wbRounds, match, loserId) => {
  if (loserId == null || match.bracketType !== 'winners') return;

  if (match.round === 1 && wbRounds === 1) {
    placeInMatch(bracket, 'grand-final', 1, 0, 'player2', loserId);
  } else if (match.round === 1) {
    placeInMatch(
      bracket,
      'losers',
      1,
      Math.floor(match.matchIndex / 2),
      match.matchIndex % 2 === 0 ? 'player1' : 'player2',
      loserId
    );
  } else {
    placeInMatch(bracket, 'losers', 2 * (match.round - 1), match.matchIndex, 'player2', loserId);
  }
};

export const getBracketRounds = (bracket) => {
  const wbRounds = Math.max(...bracket.filter((m) => m.bracketType === 'winners').map((m) => m.round));
  const losers = bracket.filter((m) => m.bracketType === 'losers');
  const lbRounds = losers.length ? Math.max(...losers.map((m) => m.round)) : 0;
  return { wbRounds, lbRounds };
};

export const advanceDoubleElimination = (bracket, wbRounds, lbRounds, match) => {
  const winnerId = match.winner;
  const loserId =
    match.player1?.toString() === winnerId?.toString() ? match.player2 : match.player1;

  placeWinner(bracket, wbRounds, lbRounds, match, winnerId);
  placeLoser(bracket, wbRounds, match, loserId);
};

const getFeeders = (m, wbRounds, lbRounds) => {
  if (m.bracketType === 'winners') {
    if (m.round === 1) return [];
    return [
      { bracketType: 'winners', round: m.round - 1, matchIndex: 2 * m.matchIndex, slot: 'player1' },
      { bracketType: 'winners', round: m.round - 1, matchIndex: 2 * m.matchIndex + 1, slot: 'player2' },
    ];
  }

  if (m.bracketType === 'losers') {
    if (m.round === 1) {
      return [
        { bracketType: 'winners', round: 1, matchIndex: 2 * m.matchIndex, slot: 'player1' },
        { bracketType: 'winners', round: 1, matchIndex: 2 * m.matchIndex + 1, slot: 'player2' },
      ];
    }
    if (m.round % 2 === 0) {
      const j = m.round / 2;
      return [
        { bracketType: 'losers', round: m.round - 1, matchIndex: m.matchIndex, slot: 'player1' },
        { bracketType: 'winners', round: j + 1, matchIndex: m.matchIndex, slot: 'player2' },
      ];
    }
    return [
      { bracketType: 'losers', round: m.round - 1, matchIndex: 2 * m.matchIndex, slot: 'player1' },
      { bracketType: 'losers', round: m.round - 1, matchIndex: 2 * m.matchIndex + 1, slot: 'player2' },
    ];
  }

  if (m.bracketType === 'grand-final' && m.matchIndex === 0) {
    if (wbRounds === 1) {
      return [
        { bracketType: 'winners', round: 1, matchIndex: 0, slot: 'player1' },
        { bracketType: 'winners', round: 1, matchIndex: 0, slot: 'player2' },
      ];
    }
    return [
      { bracketType: 'winners', round: wbRounds, matchIndex: 0, slot: 'player1' },
      { bracketType: 'losers', round: lbRounds, matchIndex: 0, slot: 'player2' },
    ];
  }

  return [];
};

// Resolves any walkovers created by byes at generation time: a first-round
// winners-bracket bye has no loser to send to the losers bracket, which can
// leave downstream matches with only one (or zero) possible player. Those
// matches auto-resolve and forward their result the same way a real report
// would, cascading until the bracket settles.
const resolveByes = (bracket, wbRounds, lbRounds) => {
  const key = (m) => `${m.bracketType}-${m.round}-${m.matchIndex}`;
  const propagated = new Set();

  bracket
    .filter((m) => m.bracketType === 'winners' && m.round === 1)
    .forEach((m) => {
      propagated.add(key(m));
      if (m.status === 'bye') placeWinner(bracket, wbRounds, lbRounds, m, m.winner);
    });

  let progress = true;
  let guard = 0;
  while (progress && guard < bracket.length + 5) {
    progress = false;
    guard++;

    for (const m of bracket) {
      if (propagated.has(key(m))) continue;
      if (m.bracketType === 'grand-final' && m.matchIndex === 1) continue;

      const feederMatches = getFeeders(m, wbRounds, lbRounds).map((f) => ({
        slot: f.slot,
        match: bracket.find(
          (x) => x.bracketType === f.bracketType && x.round === f.round && x.matchIndex === f.matchIndex
        ),
      }));

      const allResolved = feederMatches.every(({ match: fm }) => !fm || propagated.has(key(fm)));
      if (!allResolved) continue;

      const player1Filled = m.player1 != null;
      const player2Filled = m.player2 != null;
      const slot1Feeder = feederMatches.find((fm) => fm.slot === 'player1');
      const slot2Feeder = feederMatches.find((fm) => fm.slot === 'player2');
      const slot1Pending = !player1Filled && slot1Feeder?.match && slot1Feeder.match.status !== 'bye';
      const slot2Pending = !player2Filled && slot2Feeder?.match && slot2Feeder.match.status !== 'bye';

      if (slot1Pending || slot2Pending) {
        propagated.add(key(m));
        progress = true;
        continue;
      }

      if (player1Filled && player2Filled) {
        if (m.status === 'pending') m.status = 'ready';
      } else if (player1Filled || player2Filled) {
        m.winner = player1Filled ? m.player1 : m.player2;
        m.status = 'bye';
        placeWinner(bracket, wbRounds, lbRounds, m, m.winner);
      } else {
        m.status = 'bye';
        m.winner = null;
      }

      propagated.add(key(m));
      progress = true;
    }
  }
};

export const generateDoubleElimination = (participants, { shuffle = true } = {}) => {
  const seeded = applySeeding(participants, shuffle);
  const P = seeded.length;
  const wbRounds = Math.log2(P) || 1;

  const bracket = [];

  let matchIndex = 0;
  for (let i = 0; i < seeded.length; i += 2) {
    const player1 = seeded[i];
    const player2 = seeded[i + 1];
    bracket.push({
      player1: player1 || null,
      player2: player2 || null,
      winner: player1 && !player2 ? player1 : null,
      status: !player2 ? 'bye' : 'ready',
      round: 1,
      matchIndex: matchIndex++,
      bracketType: 'winners',
    });
  }

  for (let r = 2; r <= wbRounds; r++) {
    const count = P / Math.pow(2, r);
    for (let i = 0; i < count; i++) {
      bracket.push({
        player1: null,
        player2: null,
        winner: null,
        status: 'pending',
        round: r,
        matchIndex: i,
        bracketType: 'winners',
      });
    }
  }

  const lbRounds = wbRounds >= 2 ? 2 * (wbRounds - 1) : 0;
  for (let r = 1; r <= lbRounds; r++) {
    const j = Math.ceil(r / 2);
    const count = P / Math.pow(2, j + 1);
    for (let i = 0; i < count; i++) {
      bracket.push({
        player1: null,
        player2: null,
        winner: null,
        status: 'pending',
        round: r,
        matchIndex: i,
        bracketType: 'losers',
      });
    }
  }

  bracket.push({
    player1: null,
    player2: null,
    winner: null,
    status: 'pending',
    round: 1,
    matchIndex: 0,
    bracketType: 'grand-final',
  });

  resolveByes(bracket, wbRounds, lbRounds);

  return bracket;
};

import API from '../api.js';
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { getRank } from '../utils/ranks';
import TopNav from '../components/TopNav';

const MEDAL_COLORS = ['#dab640', '#999999', '#8b4a2c'];

export default function Tournament() {
  const { user } = useUser();
  const navigate = useNavigate();
  const { id } = useParams();
  const readOnly = Boolean(id);

  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const pollRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    fetchTournament();
    pollRef.current = setInterval(fetchTournament, 3000);
    return () => clearInterval(pollRef.current);
  }, [id]);

  const fetchTournament = async () => {
    try {
      const url = id
        ? `${API}/api/tournament/${id}`
        : `${API}/api/tournament/current`;
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) setTournament(data);
      setLoading(false);
    } catch { setLoading(false); }
  };

  const handleJoin = async () => {
    setError('');
    try {
      const res = await fetch(`${API}/api/tournament/join`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user._id }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      fetchTournament();
    } catch { setError('Could not reach the server'); }
  };

  const handleLeave = async () => {
    setError('');
    try {
      const res = await fetch(`${API}/api/tournament/leave`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user._id }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      fetchTournament();
    } catch { setError('Could not reach the server'); }
  };

  const handleCancel = async () => {
    if (!window.confirm('Cancel this tournament? This cannot be undone.')) return;
    setError('');
    try {
      const res = await fetch(`${API}/api/tournament/cancel`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId: user._id }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      navigate('/lobby');
    } catch { setError('Could not reach the server'); }
  };

  const handleStart = async () => {
    setError('');
    try {
      const res = await fetch(`${API}/api/tournament/start`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId: user._id }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      fetchTournament();
    } catch { setError('Could not reach the server'); }
  };

  const handleReport = async (round, matchIndex, winnerId, bracketType) => {
    setError('');
    try {
      const res = await fetch(`${API}/api/tournament/report`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId: user._id, tournamentId: tournament._id, round, matchIndex, bracketType, winnerId }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      fetchTournament();
    } catch { setError('Could not reach the server'); }
  };

  const formatFormat = (f) => {
    if (f === 'single-elimination') return 'Single Elimination';
    if (f === 'double-elimination') return 'Double Elimination';
    if (f === 'round-robin') return 'Round Robin';
    return f;
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0d1b2a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4e7a9b', fontFamily: 'sans-serif' }}>
      Loading...
    </div>
  );

  if (!tournament) return (
    <>
      <TopNav />
      <div style={{ minHeight: '100vh', background: '#0d1b2a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#e8f1fa', fontFamily: 'sans-serif', gap: 16 }}>
        <div style={{ fontSize: 18, color: '#4e7a9b' }}>{readOnly ? 'Tournament not found' : 'No tournament in progress'}</div>
        <button onClick={() => navigate(readOnly ? '/tournaments' : '/lobby')} style={ghostBtn}>{readOnly ? 'Back to Tournaments' : 'Back to Lobby'}</button>
      </div>
    </>
  );

  const isParticipant = tournament.participants.some((p) => p._id === user._id);
  const isRoundRobin = tournament.format === 'round-robin';
  const isDoubleElim = tournament.format === 'double-elimination';

  const groupByRound = (matches) => {
    const g = {};
    matches.forEach((m) => { if (!g[m.round]) g[m.round] = []; g[m.round].push(m); });
    return g;
  };
  const sortedRoundNumbers = (grouped) => Object.keys(grouped).map(Number).sort((a, b) => a - b);

  const winnersMatches = tournament.bracket.filter((m) => (m.bracketType || 'winners') === 'winners');
  const losersMatches = tournament.bracket.filter((m) => m.bracketType === 'losers');
  const grandFinalMatches = tournament.bracket.filter((m) => m.bracketType === 'grand-final').sort((a, b) => a.matchIndex - b.matchIndex);
  const thirdPlaceMatch = tournament.bracket.find((m) => m.bracketType === 'third-place');

  const rounds = groupByRound(winnersMatches);
  const roundNumbers = sortedRoundNumbers(rounds);
  const losersRounds = groupByRound(losersMatches);
  const losersRoundNumbers = sortedRoundNumbers(losersRounds);

  const RANK_MULTIPLIERS = { Unranked: 0.25, Coal: 0.25, Bronze: 0.3, Silver: 0.4, Gold: 0.5, Amethyst: 0.6, Emerald: 0.8, Ruby: 1.0, Diamond: 1.25 };
  const numPlayers = tournament.participants.length;
  const avgMmr = numPlayers > 0 ? tournament.participants.reduce((sum, p) => sum + (p.mmr ?? 1000), 0) / numPlayers : 1000;
  const tournamentRank = getRank(avgMmr);
  const multiplier = RANK_MULTIPLIERS[tournamentRank.name] ?? 0.25;
  const rewardSpots = Math.min(3, Math.floor(numPlayers / 4));
  const firstPoints = Math.round(multiplier * numPlayers);
  const secondPoints = Math.round(firstPoints / 2);
  const thirdPoints = Math.round(secondPoints / 2);

  const myTurnMatch = tournament.bracket.find(
    (m) => m.status === 'ready' && (m.player1?._id === user._id || m.player2?._id === user._id)
  );

  const computeStandings = () => {
    const winsMap = {};
    tournament.participants.forEach((p) => { winsMap[p._id] = { username: p.username, wins: 0, losses: 0 }; });
    tournament.bracket.filter((m) => (m.bracketType || 'winners') === 'winners').forEach((m) => {
      if (m.status === 'completed' && m.winner) {
        const winnerId = m.winner._id;
        const loserId = m.player1?._id === winnerId ? m.player2?._id : m.player1?._id;
        if (winsMap[winnerId]) winsMap[winnerId].wins++;
        if (loserId && winsMap[loserId]) winsMap[loserId].losses++;
      }
    });
    return Object.values(winsMap).sort((a, b) => b.wins - a.wins);
  };

  const getPodium = () => {
    if (tournament.status !== 'completed') return null;
    if (isRoundRobin) {
      const standings = computeStandings();
      let third = [];
      if (thirdPlaceMatch?.status === 'completed' && thirdPlaceMatch.winner) third = [{ username: thirdPlaceMatch.winner.username }];
      else if (standings[2]) third = [{ username: standings[2].username }];
      return { first: standings[0] ?? null, second: standings[1] ?? null, third };
    }
    if (isDoubleElim) {
      const decided = grandFinalMatches.filter((m) => m.status === 'completed');
      const lastGF = decided[decided.length - 1];
      if (!lastGF?.winner) return null;
      const first = lastGF.winner;
      const second = lastGF.player1?._id === first._id ? lastGF.player2 : lastGF.player1;
      const lbFinalRound = losersRoundNumbers.length ? Math.max(...losersRoundNumbers) : null;
      const lbFinal = lbFinalRound ? losersRounds[lbFinalRound]?.[0] : null;
      const third = lbFinal?.status === 'completed' && lbFinal.winner
        ? (lbFinal.player1?._id === lbFinal.winner._id ? lbFinal.player2 : lbFinal.player1)
        : null;
      return { first, second, third: third ? [third] : [] };
    }
    const finalRound = Math.max(...roundNumbers);
    const finalMatch = rounds[finalRound]?.[0];
    if (!finalMatch?.winner) return null;
    const first = finalMatch.winner;
    const second = finalMatch.player1?._id === first._id ? finalMatch.player2 : finalMatch.player1;
    let third = [];
    if (thirdPlaceMatch?.status === 'completed' && thirdPlaceMatch.winner) third = [thirdPlaceMatch.winner];
    else {
      const semiRound = finalRound - 1;
      third = (rounds[semiRound] || []).filter((m) => m.status === 'completed' && m.winner)
        .map((m) => (m.player1?._id === m.winner._id ? m.player2 : m.player1)).filter(Boolean);
    }
    return { first, second, third };
  };

  const getFinishPositionsClient = () => {
    const positions = {};
    const n = tournament.participants.length;
    const id = (p) => (p?._id ?? p)?.toString();
    if (isDoubleElim) {
      const gfDone = grandFinalMatches.filter((m) => m.status === 'completed');
      const lastGF = gfDone[gfDone.length - 1];
      if (lastGF?.winner) {
        positions[id(lastGF.winner)] = 1;
        const gfL = id(lastGF.player1) === id(lastGF.winner) ? lastGF.player2 : lastGF.player1;
        if (gfL) positions[id(gfL)] = 2;
      }
      const lbCompleted = losersMatches.filter((m) => m.status === 'completed');
      const lbMaxRound = lbCompleted.length ? Math.max(...lbCompleted.map((m) => m.round)) : 0;
      let runningPos = 3;
      for (let r = lbMaxRound; r >= 1; r--) {
        const roundMatches = lbCompleted.filter((m) => m.round === r);
        roundMatches.forEach((m) => {
          const loser = id(m.player1) === id(m.winner) ? m.player2 : m.player1;
          if (loser && !positions[id(loser)]) positions[id(loser)] = runningPos;
        });
        runningPos += roundMatches.length;
      }
    } else if (isRoundRobin) {
      const winsMap = {};
      tournament.participants.forEach((p) => { winsMap[id(p)] = { player: p, wins: 0 }; });
      tournament.bracket.filter((m) => (m.bracketType || 'winners') === 'winners' && m.status === 'completed' && m.winner)
        .forEach((m) => { if (winsMap[id(m.winner)]) winsMap[id(m.winner)].wins++; });
      Object.values(winsMap).sort((a, b) => b.wins - a.wins).forEach((entry, i) => { positions[id(entry.player)] = i + 1; });
      if (thirdPlaceMatch?.status === 'completed' && thirdPlaceMatch.winner) {
        positions[id(thirdPlaceMatch.winner)] = 3;
        const tpL = id(thirdPlaceMatch.player1) === id(thirdPlaceMatch.winner) ? thirdPlaceMatch.player2 : thirdPlaceMatch.player1;
        if (tpL) positions[id(tpL)] = 4;
      }
    } else {
      const totalRounds = roundNumbers.length ? Math.max(...roundNumbers) : 0;
      const finalMatch = rounds[totalRounds]?.[0];
      if (finalMatch?.winner) {
        positions[id(finalMatch.winner)] = 1;
        const fl = id(finalMatch.player1) === id(finalMatch.winner) ? finalMatch.player2 : finalMatch.player1;
        if (fl) positions[id(fl)] = 2;
      }
      for (let r = 1; r < totalRounds; r++) {
        const groupPos = Math.round(n / Math.pow(2, r)) + 1;
        (rounds[r] || []).filter((m) => m.status === 'completed').forEach((m) => {
          const loser = id(m.player1) === id(m.winner) ? m.player2 : m.player1;
          if (loser) positions[id(loser)] = groupPos;
        });
      }
      if (thirdPlaceMatch?.status === 'completed' && thirdPlaceMatch.winner) {
        positions[id(thirdPlaceMatch.winner)] = 3;
        const tpL = id(thirdPlaceMatch.player1) === id(thirdPlaceMatch.winner) ? thirdPlaceMatch.player2 : thirdPlaceMatch.player1;
        if (tpL) positions[id(tpL)] = 4;
      }
    }
    return positions;
  };

  const computeEloChanges = () => {
    const n = tournament.participants.length;
    const halfSize = Math.floor(n / 2);
    const kHalf = Math.round(avgMmr / 100) * 0.5;
    const positions = getFinishPositionsClient();
    return tournament.participants.map((p) => {
      const rank = positions[(p?._id ?? p)?.toString()];
      if (rank == null) return { player: p, rank: null, eloChange: 0 };
      const gap = avgMmr - (p.mmr ?? 1000);
      let eloChange = 0;
      if (rank <= halfSize) {
        const baseGain = Math.round(kHalf * Math.pow(halfSize + 1 - rank, 1.25));
        const aboveAvg = (p.mmr ?? 1000) > avgMmr;
        const modifier = aboveAvg ? Math.round(gap * 0.12) : Math.min(75, Math.round(gap * 0.15));
        eloChange = baseGain + modifier;
      } else {
        const aboveAvg = (p.mmr ?? 1000) > avgMmr;
        eloChange = aboveAvg
          ? Math.round(gap * 0.15)
          : -Math.min(15, Math.round(kHalf * 0.5));
      }
      return { player: p, rank, eloChange };
    }).sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999));
  };

  const renderMatch = (match) => {
    if (match.status === 'bye' && !match.player1 && !match.player2) return null;
    const p1Name = match.player1 ? `${match.player1.username} (${match.player1.mmr ?? '?'})` : 'TBD';
    const p2Name = match.status === 'bye' ? null : match.player2 ? `${match.player2.username} (${match.player2.mmr ?? '?'})` : 'TBD';
    const isMine = match.status === 'ready' && (match.player1?._id === user._id || match.player2?._id === user._id);
    const canReport = !readOnly && user.isAdmin && (match.status === 'ready' || match.status === 'active');
    const isGrandFinal = match.bracketType === 'grand-final';
    const isThirdPlace = match.bracketType === 'third-place';
    const isLbFinal = isDoubleElim && match.bracketType === 'losers' && losersRoundNumbers.length > 0 && match.round === Math.max(...losersRoundNumbers);

    return (
      <div key={match._id} style={{
        background: isMine ? '#1a2e1a' : '#0f2236',
        border: `1px solid ${isMine ? '#3dcf8e' : '#1e4976'}`,
        borderRadius: 10,
        padding: '12px 14px',
        marginBottom: 8,
        minWidth: 200,
      }}>
        {(isGrandFinal || isThirdPlace || isLbFinal) && (
          <div style={{ fontSize: 10, color: '#4e7a9b', fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>
            {isGrandFinal ? (match.matchIndex === 0 ? 'Grand Final' : 'Grand Final â€” Reset') : isThirdPlace ? 'Third Place' : 'LB Final'}
          </div>
        )}
        {match.status === 'bye' ? (
          <div style={{ color: '#4e7a9b', fontSize: 13 }}>{p1Name} â€” bye</div>
        ) : (
          <>
            <div style={{ fontSize: 13, color: '#e8f1fa', marginBottom: 4 }}>
              <span style={{ fontWeight: match.winner?._id === match.player1?._id ? 700 : 400, color: match.winner?._id === match.player1?._id ? '#3dcf8e' : '#e8f1fa' }}>{p1Name}</span>
              {isGrandFinal && match.player1 && <span style={{ color: '#4e7a9b', fontSize: 11 }}> (W)</span>}
              <span style={{ color: '#2e4a62', margin: '0 6px' }}>vs</span>
              <span style={{ fontWeight: match.winner?._id === match.player2?._id ? 700 : 400, color: match.winner?._id === match.player2?._id ? '#3dcf8e' : '#e8f1fa' }}>{p2Name}</span>
              {isGrandFinal && match.player2 && <span style={{ color: '#4e7a9b', fontSize: 11 }}> (L)</span>}
            </div>
            <div style={{ fontSize: 11, color: '#4e7a9b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: canReport ? 8 : 0 }}>
              {match.status}
            </div>
            {canReport && match.player1 && match.player2 && (
              <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                <button onClick={() => handleReport(match.round, match.matchIndex, match.player1._id, match.bracketType)} style={reportBtn}>
                  {match.player1.username} wins
                </button>
                <button onClick={() => handleReport(match.round, match.matchIndex, match.player2._id, match.bracketType)} style={reportBtn}>
                  {match.player2.username} wins
                </button>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  const podium = getPodium();
  const eloList = tournament.status === 'completed' ? computeEloChanges() : null;

  return (
    <>
      <TopNav />
      <div style={{ minHeight: '100vh', background: '#0d1b2a', color: '#e8f1fa', fontFamily: 'sans-serif', paddingTop: 80, paddingBottom: 60 }}>
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 24px' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
            <div>
              <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 38, letterSpacing: 4, margin: '0 0 4px' }}>{tournament.name}</h1>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#a3c4e0', textTransform: 'uppercase', letterSpacing: 2 }}>{formatFormat(tournament.format)}</span>
                <span style={{ color: tournamentRank.color, fontSize: 16, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 2 }}>{tournamentRank.name} Tournament</span>
              </div>
            </div>
            <button onClick={() => navigate(readOnly ? '/tournaments' : '/lobby')} style={ghostBtn}>
              {readOnly ? 'All Tournaments' : 'Back to Lobby'}
            </button>
          </div>

          {error && <p style={{ color: '#f87171', fontSize: 13, marginBottom: 12 }}>{error}</p>}

          {/* My turn alert */}
          {!readOnly && myTurnMatch && (
            <div style={{ background: '#0a2418', border: '1px solid #3dcf8e', borderRadius: 10, padding: '12px 18px', marginBottom: 20, color: '#3dcf8e', fontWeight: 700, fontSize: 14 }}>
              It's your turn! Round {myTurnMatch.round} vs{' '}
              {(myTurnMatch.player1?._id === user._id ? myTurnMatch.player2?.username : myTurnMatch.player1?.username) || 'TBD'}
            </div>
          )}

          {/* Registration */}
          {tournament.status === 'registration' && (
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 240, background: '#0f2236', border: '1px solid #1e4976', borderRadius: 14, overflow: 'hidden' }}>
                <div style={{ padding: '12px 18px', borderBottom: '1px solid #1e4976', fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: '#4e7a9b' }}>
                  Players ({tournament.participants.length})
                </div>
                {tournament.participants.length === 0 ? (
                  <div style={{ padding: '18px', color: '#2e4a62', fontSize: 13 }}>No players yet.</div>
                ) : (
                  tournament.participants.map((p) => (
                    <div key={p._id} style={{ padding: '10px 18px', borderBottom: '1px solid #0d1b2a', fontSize: 14, color: p._id === user._id ? '#3dcf8e' : '#e8f1fa' }}>
                      {p.username}{p._id === user._id ? ' (you)' : ''}
                    </div>
                  ))
                )}
              </div>

              {!readOnly && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 200 }}>
                  {isParticipant ? (
                    <button onClick={handleLeave} style={dangerBtn}>Leave Tournament</button>
                  ) : (
                    <button onClick={handleJoin} style={primaryBtn}>Enter Tournament</button>
                  )}
                  {user.isAdmin && (
                    <>
                      <button onClick={handleStart} disabled={tournament.participants.length < 2} style={{ ...primaryBtn, opacity: tournament.participants.length < 2 ? 0.5 : 1 }}>
                        Start Tournament
                      </button>
                      <button onClick={handleCancel} style={dangerBtn}>Cancel Tournament</button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Active bracket */}
          {tournament.status === 'active' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {isDoubleElim ? (
                <>
                  <BracketSection title="Winners Bracket" rounds={rounds} roundNumbers={roundNumbers} renderMatch={renderMatch} />
                  <BracketSection title="Losers Bracket" rounds={losersRounds} roundNumbers={losersRoundNumbers} renderMatch={renderMatch} />
                  <div>
                    <SectionTitle>Grand Final</SectionTitle>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>{grandFinalMatches.map(renderMatch)}</div>
                  </div>
                </>
              ) : isRoundRobin ? (
                <div>
                  <SectionTitle>Matches</SectionTitle>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>{rounds[roundNumbers[0]]?.map(renderMatch)}</div>
                </div>
              ) : (
                <BracketSection title="Bracket" rounds={rounds} roundNumbers={roundNumbers} renderMatch={renderMatch} />
              )}

              {thirdPlaceMatch && !isDoubleElim && (
                <div>
                  <SectionTitle>Third Place Match</SectionTitle>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>{renderMatch(thirdPlaceMatch)}</div>
                </div>
              )}
            </div>
          )}

          {/* Completed results */}
          {tournament.status === 'completed' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Podium */}
              {podium && (
                <div style={{ background: '#0f2236', border: '1px solid #1e4976', borderRadius: 14, overflow: 'hidden' }}>
                  <div style={{ padding: '12px 20px', borderBottom: '1px solid #1e4976', fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: '#4e7a9b' }}>
                    Final Results
                  </div>
                  {[
                    { place: 1, player: podium.first, pts: rewardSpots >= 1 ? firstPoints : null },
                    { place: 2, player: podium.second, pts: rewardSpots >= 2 ? secondPoints : null },
                    ...(podium.third || []).map((p, i) => ({ place: 3 + i, player: p, pts: i === 0 && rewardSpots >= 3 ? thirdPoints : null })),
                  ].filter((r) => r.player).map((row) => (
                    <div key={row.place} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', borderBottom: '1px solid #0d1b2a' }}>
                      <div style={{ width: 28, fontWeight: 800, fontSize: 15, color: MEDAL_COLORS[row.place - 1] ?? '#2e4a62', flexShrink: 0 }}>
                        {row.place}
                      </div>
                      <div style={{ flex: 1, fontWeight: 700, fontSize: 15 }}>{row.player.username}</div>
                      {row.pts && (
                        <div style={{ fontSize: 13, fontWeight: 700, color: MEDAL_COLORS[row.place - 1] ?? '#4e7a9b' }}>+{row.pts} pts</div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* ELO changes */}
              {eloList && (
                <div style={{ background: '#0f2236', border: '1px solid #1e4976', borderRadius: 14, overflow: 'hidden' }}>
                  <div style={{ padding: '12px 20px', borderBottom: '1px solid #1e4976', fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: '#4e7a9b' }}>
                    ELO Changes
                  </div>
                  {eloList.map(({ player, eloChange }, i) => (
                    <div key={player._id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 20px', borderBottom: '1px solid #0d1b2a' }}>
                      <div style={{ width: 28, fontSize: 13, color: '#4e7a9b', flexShrink: 0 }}>#{i + 1}</div>
                      <div style={{ flex: 1, fontSize: 14 }}>{player.username}</div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: eloChange > 0 ? '#3dcf8e' : eloChange < 0 ? '#f87171' : '#4e7a9b' }}>
                        {eloChange > 0 ? `+${eloChange}` : eloChange === 0 ? 'Â±0' : eloChange}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Round Robin standings */}
              {isRoundRobin && (
                <div style={{ background: '#0f2236', border: '1px solid #1e4976', borderRadius: 14, overflow: 'hidden' }}>
                  <div style={{ padding: '12px 20px', borderBottom: '1px solid #1e4976', fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: '#4e7a9b' }}>
                    Full Standings
                  </div>
                  {computeStandings().map((s, i) => (
                    <div key={s.username} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 20px', borderBottom: '1px solid #0d1b2a' }}>
                      <div style={{ width: 28, fontSize: 13, color: '#4e7a9b' }}>{i + 1}</div>
                      <div style={{ flex: 1, fontSize: 14 }}>{s.username}</div>
                      <div style={{ fontSize: 13, color: '#4e7a9b' }}>{s.wins}W â€” {s.losses}L</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </>
  );
}

function SectionTitle({ children }) {
  return (
    <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: '#4e7a9b', marginBottom: 12 }}>
      {children}
    </div>
  );
}

function BracketSection({ title, rounds, roundNumbers, renderMatch }) {
  return (
    <div>
      <SectionTitle>{title}</SectionTitle>
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {roundNumbers.map((r) => (
          <div key={r} style={{ minWidth: 200 }}>
            <div style={{ fontSize: 11, color: '#2e4a62', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Round {r}</div>
            {rounds[r].map(renderMatch)}
          </div>
        ))}
      </div>
    </div>
  );
}

const ghostBtn = {
  background: 'transparent', border: '1px solid #1e4976', borderRadius: 8,
  color: '#5ba3d9', fontSize: 12, fontWeight: 700, letterSpacing: 1.5,
  textTransform: 'uppercase', padding: '7px 14px', cursor: 'pointer',
};

const primaryBtn = {
  background: '#0f2236', border: '1px solid #2e6da4', borderRadius: 8,
  color: '#5ba3d9', fontSize: 13, fontWeight: 700, padding: '10px 20px', cursor: 'pointer',
};

const dangerBtn = {
  background: '#2a0a14', border: '1px solid #8a1a2a', borderRadius: 8,
  color: '#f87171', fontSize: 13, fontWeight: 700, padding: '10px 20px', cursor: 'pointer',
};

const reportBtn = {
  background: '#112233', border: '1px solid #1e4976', borderRadius: 6,
  color: '#e8f1fa', fontSize: 11, padding: '4px 8px', cursor: 'pointer',
};



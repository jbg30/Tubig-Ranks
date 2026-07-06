import API from '../api.js';
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { getRank } from '../utils/ranks';
import TopNav from '../components/TopNav';
import diamondIcon from '../assets/Diamond rank.png';
import rubyIcon from '../assets/Ruby rank.png';
import emeraldIcon from '../assets/Emerald rank.png';
import amethystIcon from '../assets/Amethyst rank.png';
import goldIcon from '../assets/Gold rank.png';
import silverIcon from '../assets/Silver rank.png';
import bronzeIcon from '../assets/Bronze rank.png';
import coalIcon from '../assets/Coal rank.png';

const rankIconMap = { diamond: { icon: diamondIcon, glow: '#5dd5e8' }, ruby: { icon: rubyIcon, glow: '#af2323' }, emerald: { icon: emeraldIcon, glow: '#4dbf72' }, amethyst: { icon: amethystIcon, glow: '#9966cc' }, gold: { icon: goldIcon }, silver: { icon: silverIcon }, bronze: { icon: bronzeIcon }, coal: { icon: coalIcon } };

const getRankClass = (mmr) => {
  if (mmr < 1000) return 'coal';
  if (mmr < 1100) return 'bronze';
  if (mmr < 1200) return 'silver';
  if (mmr < 1300) return 'gold';
  if (mmr < 1400) return 'amethyst';
  if (mmr < 1500) return 'emerald';
  if (mmr < 1600) return 'ruby';
  return 'diamond';
};

export default function Match() {
  const { id } = useParams();
  const { user } = useUser();
  const navigate = useNavigate();

  const [match, setMatch] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [reportedTeam, setReportedTeam] = useState(null);
  const [abandoned, setAbandoned] = useState(false);
  const pollRef = useRef(null);
  const leavingRef = useRef(false);

  useEffect(() => {
    fetchMatch();
    pollRef.current = setInterval(checkMatchStatus, 2000);
    return () => clearInterval(pollRef.current);
  }, [id]);

  const fetchMatch = async () => {
    try {
      const res = await fetch(`${API}/api/matches/${id}`);
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Match not found'); setLoading(false); return; }
      setMatch(data);
      setLoading(false);
    } catch { setError('Could not reach the server'); setLoading(false); }
  };

  const checkMatchStatus = async () => {
    if (leavingRef.current) return;
    try {
      const res = await fetch(`${API}/api/matches/${id}`);
      const data = await res.json();
      if (data.status === 'abandoned') { clearInterval(pollRef.current); setMatch(data); setAbandoned(true); }
      else if (data.status === 'completed') { clearInterval(pollRef.current); setMatch(data); }
      else setMatch(data);
    } catch {}
  };

  const handleBackToLobby = async () => {
    leavingRef.current = true;
    clearInterval(pollRef.current);
    try {
      await fetch(`${API}/api/matches/leave`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user._id, matchId: match._id }),
      });
    } catch {}
    navigate('/lobby');
  };

  const handleReportResult = async (winningTeam) => {
    try {
      const res = await fetch(`${API}/api/matches/${id}/result`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user._id, winningTeam }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error); return; }
      setReportedTeam(winningTeam);
      if (data.status === 'completed') { setMatch((m) => ({ ...m, status: 'completed', winningTeam: data.winningTeam })); }
      else if (data.status === 'disputed') { setMatch((m) => ({ ...m, status: 'disputed' })); }
    } catch { alert('Could not reach the server'); }
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0d1b2a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4e7a9b', fontFamily: 'sans-serif' }}>Loading...</div>
  );

  if (error) return (
    <>
      <TopNav />
      <div style={{ minHeight: '100vh', background: '#0d1b2a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, fontFamily: 'sans-serif' }}>
        <p style={{ color: '#f87171' }}>{error}</p>
        <button onClick={handleBackToLobby} style={ghostBtn}>Back to Lobby</button>
      </div>
    </>
  );

  const teamA = match.players.filter((p) => p.team === 'A');
  const teamB = match.players.filter((p) => p.team === 'B');
  const myTeam = match.players.find((p) => p.userId._id === user._id)?.team;
  const completed = match.status === 'completed';
  const disputed = match.status === 'disputed';
  const won = completed && match.winningTeam === myTeam;

  const renderTeam = (players, label) => (
    <div style={{ flex: 1, background: '#0f2236', border: '1px solid #1e4976', borderRadius: 14, overflow: 'hidden', minWidth: 200 }}>
      <div style={{ padding: '10px 16px', borderBottom: '1px solid #1e4976', fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: '#4e7a9b', textAlign: 'center' }}>
        Team {label}
        {completed && match.winningTeam === label && (
          <span style={{ color: '#3dcf8e', marginLeft: 8 }}>Â· Winner</span>
        )}
      </div>
      {players.map((p) => {
        const rank = getRank(p.userId.mmr);
        const isMe = p.userId._id === user._id;
        return (
          <div key={p.userId._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid #0d1b2a', background: isMe ? '#0a1e30' : 'transparent' }}>
            {(() => { const rc = rankIconMap[getRankClass(p.userId.mmr)]; return <img src={rc.icon} alt={rank.name} style={{ width: 36, height: 36, objectFit: 'contain', flexShrink: 0, filter: rc.glow ? `drop-shadow(0 0 5px ${rc.glow})` : 'none' }} />; })()}
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{p.userId.username}{isMe ? <span style={{ color: '#4e7a9b', fontSize: 11, fontWeight: 400, marginLeft: 6 }}>You</span> : ''}</div>
              <div style={{ fontSize: 12, color: rank.color }}>{p.userId.isPlaced ? rank.name : 'Unranked'}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#e8f1fa' }}>{p.userId.mmr.toLocaleString()}</div>
              <div style={{ fontSize: 10, color: '#4e7a9b', letterSpacing: 1 }}>ELO</div>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <>
      <TopNav />
      <div style={{ minHeight: '100vh', background: '#0d1b2a', color: '#e8f1fa', fontFamily: 'sans-serif', paddingTop: 80, paddingBottom: 60 }}>
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Header */}
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 38, letterSpacing: 4, margin: '0 0 4px' }}>
              {abandoned ? 'Match Abandoned' : disputed ? 'Result Disputed' : completed ? (won ? 'Victory' : 'Defeat') : 'Match Found'}
            </h1>
            <div style={{ fontSize: 13, color: '#4e7a9b', textTransform: 'uppercase', letterSpacing: 2 }}>
              {match.mode}
              {completed && !abandoned && <span style={{ marginLeft: 8, color: won ? '#3dcf8e' : '#f87171' }}>Â· {won ? 'You Won' : 'You Lost'}</span>}
            </div>
          </div>

          {/* Disputed banner */}
          {disputed && (
            <div style={{
              background: '#1a1200',
              border: '1px solid #8a6500',
              borderLeft: '4px solid #f0a500',
              borderRadius: 12,
              padding: '20px 24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
              animation: 'fadeSlideDown 0.4s ease both',
            }}>
              <div style={{ fontSize: 28, fontFamily: "'Bebas Neue', sans-serif", letterSpacing: 3, color: '#f0a500' }}>
                Result Disputed
              </div>
              <div style={{ fontSize: 13, color: '#a08040', textAlign: 'center' }}>
                Players reported different results. An admin will review and resolve this match.
              </div>
              <button
                onClick={() => navigate('/lobby')}
                style={{ marginTop: 4, background: 'transparent', border: '1px solid #8a6500', borderRadius: 8, color: '#f0a500', fontSize: 13, fontWeight: 700, padding: '10px 28px', cursor: 'pointer', letterSpacing: 1, transition: 'background 0.15s' }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#2a1e00'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                Return to Lobby
              </button>
            </div>
          )}

          {/* Abandoned banner */}
          {abandoned && (
            <div style={{
              background: '#1a0508',
              border: '1px solid #8a1a2a',
              borderLeft: '4px solid #f87171',
              borderRadius: 12,
              padding: '20px 24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
              animation: 'fadeSlideDown 0.4s ease both',
            }}>
              <div style={{ fontSize: 28, fontFamily: "'Bebas Neue', sans-serif", letterSpacing: 3, color: '#f87171' }}>
                A Player Left the Game
              </div>
              <div style={{ fontSize: 13, color: '#a06070', textAlign: 'center' }}>
                This match has been marked as abandoned. No ELO changes will be applied.
              </div>
              <button
                onClick={() => navigate('/lobby')}
                style={{ marginTop: 4, background: 'transparent', border: '1px solid #8a1a2a', borderRadius: 8, color: '#f87171', fontSize: 13, fontWeight: 700, padding: '10px 28px', cursor: 'pointer', letterSpacing: 1, transition: 'background 0.15s' }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#2a0a14'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                Return to Lobby
              </button>
            </div>
          )}

          {/* Teams */}
          <div className="match-teams-row" style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {renderTeam(teamA, 'A')}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, color: '#2e4a62', flexShrink: 0 }}>VS</div>
            {renderTeam(teamB, 'B')}
          </div>

          {/* Report result */}
          {!completed && !abandoned && !disputed && (
            <div style={{ background: '#0f2236', border: '1px solid #1e4976', borderRadius: 14, padding: '20px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: '#4e7a9b', marginBottom: 16 }}>
                {reportedTeam ? `Waiting for confirmation... (you reported Team ${reportedTeam})` : 'Report Result'}
              </div>
              {!reportedTeam && (
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                  {['A', 'B'].map((team) => (
                    <button
                      key={team}
                      onClick={() => handleReportResult(team)}
                      style={{ background: myTeam === team ? '#0a2418' : '#0f2236', border: `1px solid ${myTeam === team ? '#1a7a52' : '#1e4976'}`, borderRadius: 8, color: myTeam === team ? '#3dcf8e' : '#e8f1fa', fontSize: 13, fontWeight: 700, padding: '10px 24px', cursor: 'pointer', transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)', willChange: 'transform', backfaceVisibility: 'hidden', WebkitFontSmoothing: 'subpixel-antialiased' }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.06)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      Team {team} Won
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ELO changes on completion */}
          {completed && (
            <div style={{ background: '#0f2236', border: '1px solid #1e4976', borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ padding: '12px 20px', borderBottom: '1px solid #1e4976', fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: '#4e7a9b' }}>ELO Changes</div>
              {match.players.map((p) => (
                <div key={p.userId._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 20px', borderBottom: '1px solid #0d1b2a' }}>
                  <div style={{ flex: 1, fontSize: 14 }}>{p.userId.username}</div>
                  <div style={{ fontSize: 12, color: '#4e7a9b', textTransform: 'uppercase', letterSpacing: 1 }}>Team {p.team}</div>
                  {p.eloChange !== null && p.eloChange !== undefined && (
                    <div style={{ fontWeight: 700, fontSize: 14, color: p.eloChange >= 0 ? '#3dcf8e' : '#f87171', minWidth: 48, textAlign: 'right' }}>
                      {p.eloChange >= 0 ? '+' : ''}{p.eloChange}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            {!completed && !abandoned && !disputed && (
              <button
                onClick={handleBackToLobby}
                style={dangerBtn}
                onMouseEnter={(e) => e.currentTarget.style.background = '#2a0a14'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >Leave Match</button>
            )}
            {completed && (
              <button onClick={() => navigate('/lobby')} style={primaryBtn}>Back to Lobby</button>
            )}
          </div>

        </div>
      </div>
      <style>{`
        @keyframes fadeSlideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        .pc-rank-badge { display: flex; align-items: center; justify-content: center; border-radius: 50%; font-weight: 900; letter-spacing: 1px; }
        .pc-rank-badge.coal { border: 2px solid #4b4b4b; background: #1a1a1a; color: #4b4b4b; }
        .pc-rank-badge.bronze { border: 2px solid #8b4a2c; background: #1a0e08; color: #8b4a2c; }
        .pc-rank-badge.silver { border: 2px solid #999; background: #1a1a1a; color: #999; }
        .pc-rank-badge.gold { border: 2px solid #dab640; background: #1a1400; color: #dab640; }
        .pc-rank-badge.amethyst { border: 2px solid #9966cc; background: #120a1a; color: #9966cc; }
        .pc-rank-badge.emerald { border: 2px solid #4dbf72; background: #071a0e; color: #4dbf72; }
        .pc-rank-badge.ruby { border: 2px solid #af2323; background: #1a0505; color: #af2323; }
        .pc-rank-badge.diamond { border: 2px solid #5dd5e8; background: #051a1e; color: #5dd5e8; }
      `}</style>
    </>
  );
}

const ghostBtn = { background: 'transparent', border: '1px solid #1e4976', borderRadius: 8, color: '#5ba3d9', fontSize: 12, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', padding: '10px 24px', cursor: 'pointer' };
const primaryBtn = { background: '#0f2236', border: '1px solid #2e6da4', borderRadius: 8, color: '#5ba3d9', fontSize: 13, fontWeight: 700, padding: '10px 24px', cursor: 'pointer' };
const dangerBtn = { background: 'transparent', border: '1px solid #8a1a2a', borderRadius: 8, color: '#f87171', fontSize: 12, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', padding: '10px 24px', cursor: 'pointer' };



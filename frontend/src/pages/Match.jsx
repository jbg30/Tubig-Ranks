import API, { authFetch } from '../api.js';
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { getRank } from '../utils/ranks';
import TopNav from '../components/TopNav';
import '../glitch-theme.css';
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
    pollRef.current = setInterval(checkMatchStatus, 1000);
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
      await authFetch(`${API}/api/matches/leave`, {
        method: 'POST',
        body: JSON.stringify({ userId: user._id, matchId: match._id }),
      });
    } catch {}
    navigate('/lobby');
  };

  const handleReportResult = async (winningTeam) => {
    try {
      const res = await authFetch(`${API}/api/matches/${id}/result`, {
        method: 'POST',
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
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--sub)', fontFamily: "'Fira Code', Consolas, monospace" }}>Loading...</div>
  );

  if (error) return (
    <>
      <TopNav />
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, fontFamily: "'Fira Code', Consolas, monospace" }}>
        <p style={{ color: 'var(--danger)' }}>{error}</p>
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
    <div style={{ flex: 1, background: 'var(--panel)', border: '1px solid rgba(0,242,234,0.2)', boxShadow: '0 0 1.2rem rgba(0,242,234,0.06)', overflow: 'hidden', minWidth: 200 }}>
      <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--sub)', textAlign: 'center' }}>
        Team {label}
        {completed && match.winningTeam === label && (
          <span style={{ color: 'var(--success)', marginLeft: 8 }}>· Winner</span>
        )}
      </div>
      {players.map((p) => {
        const rank = getRank(p.userId.mmr);
        const isMe = p.userId._id === user._id;
        return (
          <div key={p.userId._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid var(--bg)', background: isMe ? 'rgba(0,242,234,0.05)' : 'transparent' }}>
            {(() => { const rc = rankIconMap[getRankClass(p.userId.mmr)]; return <img src={rc.icon} alt={rank.name} style={{ width: 36, height: 36, objectFit: 'contain', flexShrink: 0, filter: rc.glow ? `drop-shadow(0 0 5px ${rc.glow})` : 'none' }} />; })()}
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{p.userId.username}{isMe ? <span style={{ color: 'var(--sub)', fontSize: 11, fontWeight: 400, marginLeft: 6 }}>You</span> : ''}</div>
              <div style={{ fontSize: 12, color: rank.color }}>{p.userId.isPlaced ? rank.name : 'Unranked'}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{p.userId.mmr.toLocaleString()}</div>
              <div style={{ fontSize: 10, color: 'var(--sub)', letterSpacing: 1 }}>ELO</div>
            </div>
          </div>
        );
      })}
    </div>
  );

  const headerText = abandoned ? 'Match Abandoned' : disputed ? 'Result Disputed' : completed ? (won ? 'Victory' : 'Defeat') : 'Match Found';

  return (
    <>
      <TopNav />
      <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: "'Fira Code', Consolas, monospace", paddingTop: 80, paddingBottom: 60 }}>
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Header */}
          <div style={{ textAlign: 'center' }}>
            <h1 className="glitch" data-text={headerText.toUpperCase()} style={{ fontSize: 34, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', margin: '0 0 4px', justifyContent: 'center' }}>
              {headerText}
            </h1>
            <div style={{ fontSize: 13, color: 'var(--sub)', textTransform: 'uppercase', letterSpacing: 2 }}>
              {match.mode}
              {completed && !abandoned && <span style={{ marginLeft: 8, color: won ? 'var(--success)' : 'var(--danger)' }}>· {won ? 'You Won' : 'You Lost'}</span>}
            </div>
          </div>

          {/* Disputed banner */}
          {disputed && (
            <div style={{
              background: 'var(--panel)',
              border: '1px solid rgba(240,165,0,0.4)',
              borderLeft: '4px solid var(--warning)',
              padding: '20px 24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
              animation: 'fadeSlideDown 0.4s ease both',
            }}>
              <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--warning)' }}>
                Result Disputed
              </div>
              <div style={{ fontSize: 13, color: 'var(--sub)', textAlign: 'center' }}>
                Players reported different results. An admin will review and resolve this match.
              </div>
              <button
                onClick={() => navigate('/lobby')}
                style={{ marginTop: 4, background: 'transparent', border: '1px solid var(--warning)', color: 'var(--warning)', fontFamily: 'inherit', fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '10px 28px', cursor: 'pointer', transition: 'background 0.15s, color 0.15s' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--warning)'; e.currentTarget.style.color = 'var(--bg)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--warning)'; }}
              >
                Return to Lobby
              </button>
            </div>
          )}

          {/* Abandoned banner */}
          {abandoned && (
            <div style={{
              background: 'var(--panel)',
              border: '1px solid rgba(255,92,122,0.4)',
              borderLeft: '4px solid var(--danger)',
              padding: '20px 24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
              animation: 'fadeSlideDown 0.4s ease both',
            }}>
              <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--danger)' }}>
                A Player Left the Game
              </div>
              <div style={{ fontSize: 13, color: 'var(--sub)', textAlign: 'center' }}>
                This match has been marked as abandoned. No ELO changes will be applied.
              </div>
              <button
                onClick={() => navigate('/lobby')}
                style={{ marginTop: 4, background: 'transparent', border: '1px solid var(--danger)', color: 'var(--danger)', fontFamily: 'inherit', fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '10px 28px', cursor: 'pointer', transition: 'background 0.15s, color 0.15s' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--danger)'; e.currentTarget.style.color = 'var(--bg)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--danger)'; }}
              >
                Return to Lobby
              </button>
            </div>
          )}

          {/* Teams */}
          <div className="match-teams-row" style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {renderTeam(teamA, 'A')}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, letterSpacing: 2, color: 'var(--purple)', flexShrink: 0 }}>VS</div>
            {renderTeam(teamB, 'B')}
          </div>

          {/* Report result */}
          {!completed && !abandoned && !disputed && (
            <div style={{ background: 'var(--panel)', border: '1px solid var(--border)', padding: '20px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--sub)', marginBottom: 16 }}>
                {reportedTeam ? `Waiting for confirmation... (you reported Team ${reportedTeam})` : 'Report Result'}
              </div>
              {!reportedTeam && (
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                  {['A', 'B'].map((team) => (
                    <button
                      key={team}
                      onClick={() => handleReportResult(team)}
                      style={{
                        background: myTeam === team ? 'rgba(0,242,234,0.08)' : 'transparent',
                        border: `1px solid ${myTeam === team ? 'var(--cyan)' : 'var(--border)'}`,
                        color: myTeam === team ? 'var(--cyan)' : 'var(--text)',
                        fontFamily: 'inherit',
                        fontSize: 13,
                        fontWeight: 700,
                        padding: '10px 24px',
                        cursor: 'pointer',
                        transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        willChange: 'transform',
                        backfaceVisibility: 'hidden',
                        WebkitFontSmoothing: 'subpixel-antialiased',
                      }}
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
            <div style={{ background: 'var(--panel)', border: '1px solid var(--border)', overflow: 'hidden' }}>
              <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--sub)' }}>ELO Changes</div>
              {match.players.map((p) => (
                <div key={p.userId._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 20px', borderBottom: '1px solid var(--bg)' }}>
                  <div style={{ flex: 1, fontSize: 14 }}>{p.userId.username}</div>
                  <div style={{ fontSize: 12, color: 'var(--sub)', textTransform: 'uppercase', letterSpacing: 1 }}>Team {p.team}</div>
                  {p.eloChange !== null && p.eloChange !== undefined && (
                    <div style={{ fontWeight: 700, fontSize: 14, color: p.eloChange >= 0 ? 'var(--success)' : 'var(--danger)', minWidth: 48, textAlign: 'right' }}>
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
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--danger)'; e.currentTarget.style.color = 'var(--bg)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--danger)'; }}
              >Leave Match</button>
            )}
            {completed && (
              <button onClick={() => navigate('/lobby')} className="gbtn" data-text="BACK TO LOBBY">
                <span className="btn-text">Back to Lobby</span>
              </button>
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

const ghostBtn = { background: 'transparent', border: '1px solid var(--border)', color: 'var(--cyan)', fontFamily: "'Fira Code', Consolas, monospace", fontSize: 12, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', padding: '10px 24px', cursor: 'pointer' };
const dangerBtn = { background: 'transparent', border: '2px solid var(--danger)', color: 'var(--danger)', fontFamily: "'Fira Code', Consolas, monospace", fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', padding: '10px 24px', cursor: 'pointer', transition: 'background 0.15s, color 0.15s' };

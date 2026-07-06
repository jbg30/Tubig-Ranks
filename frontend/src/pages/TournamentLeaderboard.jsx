import API from '../api.js';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

const MEDAL_COLORS = ['#dab640', '#999999', '#8b4a2c'];

export default function TournamentLeaderboard() {
  const navigate = useNavigate();
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await fetch(`${API}/api/tournament/leaderboard`);
        const data = await res.json();
        if (res.ok) setPlayers(data);
        else setError(data.error || 'Could not load leaderboard');
      } catch {
        setError('Could not reach the server');
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  return (
    <>
      <TopNav />
      <div style={{
        minHeight: '100vh',
        background: '#0d1b2a',
        color: '#e8f1fa',
        fontFamily: 'sans-serif',
        paddingTop: 80,
        paddingBottom: 60,
      }}>
        <div style={{ maxWidth: 620, margin: '0 auto', padding: '0 24px' }}>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
            <h1 style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 38,
              letterSpacing: 4,
              color: '#e8f1fa',
              margin: 0,
            }}>
              Tournament Leaderboard
            </h1>
            <button
              onClick={() => navigate('/tournaments')}
              style={{
                background: 'transparent',
                border: '1px solid #1e4976',
                borderRadius: 8,
                color: '#5ba3d9',
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: 1.5,
                textTransform: 'uppercase',
                padding: '7px 14px',
                cursor: 'pointer',
                transition: 'color 0.15s, border-color 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#e8f1fa'; e.currentTarget.style.borderColor = '#5ba3d9'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#5ba3d9'; e.currentTarget.style.borderColor = '#1e4976'; }}
            >
              History
            </button>
          </div>

          {error && <p style={{ color: '#f87171', fontSize: 13, marginBottom: 12 }}>{error}</p>}

          {loading ? (
            <div style={{ textAlign: 'center', color: '#4e7a9b', marginTop: 60 }}>Loading...</div>
          ) : players.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#2e4a62', marginTop: 60, fontSize: 14 }}>No tournament points awarded yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {players.map((p, i) => {
                const rank = p.isPlaced ? getRank(p.mmr) : null;
                const isTop3 = i < 3;
                const medalColor = MEDAL_COLORS[i] ?? null;

                return (
                  <div
                    key={p._id}
                    onClick={() => navigate(`/profile/${p._id}`)}
                    style={{
                      background: '#0f2236',
                      border: `1px solid ${isTop3 ? medalColor + '66' : '#1e4976'}`,
                      borderLeft: `4px solid ${isTop3 ? medalColor : '#1e4976'}`,
                      borderRadius: 12,
                      padding: '14px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16,
                      cursor: 'pointer',
                      transition: 'background 0.15s',
                      boxShadow: isTop3 ? `0 0 12px ${medalColor}22` : 'none',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#112233'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#0f2236'}
                  >
                    {/* Rank number */}
                    <div style={{
                      width: 28,
                      textAlign: 'center',
                      fontWeight: 800,
                      fontSize: 15,
                      color: medalColor ?? '#2e4a62',
                      flexShrink: 0,
                    }}>
                      {i + 1}
                    </div>

                    {/* Rank badge */}
                    {rank && getRankClass(p.mmr) === 'diamond'
                      ? <img src={diamondIcon} alt="Diamond" style={{ width: 36, height: 36, objectFit: 'contain', flexShrink: 0, filter: 'drop-shadow(0 0 6px #5dd5e8)' }} />
                      : rank && getRankClass(p.mmr) === 'ruby'
                      ? <img src={rubyIcon} alt="Ruby" style={{ width: 36, height: 36, objectFit: 'contain', flexShrink: 0, filter: 'drop-shadow(0 0 6px #af2323)' }} />
                      : rank && getRankClass(p.mmr) === 'emerald'
                      ? <img src={emeraldIcon} alt="Emerald" style={{ width: 36, height: 36, objectFit: 'contain', flexShrink: 0, filter: 'drop-shadow(0 0 6px #4dbf72)' }} />
                      : rank && getRankClass(p.mmr) === 'amethyst'
                      ? <img src={amethystIcon} alt="Amethyst" style={{ width: 36, height: 36, objectFit: 'contain', flexShrink: 0, filter: 'drop-shadow(0 0 6px #9966cc)' }} />
                      : rank && getRankClass(p.mmr) === 'gold'
                      ? <img src={goldIcon} alt="Gold" style={{ width: 36, height: 36, objectFit: 'contain', flexShrink: 0 }} />
                      : rank && getRankClass(p.mmr) === 'silver'
                      ? <img src={silverIcon} alt="Silver" style={{ width: 36, height: 36, objectFit: 'contain', flexShrink: 0 }} />
                      : rank && getRankClass(p.mmr) === 'bronze'
                      ? <img src={bronzeIcon} alt="Bronze" style={{ width: 36, height: 36, objectFit: 'contain', flexShrink: 0 }} />
                      : rank && getRankClass(p.mmr) === 'coal'
                      ? <img src={coalIcon} alt="Coal" style={{ width: 36, height: 36, objectFit: 'contain', flexShrink: 0 }} />
                      : <div className={`pc-rank-badge ${rank ? getRankClass(p.mmr) : 'coal'}`} style={{ width: 36, height: 36, fontSize: 11, flexShrink: 0 }}>
                          {rank ? rank.name.slice(0, 2).toUpperCase() : 'UN'}
                        </div>
                    }

                    {/* Name + rank */}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{p.username}</div>
                      <div style={{ fontSize: 12, color: rank?.color ?? '#4e7a9b', marginTop: 2 }}>
                        {rank ? rank.name : 'Unranked'}
                      </div>
                    </div>

                    {/* Points */}
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: medalColor ?? '#e8f1fa' }}>
                        {p.tournamentPoints}
                      </div>
                      <div style={{ fontSize: 11, color: '#4e7a9b', letterSpacing: 1, textTransform: 'uppercase' }}>pts</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}



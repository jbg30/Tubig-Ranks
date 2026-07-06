import API from '../api.js';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TopNav from '../components/TopNav';

const formatFormat = (f) => {
  if (f === 'single-elimination') return 'Single Elim';
  if (f === 'double-elimination') return 'Double Elim';
  if (f === 'round-robin') return 'Round Robin';
  return f;
};

const formatStatus = (s) => {
  if (s === 'registration') return 'Registration';
  if (s === 'active') return 'In Progress';
  if (s === 'completed') return 'Completed';
  return s;
};

const statusColor = (s) => {
  if (s === 'registration') return '#dab640';
  if (s === 'active') return '#3dcf8e';
  if (s === 'completed') return '#4e7a9b';
  return '#4e7a9b';
};

export default function TournamentHistory() {
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { fetchTournaments(); }, []);

  const fetchTournaments = async () => {
    try {
      const res = await fetch(`${API}/api/tournament/all`);
      const data = await res.json();
      if (res.ok) setTournaments(data);
      else setError(data.error || 'Could not load tournaments');
    } catch {
      setError('Could not reach the server');
    } finally {
      setLoading(false);
    }
  };

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
        <div style={{ maxWidth: 660, margin: '0 auto', padding: '0 24px' }}>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
            <h1 style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 38,
              letterSpacing: 4,
              color: '#e8f1fa',
              margin: 0,
            }}>
              Tournaments
            </h1>
            <button
              onClick={() => navigate('/tournament-leaderboard')}
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
              Leaderboard
            </button>
          </div>

          {error && <p style={{ color: '#f87171', fontSize: 13, marginBottom: 12 }}>{error}</p>}

          {loading ? (
            <div style={{ textAlign: 'center', color: '#4e7a9b', marginTop: 60 }}>Loading...</div>
          ) : tournaments.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#2e4a62', marginTop: 60, fontSize: 14 }}>No tournaments hosted yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {tournaments.map((t) => (
                <div
                  key={t._id}
                  onClick={() => navigate(`/tournament/${t._id}`)}
                  style={{
                    background: '#0f2236',
                    border: '1px solid #1e4976',
                    borderLeft: `4px solid ${statusColor(t.status)}`,
                    borderRadius: 12,
                    padding: '16px 20px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#112233'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#0f2236'}
                >
                  {/* Name + meta */}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: '#4e7a9b', display: 'flex', gap: 12 }}>
                      <span>{formatFormat(t.format)}</span>
                      <span>{t.participants.length} player{t.participants.length !== 1 ? 's' : ''}</span>
                      <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Status badge */}
                  <div style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: 1.5,
                    textTransform: 'uppercase',
                    color: statusColor(t.status),
                    flexShrink: 0,
                  }}>
                    {formatStatus(t.status)}
                  </div>

                  <span style={{ color: '#2e4a62', fontSize: 18 }}>â€º</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}



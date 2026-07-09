import API, { authFetch } from '../api.js';
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import TopNav from '../components/TopNav';

export default function Queue() {
  const { user } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const mode = location.state?.mode || '2v2';
  const partyId = location.state?.partyId || null;

  const [status, setStatus] = useState('joining');
  const [error, setError] = useState('');
  const [queueInfo, setQueueInfo] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const pollRef = useRef(null);
  const timerRef = useRef(null);
  const leavingRef = useRef(false);
  const matchFoundRef = useRef(false);

  useEffect(() => {
    joinQueue();
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => { clearInterval(pollRef.current); clearInterval(timerRef.current); };
  }, []);

  const joinQueue = async () => {
    try {
      const url = partyId ? `${API}/api/queue/join-party` : `${API}/api/queue/join`;
      const body = partyId ? { partyId, userId: user._id } : { userId: user._id, mode };
      const res = await authFetch(url, { method: 'POST', body: JSON.stringify(body) });
      const data = await res.json();
      if (res.status === 409) { setStatus('waiting'); pollRef.current = setInterval(checkQueue, 2000); return; }
      if (!res.ok) { setError(data.error || 'Could not join queue'); setStatus('error'); return; }
      if (data.status === 'matched') { navigate(`/match/${data.match._id}`); return; }
      setStatus('waiting');
      setQueueInfo(data);
      pollRef.current = setInterval(checkQueue, 2000);
    } catch { setError('Could not reach the server'); setStatus('error'); }
  };

  const checkQueue = async () => {
    if (leavingRef.current) return;
    try {
      await authFetch(`${API}/api/queue/heartbeat`, { method: 'POST', body: JSON.stringify({ userId: user._id }) });
      const res = await fetch(`${API}/api/queue/status`);
      const data = await res.json();
      const stillQueued = data.queue.find((entry) => entry.userId === user._id || entry.partyMemberIds?.includes(user._id));
      if (!stillQueued) {
        const matchesRes = await fetch(`${API}/api/matches`);
        const matches = await matchesRes.json();
        const myMatch = matches.find((m) => m.status === 'active' && m.players.some((p) => p.userId === user._id || p.userId?._id === user._id));
        if (myMatch) { matchFoundRef.current = true; clearInterval(pollRef.current); navigate(`/match/${myMatch._id}`); }
        else if (partyId && !leavingRef.current && !matchFoundRef.current) { leavingRef.current = true; clearInterval(pollRef.current); alert('Your party member left the party. Queue cancelled.'); navigate('/lobby'); }
      } else {
        const playersForMode = data.queue.filter((entry) => entry.mode === mode);
        setQueueInfo({ queueSize: playersForMode.length, needed: data.modeSizes[mode] });
      }
    } catch { setError('Lost connection to server'); }
  };

  const handleCancel = async () => {
    leavingRef.current = true;
    clearInterval(pollRef.current);
    clearInterval(timerRef.current);
    try {
      const url = partyId ? `${API}/api/party/leave` : `${API}/api/queue/leave`;
      await authFetch(url, { method: 'POST', body: JSON.stringify({ userId: user._id }) });
      if (partyId) await authFetch(`${API}/api/queue/leave`, { method: 'POST', body: JSON.stringify({ userId: user._id }) });
    } catch {}
    navigate('/lobby');
  };

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  return (
    <>
      <TopNav showHome={false} />
      <div style={{
        minHeight: '100vh',
        background: '#0d1b2a',
        color: '#e8f1fa',
        fontFamily: 'sans-serif',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32, textAlign: 'center' }}>

          {/* Pulsing ring */}
          <div style={{ position: 'relative', width: 160, height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              border: '2px solid #1e4976',
              animation: status === 'waiting' ? 'queuePulse 2s ease-in-out infinite' : 'none',
            }} />
            <div style={{
              position: 'absolute', inset: 14, borderRadius: '50%',
              border: '2px solid #2e6da4',
              animation: status === 'waiting' ? 'queuePulse 2s ease-in-out infinite 0.4s' : 'none',
            }} />
            <div style={{
              width: 100, height: 100, borderRadius: '50%',
              background: '#0f2236',
              border: '2px solid #3dcf8e',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, color: '#3dcf8e', fontWeight: 800,
              letterSpacing: 2,
            }}>
              {status === 'waiting' ? formatTime(elapsed) : status === 'joining' ? '...' : '!'}
            </div>
          </div>

          <style>{`
            @keyframes queuePulse {
              0%, 100% { opacity: 0.3; transform: scale(1); }
              50% { opacity: 1; transform: scale(1.05); }
            }
          `}</style>

          {/* Status text */}
          <div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, letterSpacing: 4, marginBottom: 6 }}>
              {status === 'joining' ? 'Joining Queue' : status === 'waiting' ? 'Searching' : 'Error'}
            </div>
            <div style={{ fontSize: 13, color: '#4e7a9b', letterSpacing: 1, textTransform: 'uppercase' }}>
              {mode}{partyId ? ' Â· Party' : ''}
            </div>
          </div>

          {/* Player count */}
          {queueInfo && (
            <div style={{ background: '#0f2236', border: '1px solid #1e4976', borderRadius: 10, padding: '12px 32px' }}>
              <span style={{ fontSize: 22, fontWeight: 800, color: '#3dcf8e' }}>{queueInfo.queueSize}</span>
              <span style={{ fontSize: 16, color: '#2e4a62', margin: '0 8px' }}>/</span>
              <span style={{ fontSize: 22, fontWeight: 800, color: '#e8f1fa' }}>{queueInfo.needed}</span>
              <div style={{ fontSize: 11, color: '#4e7a9b', letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 4 }}>Players Ready</div>
            </div>
          )}

          {status === 'error' && <p style={{ color: '#f87171', fontSize: 13 }}>{error}</p>}

          <button
            onClick={handleCancel}
            style={{
              background: 'transparent',
              border: '1px solid #8a1a2a',
              borderRadius: 8,
              color: '#f87171',
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: 1.5,
              textTransform: 'uppercase',
              padding: '10px 32px',
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#2a0a14'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            Cancel
          </button>
        </div>
      </div>
    </>
  );
}



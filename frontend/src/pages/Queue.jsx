import API, { authFetch } from '../api.js';
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import TopNav from '../components/TopNav';
import '../glitch-theme.css';

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
      if (res.status === 409) { setStatus('waiting'); pollRef.current = setInterval(checkQueue, 750); return; }
      if (!res.ok) { setError(data.error || 'Could not join queue'); setStatus('error'); return; }
      if (data.status === 'matched') { navigate(`/match/${data.match._id}`); return; }
      setStatus('waiting');
      setQueueInfo(data);
      pollRef.current = setInterval(checkQueue, 750);
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
        background: 'var(--bg)',
        color: 'var(--text)',
        fontFamily: "'Fira Code', Consolas, monospace",
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32, textAlign: 'center' }}>

          {/* Pulsing ring */}
          <div style={{ position: 'relative', width: 160, height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              border: '2px solid var(--border)',
              animation: status === 'waiting' ? 'queuePulse 2s ease-in-out infinite' : 'none',
            }} />
            <div style={{
              position: 'absolute', inset: 14, borderRadius: '50%',
              border: '2px solid var(--border-strong)',
              animation: status === 'waiting' ? 'queuePulse 2s ease-in-out infinite 0.4s' : 'none',
            }} />
            <div style={{
              width: 100, height: 100, borderRadius: '50%',
              background: 'var(--panel)',
              border: '2px solid var(--cyan)',
              boxShadow: '0 0 24px rgba(0, 242, 234, 0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, color: 'var(--cyan)', fontWeight: 800,
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
            <div className="glitch" data-text={status === 'joining' ? 'JOINING QUEUE' : status === 'waiting' ? 'SEARCHING' : 'ERROR'} style={{ fontSize: 30, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 6, justifyContent: 'center' }}>
              {status === 'joining' ? 'Joining Queue' : status === 'waiting' ? 'Searching' : 'Error'}
            </div>
            <div style={{ fontSize: 13, color: 'var(--sub)', letterSpacing: 1, textTransform: 'uppercase' }}>
              {mode}{partyId ? ' · Party' : ''}
            </div>
          </div>

          {/* Player count */}
          {queueInfo && (
            <div style={{ background: 'var(--panel)', border: '1px solid rgba(0,242,234,0.2)', boxShadow: '0 0 1rem rgba(0,242,234,0.08)', padding: '12px 32px' }}>
              <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--cyan)' }}>{queueInfo.queueSize}</span>
              <span style={{ fontSize: 16, color: 'var(--faint)', margin: '0 8px' }}>/</span>
              <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>{queueInfo.needed}</span>
              <div style={{ fontSize: 11, color: 'var(--sub)', letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 4 }}>Players Ready</div>
            </div>
          )}

          {status === 'error' && <p style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</p>}

          <button
            onClick={handleCancel}
            style={{
              background: 'transparent',
              border: '2px solid var(--danger)',
              color: 'var(--danger)',
              fontFamily: 'inherit',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              padding: '0.75em 2em',
              cursor: 'pointer',
              transition: 'background 0.15s, color 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--danger)'; e.currentTarget.style.color = 'var(--bg)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--danger)'; }}
          >
            Cancel
          </button>
        </div>
      </div>
    </>
  );
}

import API, { authFetch } from '../api.js';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import TopNav from '../components/TopNav';

const inputStyle = {
  width: '100%', padding: '10px 14px', background: '#0a1828',
  border: '1px solid #1e4976', borderRadius: 8, color: '#e8f1fa',
  fontSize: 14, outline: 'none', boxSizing: 'border-box',
};

const btnPrimary = {
  width: '100%', padding: '11px 0', background: '#0f2236',
  border: '1px solid #2e6da4', borderRadius: 8, color: '#5ba3d9',
  fontSize: 13, fontWeight: 700, letterSpacing: 1, cursor: 'pointer',
  transition: 'background 0.15s, color 0.15s',
};

export default function Admin() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [pending, setPending] = useState([]);
  const [resetUsername, setResetUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  useEffect(() => {
    if (!user.isAdmin) { navigate('/lobby'); return; }
    fetchPending();
  }, []);

  const fetchPending = async () => {
    try {
      const res = await authFetch(`${API}/api/users/pending/${user._id}`);
      const data = await res.json();
      if (res.ok) setPending(data);
    } catch {}
  };

  const handleApprove = async (userId) => {
    try {
      await authFetch(`${API}/api/users/approve`, {
        method: 'POST',
        body: JSON.stringify({ adminId: user._id, userId }),
      });
      fetchPending();
    } catch {}
  };

  const handleResetPassword = async () => {
    setResetMessage(''); setResetSuccess(false);
    try {
      const usersRes = await authFetch(`${API}/api/users`);
      const allUsers = await usersRes.json();
      const targetUser = allUsers.find((u) => u.username.toLowerCase() === resetUsername.toLowerCase());
      if (!targetUser) { setResetMessage('No user found with that username.'); return; }
      const res = await authFetch(`${API}/api/users/admin-reset-password`, {
        method: 'POST',
        body: JSON.stringify({ adminId: user._id, targetUserId: targetUser._id, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setResetMessage(data.error); return; }
      setResetMessage(`Password reset for ${targetUser.username}.`);
      setResetSuccess(true);
      setResetUsername(''); setNewPassword('');
    } catch { setResetMessage('Could not reach the server'); }
  };

  return (
    <>
      <TopNav />
      <div style={{ minHeight: '100vh', background: '#0d1b2a', color: '#e8f1fa', fontFamily: 'sans-serif', paddingTop: 80, paddingBottom: 60 }}>
        <div style={{ maxWidth: 520, margin: '0 auto', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 38, letterSpacing: 4, margin: '0 0 8px' }}>Admin Panel</h1>

          {/* Pending Approvals */}
          <div style={{ background: '#0f2236', border: '1px solid #1e4976', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '12px 20px', borderBottom: '1px solid #1e4976', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: '#4e7a9b' }}>Pending Approvals</span>
              {pending.length > 0 && (
                <span style={{ background: '#f0a500', color: '#0d1b2a', fontSize: 11, fontWeight: 800, borderRadius: 99, padding: '2px 8px' }}>{pending.length}</span>
              )}
            </div>
            {pending.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#2e4a62', fontSize: 13 }}>No pending accounts.</div>
            ) : (
              pending.map((u) => (
                <div key={u._id} style={{ display: 'flex', alignItems: 'center', padding: '12px 20px', borderBottom: '1px solid #0d1b2a', gap: 12 }}>
                  <div style={{ flex: 1, fontWeight: 600, fontSize: 14 }}>{u.username}</div>
                  <button
                    onClick={() => handleApprove(u._id)}
                    style={{ background: '#0a2418', border: '1px solid #1a7a52', borderRadius: 7, color: '#3dcf8e', fontSize: 12, fontWeight: 700, padding: '6px 16px', cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#0f3322'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#0a2418'}
                  >
                    Approve
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Reset Password */}
          <div style={{ background: '#0f2236', border: '1px solid #1e4976', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '12px 20px', borderBottom: '1px solid #1e4976', fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: '#4e7a9b' }}>
              Reset Player Password
            </div>
            <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input
                type="text"
                placeholder="Username"
                value={resetUsername}
                onChange={(e) => setResetUsername(e.target.value)}
                style={inputStyle}
              />
              <input
                type="password"
                placeholder="New password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleResetPassword()}
                style={inputStyle}
              />
              <button
                onClick={handleResetPassword}
                style={btnPrimary}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#1a3a5c'; e.currentTarget.style.color = '#e8f1fa'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#0f2236'; e.currentTarget.style.color = '#5ba3d9'; }}
              >
                Reset Password
              </button>
              {resetMessage && (
                <p style={{ color: resetSuccess ? '#3dcf8e' : '#f87171', fontSize: 12, margin: 0 }}>{resetMessage}</p>
              )}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}



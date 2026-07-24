import API, { authFetch } from '../api.js';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import TopNav from '../components/TopNav';
import '../glitch-theme.css';

const inputStyle = {
  width: '100%', padding: '10px 14px', background: 'var(--panel2)',
  border: '1px solid var(--border)', color: 'var(--text)',
  fontFamily: 'inherit', fontSize: 14, outline: 'none', boxSizing: 'border-box',
};

const cardStyle = { background: 'var(--panel)', border: '1px solid rgba(0,242,234,0.2)', boxShadow: '0 0 1.2rem rgba(0,242,234,0.06)', overflow: 'hidden' };
const cardHeadStyle = { padding: '12px 20px', borderBottom: '1px solid var(--border)', fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--sub)' };

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
      <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: "'Fira Code', Consolas, monospace", paddingTop: 80, paddingBottom: 60 }}>
        <div style={{ maxWidth: 520, margin: '0 auto', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          <h1 className="glitch" data-text="ADMIN PANEL" style={{ fontSize: 32, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', margin: '0 0 8px' }}>Admin Panel</h1>

          {/* Pending Approvals */}
          <div style={cardStyle}>
            <div style={{ ...cardHeadStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Pending Approvals</span>
              {pending.length > 0 && (
                <span style={{ background: 'var(--warning)', color: 'var(--bg)', fontSize: 11, fontWeight: 800, borderRadius: 99, padding: '2px 8px' }}>{pending.length}</span>
              )}
            </div>
            {pending.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--faint)', fontSize: 13 }}>No pending accounts.</div>
            ) : (
              pending.map((u) => (
                <div key={u._id} style={{ display: 'flex', alignItems: 'center', padding: '12px 20px', borderBottom: '1px solid var(--bg)', gap: 12 }}>
                  <div style={{ flex: 1, fontWeight: 600, fontSize: 14 }}>{u.username}</div>
                  <button
                    onClick={() => handleApprove(u._id)}
                    style={{ background: 'transparent', border: '1px solid rgba(47,227,160,0.5)', color: 'var(--success)', fontFamily: 'inherit', fontSize: 12, fontWeight: 700, padding: '6px 16px', cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(47,227,160,0.12)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    Approve
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Reset Password */}
          <div style={cardStyle}>
            <div style={cardHeadStyle}>Reset Player Password</div>
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
              <button onClick={handleResetPassword} className="gbtn" data-text="RESET PASSWORD">
                <span className="btn-text">Reset Password</span>
              </button>
              {resetMessage && (
                <p style={{ color: resetSuccess ? 'var(--success)' : 'var(--danger)', fontSize: 12, margin: 0 }}>{resetMessage}</p>
              )}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}

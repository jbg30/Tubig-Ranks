import API, { authFetch } from '../api.js';
import { useState } from 'react';
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

export default function Settings() {
  const { user, refreshUser, logoutUser } = useUser();
  const navigate = useNavigate();

  const [newUsername, setNewUsername] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [usernameSuccess, setUsernameSuccess] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const handleUpdateUsername = async () => {
    setUsernameError(''); setUsernameSuccess('');
    try {
      const res = await authFetch(`${API}/api/users/update-username`, {
        method: 'POST',
        body: JSON.stringify({ userId: user._id, newUsername }),
      });
      const data = await res.json();
      if (!res.ok) { setUsernameError(data.error); return; }
      setUsernameSuccess('Username updated!');
      setNewUsername('');
      refreshUser();
    } catch { setUsernameError('Could not reach the server'); }
  };

  const handleUpdatePassword = async () => {
    setPasswordError(''); setPasswordSuccess('');
    try {
      const res = await authFetch(`${API}/api/users/update-password`, {
        method: 'POST',
        body: JSON.stringify({ userId: user._id, currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setPasswordError(data.error); return; }
      setPasswordSuccess('Password updated!');
      setCurrentPassword(''); setNewPassword('');
    } catch { setPasswordError('Could not reach the server'); }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This cannot be undone.')) return;
    try {
      await authFetch(`${API}/api/users/delete-account`, {
        method: 'POST',
        body: JSON.stringify({ userId: user._id }),
      });
      await logoutUser();
      navigate('/');
    } catch { alert('Could not delete account. Please try again.'); }
  };

  return (
    <>
      <TopNav />
      <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: "'Fira Code', Consolas, monospace", paddingTop: 80, paddingBottom: 60 }}>
        <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          <h1 className="glitch" data-text="SETTINGS" style={{ fontSize: 32, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', margin: '0 0 8px' }}>Settings</h1>

          {/* Change Username */}
          <div style={cardStyle}>
            <div style={cardHeadStyle}>Change Username</div>
            <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input
                type="text"
                placeholder={`Current: ${user.username}`}
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleUpdateUsername()}
                style={inputStyle}
              />
              <button onClick={handleUpdateUsername} className="gbtn" data-text="UPDATE USERNAME">
                <span className="btn-text">Update Username</span>
              </button>
              {usernameError && <p style={{ color: 'var(--danger)', fontSize: 12, margin: 0 }}>{usernameError}</p>}
              {usernameSuccess && <p style={{ color: 'var(--success)', fontSize: 12, margin: 0 }}>{usernameSuccess}</p>}
            </div>
          </div>

          {/* Change Password */}
          <div style={cardStyle}>
            <div style={cardHeadStyle}>Change Password</div>
            <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input
                type="password"
                placeholder="Current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                style={inputStyle}
              />
              <input
                type="password"
                placeholder="New password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleUpdatePassword()}
                style={inputStyle}
              />
              <button onClick={handleUpdatePassword} className="gbtn" data-text="UPDATE PASSWORD">
                <span className="btn-text">Update Password</span>
              </button>
              {passwordError && <p style={{ color: 'var(--danger)', fontSize: 12, margin: 0 }}>{passwordError}</p>}
              {passwordSuccess && <p style={{ color: 'var(--success)', fontSize: 12, margin: 0 }}>{passwordSuccess}</p>}
            </div>
          </div>

          {/* Danger zone */}
          <div style={{ ...cardStyle, border: '1px solid rgba(255,92,122,0.4)', marginTop: 8 }}>
            <div style={{ ...cardHeadStyle, borderBottom: '1px solid rgba(255,92,122,0.4)', color: 'var(--danger)' }}>
              Danger Zone
            </div>
            <div style={{ padding: '18px 20px' }}>
              <button
                onClick={handleDeleteAccount}
                style={{ width: '100%', padding: '11px 0', background: 'transparent', border: '2px solid var(--danger)', color: 'var(--danger)', fontFamily: 'inherit', fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', transition: 'background 0.15s, color 0.15s' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--danger)'; e.currentTarget.style.color = 'var(--bg)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--danger)'; }}
              >
                Delete Account
              </button>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}

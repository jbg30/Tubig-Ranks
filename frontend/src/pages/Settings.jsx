import API from '../api.js';
import { useState } from 'react';
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
      const res = await fetch(`${API}/api/users/update-username`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
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
      const res = await fetch(`${API}/api/users/update-password`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
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
      await fetch(`${API}/api/users/delete-account`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user._id }),
      });
      await logoutUser();
      navigate('/');
    } catch { alert('Could not delete account. Please try again.'); }
  };

  return (
    <>
      <TopNav />
      <div style={{ minHeight: '100vh', background: '#0d1b2a', color: '#e8f1fa', fontFamily: 'sans-serif', paddingTop: 80, paddingBottom: 60 }}>
        <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 38, letterSpacing: 4, margin: '0 0 8px' }}>Settings</h1>

          {/* Change Username */}
          <div style={{ background: '#0f2236', border: '1px solid #1e4976', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '12px 20px', borderBottom: '1px solid #1e4976', fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: '#4e7a9b' }}>
              Change Username
            </div>
            <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input
                type="text"
                placeholder={`Current: ${user.username}`}
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleUpdateUsername()}
                style={inputStyle}
              />
              <button
                onClick={handleUpdateUsername}
                style={btnPrimary}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#1a3a5c'; e.currentTarget.style.color = '#e8f1fa'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#0f2236'; e.currentTarget.style.color = '#5ba3d9'; }}
              >
                Update Username
              </button>
              {usernameError && <p style={{ color: '#f87171', fontSize: 12, margin: 0 }}>{usernameError}</p>}
              {usernameSuccess && <p style={{ color: '#3dcf8e', fontSize: 12, margin: 0 }}>{usernameSuccess}</p>}
            </div>
          </div>

          {/* Change Password */}
          <div style={{ background: '#0f2236', border: '1px solid #1e4976', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '12px 20px', borderBottom: '1px solid #1e4976', fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: '#4e7a9b' }}>
              Change Password
            </div>
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
              <button
                onClick={handleUpdatePassword}
                style={btnPrimary}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#1a3a5c'; e.currentTarget.style.color = '#e8f1fa'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#0f2236'; e.currentTarget.style.color = '#5ba3d9'; }}
              >
                Update Password
              </button>
              {passwordError && <p style={{ color: '#f87171', fontSize: 12, margin: 0 }}>{passwordError}</p>}
              {passwordSuccess && <p style={{ color: '#3dcf8e', fontSize: 12, margin: 0 }}>{passwordSuccess}</p>}
            </div>
          </div>

          {/* Danger zone */}
          <div style={{ background: '#0f2236', border: '1px solid #8a1a2a', borderRadius: 14, overflow: 'hidden', marginTop: 8 }}>
            <div style={{ padding: '12px 20px', borderBottom: '1px solid #8a1a2a', fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: '#f87171' }}>
              Danger Zone
            </div>
            <div style={{ padding: '18px 20px' }}>
              <button
                onClick={handleDeleteAccount}
                style={{ width: '100%', padding: '11px 0', background: 'transparent', border: '1px solid #8a1a2a', borderRadius: 8, color: '#f87171', fontSize: 13, fontWeight: 700, letterSpacing: 1, cursor: 'pointer', transition: 'background 0.15s' }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#2a0a14'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
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



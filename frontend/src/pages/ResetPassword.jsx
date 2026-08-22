import API from '../api.js';
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import tubigLogo from '../assets/Tubig Logo.png';
import './Register.css';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Missing reset token');
      return;
    }
    if (newPassword.length < 4) {
      setError('Password must be at least 4 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API}/api/users/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong');
        setLoading(false);
        return;
      }
      setDone(true);
    } catch (err) {
      setError('Could not reach the server');
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card gcard">
        <div className="gcard-head" />
        <div className="auth-avatar">
          <img src={tubigLogo} alt="Tubig Ranks" />
        </div>
        <div className="auth-body">
          <h1 className="auth-brand glitch" data-text="TUBIGRANKS">
            TUBIGRANKS
          </h1>
          <p className="auth-sub">Reset password</p>

          {done ? (
            <p style={{ color: 'var(--sub)', fontSize: 13, lineHeight: 1.6 }}>
              Your password has been reset. You can log in now.
            </p>
          ) : (
            <form className="auth-form" onSubmit={handleSubmit}>
              <input
                type="password"
                placeholder="New password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="auth-input"
              />
              <input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="auth-input"
              />
              <button
                type="submit"
                disabled={loading}
                className="gbtn auth-submit"
                data-text={loading ? 'RESETTING...' : 'RESET PASSWORD'}
              >
                <span className="btn-text">{loading ? 'Resetting...' : 'Reset password'}</span>
              </button>
            </form>
          )}

          {error && <p className="auth-error">{error}</p>}

          <button onClick={() => navigate('/login')} className="gbtn auth-submit" data-text="BACK TO LOGIN">
            <span className="btn-text">Back to login</span>
          </button>
        </div>
      </div>
    </div>
  );
}

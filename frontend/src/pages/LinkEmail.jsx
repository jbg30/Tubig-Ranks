import API, { authFetch } from '../api.js';
import { useState } from 'react';
import { useUser } from '../context/UserContext';
import tubigLogo from '../assets/Tubig Logo.png';
import './Register.css';

export default function LinkEmail() {
  const { user, refreshUser, logoutUser } = useUser();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    setLoading(true);
    try {
      const res = await authFetch(`${API}/api/users/link-email`, {
        method: 'POST',
        body: JSON.stringify({ userId: user._id, email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong');
        setLoading(false);
        return;
      }
      await refreshUser();
      setSent(true);
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
          <p className="auth-sub">Secure your account</p>

          {sent ? (
            <p style={{ color: 'var(--sub)', fontSize: 13, lineHeight: 1.6 }}>
              Check <strong>{email.trim()}</strong> for a verification link. Once verified you'll
              be able to use it for password resets.
            </p>
          ) : (
            <>
              <p style={{ color: 'var(--sub)', fontSize: 13, lineHeight: 1.6, margin: '0 0 1.2rem' }}>
                Your account doesn't have an email linked yet. Add one now so you can recover your
                account without needing an admin.
              </p>
              <form className="auth-form" onSubmit={handleSubmit}>
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="auth-input"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="gbtn auth-submit"
                  data-text={loading ? 'LINKING...' : 'LINK EMAIL'}
                >
                  <span className="btn-text">{loading ? 'Linking...' : 'Link email'}</span>
                </button>
              </form>
              {error && <p className="auth-error">{error}</p>}
            </>
          )}

          <p className="auth-footer-sub">
            <span onClick={logoutUser} style={{ cursor: 'pointer' }}>Log out</span>
          </p>
        </div>
      </div>
    </div>
  );
}

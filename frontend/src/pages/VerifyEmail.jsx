import API from '../api.js';
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import tubigLogo from '../assets/Tubig Logo.png';
import './Register.css';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setError('Missing verification token');
      return;
    }

    (async () => {
      try {
        const res = await fetch(`${API}/api/users/verify-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();
        if (!res.ok) {
          setStatus('error');
          setError(data.error || 'Verification failed');
          return;
        }
        setStatus('verified');
      } catch (err) {
        setStatus('error');
        setError('Could not reach the server');
      }
    })();
  }, [token]);

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

          {status === 'verifying' && <p className="auth-sub">Verifying your email...</p>}
          {status === 'verified' && (
            <p style={{ color: 'var(--sub)', fontSize: 13, lineHeight: 1.6 }}>
              Your email has been verified.
            </p>
          )}
          {status === 'error' && <p className="auth-error">{error}</p>}

          <button onClick={() => navigate('/login')} className="gbtn auth-submit" data-text="BACK TO LOGIN">
            <span className="btn-text">Back to login</span>
          </button>
        </div>
      </div>
    </div>
  );
}

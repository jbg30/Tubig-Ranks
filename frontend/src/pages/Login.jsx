import API from '../api.js';
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import tubigLogo from '../assets/Tubig Logo.png';
import './Register.css';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { loginUser } = useUser();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password) {
      setError('Username and password are required');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API}/api/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong');
        setLoading(false);
        return;
      }

      loginUser(data);
      navigate(data.needsEmailLink ? '/link-email' : '/lobby');
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
          <h1 className="auth-brand glitch" data-text="TUBIGRANKS" onClick={() => navigate('/')}>
            TUBIGRANKS
          </h1>
          <p className="auth-sub">Welcome back</p>

          <form className="auth-form" onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="auth-input"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-input"
            />
            <button
              type="submit"
              disabled={loading}
              className="gbtn auth-submit"
              data-text={loading ? 'LOGGING IN...' : 'LOG IN'}
            >
              <span className="btn-text">{loading ? 'Logging in...' : 'Log in'}</span>
            </button>
          </form>

          {error && <p className="auth-error">{error}</p>}

          <p className="auth-footer">
            Don't have an account? <Link to="/register">Register now</Link>
          </p>
          <p className="auth-footer-sub">
            <Link to="/forgot-password">Forgot username or password?</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

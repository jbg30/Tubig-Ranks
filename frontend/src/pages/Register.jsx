import API from '../api.js';
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import tubigLogo from '../assets/Tubig Logo.png';
import './Register.css';

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { loginUser } = useUser();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password || !email.trim()) {
      setError('Username, email, and password are required');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API}/api/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong');
        setLoading(false);
        return;
      }

      loginUser(data);
      navigate('/lobby');
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
          <p className="auth-sub">Create an account</p>

          <form className="auth-form" onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="auth-input"
            />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              data-text={loading ? 'CREATING...' : 'REGISTER'}
            >
              <span className="btn-text">{loading ? 'Creating account...' : 'Register'}</span>
            </button>
          </form>

          {error && <p className="auth-error">{error}</p>}

          <p className="auth-footer">
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

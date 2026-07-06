import API from '../api.js';
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUser } from '../context/UserContext';

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
      navigate('/lobby');
    } catch (err) {
      setError('Could not reach the server');
      setLoading(false);
    }
  };

  const inputStyle = {
    padding: '10px 14px',
    width: '100%',
    marginBottom: 12,
    boxSizing: 'border-box',
    background: '#132333',
    border: '1px solid #2e6da4',
    borderRadius: 8,
    color: '#e8f1fa',
    fontSize: 14,
    outline: 'none',
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0d1b2a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'sans-serif',
    }}>
      <div style={{
        background: '#112233',
        border: '1px solid #1e4976',
        borderRadius: 12,
        padding: '2.5rem 2rem',
        width: '100%',
        maxWidth: 360,
        textAlign: 'center',
      }}>
        <div
          onClick={() => navigate('/')}
          style={{ cursor: 'pointer', marginBottom: '1.5rem' }}
        >
          <h1 style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 36,
            fontWeight: 400,
            color: '#e8f1fa',
            letterSpacing: 4,
            margin: 0,
          }}>
            Tubig Ranks
          </h1>
        </div>

        <h2 style={{ color: '#e8f1fa', fontSize: 18, fontWeight: 500, margin: '0 0 1.5rem' }}>
          Welcome back
        </h2>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={inputStyle}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '11px 0',
              width: '100%',
              background: '#2e6da4',
              border: 'none',
              borderRadius: 8,
              color: '#e8f1fa',
              fontSize: 15,
              fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Logging in...' : 'Log in'}
          </button>
        </form>

        {error && <p style={{ color: '#f87171', marginTop: 12, fontSize: 13 }}>{error}</p>}

        <p style={{ marginTop: 20, fontSize: 13, color: '#4e7a9b' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#5ba3d9', textDecoration: 'none' }}>Register now</Link>
        </p>
        <p style={{ marginTop: 8, fontSize: 12 }}>
          <Link to="/forgot-password" style={{ color: '#3a6a8a', textDecoration: 'none' }}>Forgot username or password?</Link>
        </p>
      </div>
    </div>
  );
}


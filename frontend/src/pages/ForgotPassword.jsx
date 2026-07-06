import { useNavigate } from 'react-router-dom';

export default function ForgotPassword() {
  const navigate = useNavigate();

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
        <div onClick={() => navigate('/')} style={{ cursor: 'pointer', marginBottom: '1.5rem' }}>
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

        <h2 style={{ color: '#e8f1fa', fontSize: 18, fontWeight: 500, margin: '0 0 1rem' }}>
          Forgot credentials?
        </h2>

        <p style={{ color: '#6a90b0', fontSize: 14, lineHeight: 1.6, margin: '0 0 1.5rem' }}>
          Self-service recovery isn't available yet. Please reach out to a server admin to have your account looked up or your password reset.
        </p>

        <button
          onClick={() => navigate('/login')}
          style={{
            padding: '11px 0',
            width: '100%',
            background: '#2e6da4',
            border: 'none',
            borderRadius: 8,
            color: '#e8f1fa',
            fontSize: 15,
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Back to login
        </button>
      </div>
    </div>
  );
}
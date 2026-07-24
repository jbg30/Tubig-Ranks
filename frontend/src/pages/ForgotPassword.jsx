import { useNavigate } from 'react-router-dom';
import tubigLogo from '../assets/Tubig Logo.png';
import './Register.css';

export default function ForgotPassword() {
  const navigate = useNavigate();

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
          <p className="auth-sub">Forgot credentials?</p>

          <p style={{ color: 'var(--sub)', fontSize: 13, lineHeight: 1.6, margin: '0 0 1.4rem' }}>
            Self-service recovery isn't available yet. Please reach out to a server admin to have your account looked up or your password reset.
          </p>

          <button onClick={() => navigate('/login')} className="gbtn auth-submit" data-text="BACK TO LOGIN">
            <span className="btn-text">Back to login</span>
          </button>
        </div>
      </div>
    </div>
  );
}

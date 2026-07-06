import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import tubigLogo from '../assets/Tubig Logo.png';

const btnBase = {
  padding: '11px 32px',
  borderRadius: 50,
  fontSize: 15,
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease',
};

export default function Landing() {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), 30); return () => clearTimeout(t); }, []);

  return (
    <>
    <style>{`
      @keyframes fadeSlideDown { from { opacity: 0; transform: translateY(-12px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes fadeSlideUp   { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes fadePulse     { from { opacity: 0; } to { opacity: 1; } }
      .land-banner  { animation: fadeSlideDown 0.5s ease both; }
      .land-icon    { animation: fadeSlideUp 0.55s ease 0.1s both; }
      .land-title   { animation: fadeSlideUp 0.55s ease 0.2s both; }
      .land-sub     { animation: fadeSlideUp 0.5s ease 0.32s both; }
      .land-divider { animation: fadePulse   0.5s ease 0.42s both; }
      .land-btns    { animation: fadeSlideUp 0.5s ease 0.48s both; }
      .land-tags    { animation: fadePulse   0.5s ease 0.6s both; }
    `}</style>
    <div style={{
      width: '100vw',
      height: '100vh',
      background: '#0d1b2a',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'sans-serif',
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* Version banner */}
      <div className="land-banner" style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
      }}>
        <div style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '11px 48px',
          background: 'linear-gradient(180deg, #0ff5ff22 0%, #0ff5ff08 100%)',
          borderBottom: '1px solid #5dd5e8',
          width: '100%',
        }}>
          {/* Left angled accent */}
          <div style={{
            position: 'absolute', left: 0, top: 0, bottom: 0,
            width: 40,
            background: 'linear-gradient(90deg, #5dd5e800, #5dd5e822)',
            clipPath: 'polygon(0 0, 100% 0, 80% 100%, 0 100%)',
          }} />
          {/* Right angled accent */}
          <div style={{
            position: 'absolute', right: 0, top: 0, bottom: 0,
            width: 40,
            background: 'linear-gradient(270deg, #5dd5e800, #5dd5e822)',
            clipPath: 'polygon(20% 0, 100% 0, 100% 100%, 0 100%)',
          }} />
          <span style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 22,
            letterSpacing: 4,
            color: '#5dd5e8',
            textTransform: 'uppercase',
            textShadow: '0 0 12px #5dd5e8aa',
          }}>
            ◆ &nbsp; Version 0.1A &nbsp; ◆
          </span>
        </div>
      </div>

      {/* Subtle background grid */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(#1e4976 1px, transparent 1px), linear-gradient(90deg, #1e4976 1px, transparent 1px)',
        backgroundSize: '60px 60px',
        opacity: 0.06,
        pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
        <img
          src={tubigLogo}
          alt="Tubig Ranks"
          className="land-icon"
          style={{
            width: 'clamp(80px, 10vw, 130px)',
            height: 'clamp(80px, 10vw, 130px)',
            objectFit: 'contain',
            marginBottom: 'clamp(1rem, 2.5vh, 2rem)',
          }}
        />

        <h1 style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 'clamp(52px, 10vw, 110px)',
          fontWeight: 400,
          color: '#e8f1fa',
          letterSpacing: 'clamp(4px, 1vw, 12px)',
          margin: '0 0 clamp(0.3rem, 1vh, 0.6rem)',
          textAlign: 'center',
          lineHeight: 1,
        }}
          className="land-title"
        >
          Tubig Ranks
        </h1>

        <p style={{
          fontSize: 'clamp(11px, 1.2vw, 15px)',
          color: '#6a90b0',
          margin: '0 0 clamp(1.2rem, 3vh, 2.5rem)',
          textAlign: 'center',
          letterSpacing: '2px',
          textTransform: 'uppercase',
        }}
          className="land-sub"
        >
          Tubig's Official Ranked League
        </p>

        <div className="land-divider" style={{ width: 40, height: 2, background: '#2e6da4', borderRadius: 2, marginBottom: 'clamp(1.2rem, 3vh, 2.5rem)' }} />

        <div className="land-btns" style={{ display: 'flex', gap: 'clamp(8px, 1.5vw, 16px)' }}>
          <button
            onClick={() => navigate('/register')}
            style={{ ...btnBase, fontSize: 'clamp(13px, 1.2vw, 16px)', padding: 'clamp(9px, 1.2vh, 14px) clamp(22px, 3vw, 40px)', background: '#2e6da4', border: 'none', color: '#e8f1fa' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.07)';
              e.currentTarget.style.background = '#ffffff';
              e.currentTarget.style.color = '#0d1b2a';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(255,255,255,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.background = '#2e6da4';
              e.currentTarget.style.color = '#e8f1fa';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            Register now
          </button>
          <button
            onClick={() => navigate('/login')}
            style={{ ...btnBase, fontSize: 'clamp(13px, 1.2vw, 16px)', padding: 'clamp(9px, 1.2vh, 14px) clamp(22px, 3vw, 40px)', background: 'transparent', border: '1.5px solid #2e6da4', color: '#5ba3d9' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.07)';
              e.currentTarget.style.background = '#ffffff';
              e.currentTarget.style.color = '#0d1b2a';
              e.currentTarget.style.border = '1.5px solid #ffffff';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(255,255,255,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#5ba3d9';
              e.currentTarget.style.border = '1.5px solid #2e6da4';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            Login
          </button>
        </div>

        <div className="land-tags" style={{ display: 'flex', gap: 'clamp(1rem, 3vw, 3rem)', marginTop: 'clamp(1.5rem, 3vh, 3rem)' }}>
          {['Tournaments', 'Ranked Matchmaking', 'ELO Tracking'].map((label) => (
            <span key={label} style={{ fontSize: 'clamp(11px, 1vw, 14px)', color: '#4e7a9b', letterSpacing: 1 }}>
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
    </>
  );
}

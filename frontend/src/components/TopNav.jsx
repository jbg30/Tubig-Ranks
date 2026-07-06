import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import tubigLogo from '../assets/Tubig Logo.png';

export default function TopNav({ showHome = true }) {
  const [showMenu, setShowMenu] = useState(false);
  const { user, logoutUser } = useUser();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logoutUser();
    navigate('/');
  };

  return (
    <>
      <style>{`
        .topnav-menu-btn { background: none; border: none; cursor: pointer; color: #5ba3d9; padding: 6px 10px; font-size: 13px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; border-radius: 6px; transition: color 0.15s, background 0.15s; font-family: sans-serif; }
        .topnav-menu-btn:hover { color: #e8f1fa; background: #1a3a5c; }
        .topnav-menu-btn.danger { color: #f87171; }
        .topnav-menu-btn.danger:hover { color: #f87171; background: #2a0a14; }
        .topnav-side { width: 120px; }
        .topnav-brand-text { font-size: 22px; letter-spacing: 4px; color: #e8f1fa; font-family: 'Bebas Neue', sans-serif; white-space: nowrap; }
        @media (max-width: 768px) {
          .topnav-side { width: 56px; }
          .topnav-brand-text { font-size: 17px; letter-spacing: 2px; }
        }
      `}</style>

      <div style={{
        position: 'fixed',
        top: 0, left: 0, right: 0,
        height: 52,
        background: '#0a1828',
        borderBottom: '1px solid #1e4976',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 0',
        zIndex: 1100,
        boxShadow: '0 2px 16px rgba(0,0,0,0.5)',
      }}>

        {/* Left angled accent */}
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0, width: 80,
          background: 'linear-gradient(90deg, #1e497622, transparent)',
          pointerEvents: 'none',
        }} />
        {/* Right angled accent */}
        <div style={{
          position: 'absolute', right: 0, top: 0, bottom: 0, width: 80,
          background: 'linear-gradient(270deg, #1e497622, transparent)',
          pointerEvents: 'none',
        }} />

        {/* Left: home */}
        <div className="topnav-side" style={{ display: 'flex', justifyContent: 'flex-start', paddingLeft: 14, zIndex: 1 }}>
          {showHome && (
            <button
              onClick={() => navigate('/lobby')}
              title="Back to Lobby"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4e7a9b', fontSize: 13, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: 'sans-serif', padding: '4px 8px', borderRadius: 6, transition: 'color 0.15s' }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#e8f1fa'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#4e7a9b'}
            >
              Lobby
            </button>
          )}
        </div>

        {/* Center: brand */}
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: showHome ? 'pointer' : 'default', userSelect: 'none', zIndex: 1 }}
          onClick={() => showHome && navigate('/lobby')}
        >
          <img src={tubigLogo} alt="Tubig" style={{ width: 30, height: 30, objectFit: 'contain' }} />
          <span className="topnav-brand-text">
            Tubig Ranks
          </span>
        </div>

        {/* Right: hamburger */}
        <div className="topnav-side" style={{ display: 'flex', justifyContent: 'flex-end', paddingRight: 14, position: 'relative', zIndex: 1 }}>
          <button
            onClick={() => setShowMenu((v) => !v)}
            style={{ background: 'none', border: '1px solid #1e4976', borderRadius: 6, cursor: 'pointer', color: '#5ba3d9', padding: '4px 10px', fontSize: 18, lineHeight: 1, transition: 'border-color 0.15s, color 0.15s' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#2e6da4'; e.currentTarget.style.color = '#e8f1fa'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#1e4976'; e.currentTarget.style.color = '#5ba3d9'; }}
            aria-label="Menu"
          >
            ☰
          </button>

          {showMenu && (
            <>
              <div onClick={() => setShowMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 1099 }} />
              <div style={{
                position: 'absolute', top: 40, right: 0,
                background: '#0a1828',
                border: '1px solid #1e4976',
                borderRadius: 10,
                boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                minWidth: 160,
                zIndex: 1101,
                overflow: 'hidden',
                padding: '6px 0',
              }}>
                <button className="topnav-menu-btn" style={{ display: 'block', width: '100%', textAlign: 'left', padding: '9px 16px' }}
                  onClick={() => { navigate('/settings'); setShowMenu(false); }}>
                  Settings
                </button>
                {user?.isAdmin && (
                  <button className="topnav-menu-btn" style={{ display: 'block', width: '100%', textAlign: 'left', padding: '9px 16px' }}
                    onClick={() => { navigate('/admin'); setShowMenu(false); }}>
                    Admin Panel
                  </button>
                )}
                <div style={{ borderTop: '1px solid #1e4976', margin: '4px 0' }} />
                <button className="topnav-menu-btn danger" style={{ display: 'block', width: '100%', textAlign: 'left', padding: '9px 16px' }}
                  onClick={() => { handleLogout(); setShowMenu(false); }}>
                  Log out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

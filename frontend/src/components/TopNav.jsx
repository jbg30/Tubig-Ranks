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
        .topnav-menu-btn { background: none; border: none; cursor: pointer; color: var(--cyan); padding: 6px 10px; font-size: 12px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; transition: color 0.15s, background 0.15s; font-family: 'Fira Code', Consolas, monospace; }
        .topnav-menu-btn:hover { color: var(--bg); background: var(--cyan); }
        .topnav-menu-btn.danger { color: var(--danger); }
        .topnav-menu-btn.danger:hover { color: var(--bg); background: var(--danger); }
        .topnav-side { width: 120px; }
        .topnav-brand-text { font-size: 18px; letter-spacing: 4px; color: var(--text); font-family: 'Fira Code', Consolas, monospace; font-weight: 700; white-space: nowrap; text-transform: uppercase; }
        @media (max-width: 768px) {
          .topnav-side { width: 56px; }
          .topnav-brand-text { font-size: 14px; letter-spacing: 2px; }
        }
      `}</style>

      <div style={{
        position: 'fixed',
        top: 0, left: 0, right: 0,
        height: 52,
        background: 'var(--panel)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 0',
        zIndex: 1100,
        boxShadow: '0 2px 16px rgba(0,0,0,0.6)',
      }}>

        {/* Left angled accent */}
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0, width: 80,
          background: 'linear-gradient(90deg, rgba(0,242,234,0.08), transparent)',
          pointerEvents: 'none',
        }} />
        {/* Right angled accent */}
        <div style={{
          position: 'absolute', right: 0, top: 0, bottom: 0, width: 80,
          background: 'linear-gradient(270deg, rgba(168,85,247,0.06), transparent)',
          pointerEvents: 'none',
        }} />

        {/* Left: home */}
        <div className="topnav-side" style={{ display: 'flex', justifyContent: 'flex-start', paddingLeft: 14, zIndex: 1 }}>
          {showHome && (
            <button
              onClick={() => navigate('/lobby')}
              title="Back to Lobby"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--sub)', fontSize: 12, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: "'Fira Code', Consolas, monospace", padding: '4px 8px', transition: 'color 0.15s' }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--cyan)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--sub)'}
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
          <img src={tubigLogo} alt="Tubig" style={{ width: 28, height: 28, objectFit: 'contain', filter: 'drop-shadow(0 0 6px rgba(0,242,234,0.4))' }} />
          <span className="topnav-brand-text">
            Tubig Ranks
          </span>
        </div>

        {/* Right: hamburger */}
        <div className="topnav-side" style={{ display: 'flex', justifyContent: 'flex-end', paddingRight: 14, position: 'relative', zIndex: 1 }}>
          <button
            onClick={() => setShowMenu((v) => !v)}
            style={{ background: 'none', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--cyan)', padding: '4px 10px', fontSize: 18, lineHeight: 1, transition: 'border-color 0.15s, color 0.15s' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--border-strong)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
            aria-label="Menu"
          >
            ☰
          </button>

          {showMenu && (
            <>
              <div onClick={() => setShowMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 1099 }} />
              <div style={{
                position: 'absolute', top: 40, right: 0,
                background: 'var(--panel2)',
                border: '1px solid var(--border-strong)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.7)',
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
                <div style={{ borderTop: '1px solid var(--border)', margin: '4px 0' }} />
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

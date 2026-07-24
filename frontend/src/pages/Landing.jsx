import { useNavigate } from 'react-router-dom';
import './Landing.css';
import tubigLogo from '../assets/Tubig Logo.png';
import coalIcon from '../assets/Coal rank.png';
import bronzeIcon from '../assets/Bronze rank.png';
import silverIcon from '../assets/Silver rank.png';
import goldIcon from '../assets/Gold rank.png';
import amethystIcon from '../assets/Amethyst rank.png';
import emeraldIcon from '../assets/Emerald rank.png';
import rubyIcon from '../assets/Ruby rank.png';
import diamondIcon from '../assets/Diamond rank.png';

const TIERS = [
  { name: 'Coal', icon: coalIcon },
  { name: 'Bronze', icon: bronzeIcon },
  { name: 'Silver', icon: silverIcon },
  { name: 'Gold', icon: goldIcon },
  { name: 'Amethyst', icon: amethystIcon, cls: 'amethyst' },
  { name: 'Emerald', icon: emeraldIcon, cls: 'emerald' },
  { name: 'Ruby', icon: rubyIcon, cls: 'ruby' },
  { name: 'Diamond', icon: diamondIcon, cls: 'diamond' },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="gw">
      <nav className="gw-nav">
        <div className="gw-brand">
          <span className="glitch" data-text="TUBIGRANKS">TUBIGRANKS</span>
        </div>
        <div className="gw-nav-right">
          <button className="gw-link-plain" onClick={() => navigate('/login')}>Log in</button>
          <button className="gbtn small" data-text="SIGN UP" onClick={() => navigate('/register')}>
            <span className="btn-text">Sign up</span>
          </button>
        </div>
      </nav>

      <div className="gw-hero">
        <img src={tubigLogo} alt="Tubig Ranks" className="gw-hero-logo" />
        <div className="gw-eyebrow">Season 2 &middot; Now live</div>
        <h1>PROVE YOUR RANK.</h1>
        <p className="gw-hero-sub">Skill-based matchmaking, live leaderboards, and bracket tournaments.</p>
        <div className="gw-hero-btns">
          <button className="gbtn" data-text="VIEW LEADERBOARD" onClick={() => navigate('/login')}>
            <span className="btn-text">View leaderboard</span>
          </button>
        </div>
      </div>

      <div className="gw-stats">
        <div className="gw-stat">
          <div className="gw-stat-val glitch" data-text="1v1 / 2v2">1v1/2v2</div>
          <div className="gw-stat-label">Match modes</div>
        </div>
        <div className="gw-stat">
          <div className="gw-stat-val glitch" data-text="LIVE">LIVE</div>
          <div className="gw-stat-label">Elo updates</div>
        </div>
      </div>

      <div className="gw-section" id="ranks-section">
        <div className="gw-section-head">
          <div className="gw-section-eyebrow">Progression</div>
          <div className="gw-section-title">Climb eight tiers</div>
        </div>
        <div className="gw-ladder">
          {TIERS.map((tier) => (
            <div key={tier.name} className={`gw-tier ${tier.cls || ''}`}>
              <img src={tier.icon} alt={tier.name} className="gw-tier-icon" />
              <div className="gw-tier-name">{tier.name}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="gw-foot">
        <span>&copy; 2026 TUBIGRANKS</span>
        <span>BETA</span>
      </div>
    </div>
  );
}

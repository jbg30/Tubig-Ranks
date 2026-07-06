import { useNavigate } from 'react-router-dom';
import { RANKS } from '../utils/ranks';
import TopNav from '../components/TopNav';
import diamondIcon from '../assets/Diamond rank.png';
import rubyIcon from '../assets/Ruby rank.png';
import emeraldIcon from '../assets/Emerald rank.png';
import amethystIcon from '../assets/Amethyst rank.png';
import goldIcon from '../assets/Gold rank.png';
import silverIcon from '../assets/Silver rank.png';
import bronzeIcon from '../assets/Bronze rank.png';
import coalIcon from '../assets/Coal rank.png';


export default function Ranks() {
  const navigate = useNavigate();

  return (
    <>
      <TopNav />
      <div style={{
        minHeight: '100vh',
        background: '#0d1b2a',
        color: '#e8f1fa',
        fontFamily: 'sans-serif',
        paddingTop: 80,
        paddingBottom: 60,
      }}>
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 24px' }}>

          <h1 style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 42,
            letterSpacing: 4,
            color: '#e8f1fa',
            margin: '0 0 4px',
            textAlign: 'center',
          }}>
            Rank Tiers
          </h1>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[...RANKS].reverse().map((rank, i) => {
              const isTop = i === 0;
              return (
                <div key={rank.name} style={{
                  background: '#0f2236',
                  border: `1px solid ${isTop ? rank.color : '#1e4976'}`,
                  borderLeft: `4px solid ${rank.color}`,
                  borderRadius: 12,
                  padding: '12px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 20,
                  boxShadow: isTop ? `0 0 16px ${rank.color}33` : 'none',
                  transition: 'transform 0.15s',
                }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(4px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(0)'}
                >
                  {/* Badge */}
                  {rank.name === 'Diamond'
                    ? <img src={diamondIcon} alt="Diamond" style={{ width: 48, height: 48, objectFit: 'contain', flexShrink: 0, filter: 'drop-shadow(0 0 8px #5dd5e8) drop-shadow(0 0 16px #5dd5e8aa)' }} />
                    : rank.name === 'Ruby'
                    ? <img src={rubyIcon} alt="Ruby" style={{ width: 48, height: 48, objectFit: 'contain', flexShrink: 0, filter: 'drop-shadow(0 0 8px #af2323) drop-shadow(0 0 16px #af2323aa)' }} />
                    : rank.name === 'Emerald'
                    ? <img src={emeraldIcon} alt="Emerald" style={{ width: 48, height: 48, objectFit: 'contain', flexShrink: 0, filter: 'drop-shadow(0 0 8px #4dbf72) drop-shadow(0 0 16px #4dbf72aa)' }} />
                    : rank.name === 'Amethyst'
                    ? <img src={amethystIcon} alt="Amethyst" style={{ width: 48, height: 48, objectFit: 'contain', flexShrink: 0, filter: 'drop-shadow(0 0 8px #9966cc) drop-shadow(0 0 16px #9966ccaa)' }} />
                    : rank.name === 'Gold'
                    ? <img src={goldIcon} alt="Gold" style={{ width: 48, height: 48, objectFit: 'contain', flexShrink: 0 }} />
                    : rank.name === 'Silver'
                    ? <img src={silverIcon} alt="Silver" style={{ width: 48, height: 48, objectFit: 'contain', flexShrink: 0 }} />
                    : rank.name === 'Bronze'
                    ? <img src={bronzeIcon} alt="Bronze" style={{ width: 48, height: 48, objectFit: 'contain', flexShrink: 0 }} />
                    : rank.name === 'Coal'
                    ? <img src={coalIcon} alt="Coal" style={{ width: 48, height: 48, objectFit: 'contain', flexShrink: 0 }} />
                    : <div style={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        border: `2px solid ${rank.color}`,
                        background: `${rank.color}22`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        fontWeight: 900,
                        fontSize: 14,
                        color: rank.color,
                        letterSpacing: 1,
                      }}>
                        {rank.name.slice(0, 2).toUpperCase()}
                      </div>
                  }

                  {/* Info */}
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: 18,
                      fontWeight: 800,
                      color: rank.color,
                      letterSpacing: 2,
                      textTransform: 'uppercase',
                      marginBottom: 2,
                    }}>
                      {rank.name}
                    </div>

                  </div>

                  {/* ELO range */}
                  <div style={{
                    textAlign: 'right',
                    flexShrink: 0,
                  }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#e8f1fa' }}>
                      {rank.min.toLocaleString()}{rank.max === Infinity ? '+' : ` – ${rank.max.toLocaleString()}`}
                    </div>
                    <div style={{ fontSize: 11, color: '#4e7a9b', letterSpacing: 1, textTransform: 'uppercase' }}>
                      ELO
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </>
  );
}

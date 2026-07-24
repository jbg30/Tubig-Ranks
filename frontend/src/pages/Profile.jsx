import API from '../api.js';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { getRank } from '../utils/ranks';
import diamondIcon from '../assets/Diamond rank.png';
import rubyIcon from '../assets/Ruby rank.png';
import emeraldIcon from '../assets/Emerald rank.png';
import amethystIcon from '../assets/Amethyst rank.png';
import goldIcon from '../assets/Gold rank.png';
import silverIcon from '../assets/Silver rank.png';
import bronzeIcon from '../assets/Bronze rank.png';
import coalIcon from '../assets/Coal rank.png';

const getRankClass = (mmr) => {
  if (mmr < 1000) return 'coal';
  if (mmr < 1100) return 'bronze';
  if (mmr < 1200) return 'silver';
  if (mmr < 1300) return 'gold';
  if (mmr < 1400) return 'amethyst';
  if (mmr < 1500) return 'emerald';
  if (mmr < 1600) return 'ruby';
  return 'diamond';
};
import TopNav from '../components/TopNav';
import '../pages/Lobby.css';

export default function Profile() {
  const { userId } = useParams();
  const { user: currentUser } = useUser();
  const navigate = useNavigate();

  const [profileUser, setProfileUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchProfile(); }, [userId]);

  const fetchProfile = async () => {
    try {
      const [userRes, statsRes, historyRes] = await Promise.all([
        fetch(`${API}/api/users/${userId}`),
        fetch(`${API}/api/matches/stats/${userId}`),
        fetch(`${API}/api/matches/history/${userId}`),
      ]);
      setProfileUser(await userRes.json());
      setStats(await statsRes.json());
      setHistory(await historyRes.json());
      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--sub)', fontFamily: "'Fira Code', Consolas, monospace" }}>
      Loading...
    </div>
  );
  if (!profileUser) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--sub)', fontFamily: "'Fira Code', Consolas, monospace" }}>
      Player not found.
    </div>
  );

  const isOwnProfile = profileUser._id === currentUser._id;
  const rank = getRank(profileUser.mmr);
  const winRate = stats?.totalGames > 0 ? Math.round((stats.wins / stats.totalGames) * 100) : 0;

  return (
    <>
      <TopNav />
      <div style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        color: 'var(--text)',
        fontFamily: "'Fira Code', Consolas, monospace",
        paddingTop: 80,
        paddingBottom: 60,
      }}>
        <div style={{ maxWidth: 620, margin: '0 auto', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Player card */}
          <div style={{
            background: 'var(--panel)',
            border: '1px solid rgba(0,242,234,0.2)',
            boxShadow: '0 0 1.2rem rgba(0,242,234,0.06)',
            overflow: 'hidden',
          }}>
            <div style={{
              background: 'linear-gradient(45deg, rgba(0,242,234,0.08), rgba(13,13,13,0.8)), radial-gradient(circle, rgba(168,85,247,0.06) 0%, transparent 70%)',
              padding: '32px 24px 24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 6,
            }}>
              {getRankClass(profileUser.mmr) === 'diamond'
                ? <img src={diamondIcon} alt="Diamond" style={{ width: 88, height: 88, objectFit: 'contain', filter: 'drop-shadow(0 0 8px #5dd5e8) drop-shadow(0 0 20px #5dd5e8aa)' }} />
                : getRankClass(profileUser.mmr) === 'ruby'
                ? <img src={rubyIcon} alt="Ruby" style={{ width: 88, height: 88, objectFit: 'contain', filter: 'drop-shadow(0 0 8px #af2323) drop-shadow(0 0 20px #af2323aa)' }} />
                : getRankClass(profileUser.mmr) === 'emerald'
                ? <img src={emeraldIcon} alt="Emerald" style={{ width: 88, height: 88, objectFit: 'contain', filter: 'drop-shadow(0 0 8px #4dbf72) drop-shadow(0 0 20px #4dbf72aa)' }} />
                : getRankClass(profileUser.mmr) === 'amethyst'
                ? <img src={amethystIcon} alt="Amethyst" style={{ width: 88, height: 88, objectFit: 'contain', filter: 'drop-shadow(0 0 8px #9966cc) drop-shadow(0 0 20px #9966ccaa)' }} />
                : getRankClass(profileUser.mmr) === 'gold'
                ? <img src={goldIcon} alt="Gold" style={{ width: 88, height: 88, objectFit: 'contain' }} />
                : getRankClass(profileUser.mmr) === 'silver'
                ? <img src={silverIcon} alt="Silver" style={{ width: 88, height: 88, objectFit: 'contain' }} />
                : getRankClass(profileUser.mmr) === 'bronze'
                ? <img src={bronzeIcon} alt="Bronze" style={{ width: 88, height: 88, objectFit: 'contain' }} />
                : getRankClass(profileUser.mmr) === 'coal'
                ? <img src={coalIcon} alt="Coal" style={{ width: 88, height: 88, objectFit: 'contain' }} />
                : <div className={`pc-rank-badge ${getRankClass(profileUser.mmr)}`} style={{ width: 72, height: 72, fontSize: 18 }}>{rank.name.slice(0, 2).toUpperCase()}</div>
              }
              <div style={{ color: rank.color, fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginTop: 4 }}>
                {profileUser.isPlaced ? rank.name : 'Unranked'}
              </div>
              <div className="pc-username glitch" data-text={profileUser.username} style={{ fontSize: 28 }}>
                {profileUser.username}{isOwnProfile ? <span style={{ color: 'var(--sub)', fontSize: 14, fontWeight: 400, marginLeft: 8 }}>you</span> : ''}
              </div>
              <div className="pc-elo">
                {profileUser.isPlaced
                  ? `${profileUser.mmr.toLocaleString()} ELO`
                  : `Placement ${profileUser.placementGamesPlayed ?? 0} / 5`}
              </div>
            </div>

            {/* Stats row */}
            {stats && (
              <div style={{ display: 'flex', borderTop: '1px solid var(--border)' }}>
                {[
                  { label: 'Wins', value: stats.wins, color: 'var(--success)' },
                  { label: 'Losses', value: stats.losses, color: 'var(--danger)' },
                  { label: 'Win Rate', value: `${winRate}%`, color: winRate >= 50 ? 'var(--success)' : 'var(--danger)' },
                  { label: 'Games', value: stats.totalGames, color: 'var(--text)' },
                ].map((s) => (
                  <div key={s.label} style={{ flex: 1, padding: '14px 0', textAlign: 'center', borderRight: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: 11, color: 'var(--sub)', letterSpacing: 1, textTransform: 'uppercase', marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Match history */}
          <div style={{
            background: 'var(--panel)',
            border: '1px solid rgba(0,242,234,0.2)',
            boxShadow: '0 0 1.2rem rgba(0,242,234,0.06)',
            overflow: 'hidden',
          }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--sub)' }}>
              Recent Matches
            </div>
            {history.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--faint)', fontSize: 13 }}>No matches played yet.</div>
            ) : (
              history.map((match) => {
                const playerEntry = match.players.find((p) => p.userId?._id === userId);
                const won = playerEntry?.team === match.winningTeam;
                const completed = match.status === 'completed';
                const eloChange = playerEntry?.eloChange;
                const teamA = match.players.filter((p) => p.team === 'A').map((p) => p.userId?.username || '[deleted]');
                const teamB = match.players.filter((p) => p.team === 'B').map((p) => p.userId?.username || '[deleted]');

                return (
                  <div key={match._id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px 20px',
                    borderBottom: '1px solid var(--bg)',
                    gap: 14,
                  }}>
                    {/* Result pill */}
                    <div style={{
                      minWidth: 72,
                      textAlign: 'center',
                      fontWeight: 800,
                      fontSize: 12,
                      letterSpacing: 1,
                      textTransform: 'uppercase',
                      color: completed ? (won ? 'var(--success)' : 'var(--danger)') : 'var(--sub)',
                      flexShrink: 0,
                    }}>
                      {completed ? (won ? 'Win' : 'Loss') : match.status}
                    </div>

                    {/* Teams */}
                    <div style={{ flex: 1, fontSize: 13, color: 'var(--text)' }}>
                      {teamA.join(' & ')} <span style={{ color: 'var(--faint)' }}>vs</span> {teamB.join(' & ')}
                    </div>

                    {/* Mode + date */}
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 12, color: 'var(--sub)', textTransform: 'uppercase', letterSpacing: 1 }}>{match.mode}</div>
                      <div style={{ fontSize: 11, color: 'var(--faint)', marginTop: 2 }}>{new Date(match.createdAt).toLocaleDateString()}</div>
                    </div>

                    {/* ELO change */}
                    {eloChange !== null && eloChange !== undefined && (
                      <div style={{
                        width: 52,
                        textAlign: 'right',
                        fontWeight: 700,
                        fontSize: 13,
                        color: eloChange >= 0 ? 'var(--success)' : 'var(--danger)',
                        flexShrink: 0,
                      }}>
                        {eloChange >= 0 ? '+' : ''}{eloChange}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

        </div>
      </div>
    </>
  );
}

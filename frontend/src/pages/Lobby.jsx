import API, { authFetch } from '../api.js';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { getRank, RANK_ORDER } from '../utils/ranks';
import TopNav from '../components/TopNav';
import './Lobby.css';
import diamondIcon from '../assets/Diamond rank.png';
import rubyIcon from '../assets/Ruby rank.png';
import emeraldIcon from '../assets/Emerald rank.png';
import amethystIcon from '../assets/Amethyst rank.png';
import goldIcon from '../assets/Gold rank.png';
import silverIcon from '../assets/Silver rank.png';
import bronzeIcon from '../assets/Bronze rank.png';
import coalIcon from '../assets/Coal rank.png';

export default function Lobby() {
  const { user, logoutUser, refreshUser } = useUser();
  const navigate = useNavigate();
  const [mode, setMode] = useState('1v1');
  const [allUsers, setAllUsers] = useState([]);
  const [onlineUserIds, setOnlineUserIds] = useState([]);
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [friendUsername, setFriendUsername] = useState('');
  const [friendError, setFriendError] = useState('');
  const [party, setParty] = useState(null);
  const [partyError, setPartyError] = useState('');
  const [partyMatchCheck, setPartyMatchCheck] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [tournament, setTournament] = useState(null);
  const [showHostForm, setShowHostForm] = useState(false);
  const [pendingOpen, setPendingOpen] = useState(false);
  const [showAllPlayers, setShowAllPlayers] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [activeTab, setActiveTab] = useState('main');
  const [hostName, setHostName] = useState('');
  const [hostFormat, setHostFormat] = useState('single-elimination');
  const [hostSeeding, setHostSeeding] = useState('shuffled');
  const [hostError, setHostError] = useState('');

  const leaderboard = [...allUsers].sort((a, b) => b.mmr - a.mmr).slice(0, 10);

  useEffect(() => {
    refreshUser();
    fetchUsers();
    fetchOnlineUsers();
    fetchFriends();
    fetchPendingRequests();
    fetchParty();
    fetchTournament();

    const interval = setInterval(() => {
      fetchUsers();
      fetchOnlineUsers();
      fetchFriends();
      fetchPendingRequests();
      fetchParty();
      fetchTournament();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
  if (!party || party.status !== 'active' || party.leader._id === user._id) return;

  const interval = setInterval(async () => {
    try {
      const res = await fetch(`${API}/api/matches`);
      const matches = await res.json();
      const myMatch = matches.find((m) =>
        m.status === 'active' && m.players.some((p) => (p.userId?._id || p.userId) === user._id)
      );
      if (myMatch) {
        clearInterval(interval);
        navigate(`/match/${myMatch._id}`);
      }
    } catch (err) {
      // ignore
    }
  }, 1000);

  return () => clearInterval(interval);
}, [party]);

  useEffect(() => {
    if (!contextMenu) return;
    const handleClickOutside = () => closeContextMenu();
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [contextMenu]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await authFetch(`${API}/api/users`);
      const data = await res.json();
      if (res.ok) setAllUsers(data);
    } catch (err) {
      // ignore transient errors
    }
  };

  const fetchOnlineUsers = async () => {
    try {
      const res = await fetch(`${API}/api/online-users`);
      const data = await res.json();
      if (res.ok) setOnlineUserIds(data.onlineUserIds);
    } catch (err) {
      // ignore transient errors
    }
  };

  const fetchFriends = async () => {
    try {
      const res = await fetch(`${API}/api/friends/${user._id}`);
      const data = await res.json();
      if (res.ok) setFriends(data);
    } catch (err) {
      // ignore
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const res = await fetch(`${API}/api/friends/${user._id}/pending`);
      const data = await res.json();
      if (res.ok) setPendingRequests(data);
    } catch (err) {
      // ignore
    }
  };

  const fetchParty = async () => {
    try {
      const res = await fetch(`${API}/api/party/${user._id}`);
      const data = await res.json();
      if (res.ok) setParty(data);
    } catch (err) {
      // ignore
    }
  };

  const handleSendFriendRequest = async () => {
    setFriendError('');
    try {
      const res = await authFetch(`${API}/api/friends/request`, {
        method: 'POST',
        body: JSON.stringify({ requesterId: user._id, recipientUsername: friendUsername }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFriendError(data.error);
        return;
      }
      setFriendUsername('');
    } catch (err) {
      setFriendError('Could not reach the server');
    }
  };

  const handleRespondToRequest = async (friendshipId, accept) => {
    try {
      await authFetch(`${API}/api/friends/respond`, {
        method: 'POST',
        body: JSON.stringify({ friendshipId, accept }),
      });
      fetchPendingRequests();
      fetchFriends();
    } catch (err) {
      // ignore
    }
  };

  const handleRemoveFriend = async (friendId) => {
    try {
      await authFetch(`${API}/api/friends/remove`, {
        method: 'POST',
        body: JSON.stringify({ userId: user._id, friendId }),
      });
      fetchFriends();
    } catch (err) {
      // ignore
    }
  };

  const handleInviteToParty = async (friendId) => {
    setPartyError('');
    try {
      const res = await authFetch(`${API}/api/party/invite`, {
        method: 'POST',
        body: JSON.stringify({ leaderId: user._id, friendId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPartyError(data.error);
        return;
      }
      fetchParty();
    } catch (err) {
      setPartyError('Could not reach the server');
    }
  };

  const handleRespondToParty = async (accept) => {
    try {
      await authFetch(`${API}/api/party/respond`, {
        method: 'POST',
        body: JSON.stringify({ partyId: party._id, userId: user._id, accept }),
      });
      fetchParty();
    } catch (err) {
      // ignore
    }
  };

  const handleLeaveParty = async () => {
    try {
      await authFetch(`${API}/api/party/leave`, {
        method: 'POST',
        body: JSON.stringify({ userId: user._id }),
      });
      setParty(null);
    } catch (err) {
      // ignore
    }
  };

  const handleChallengePartyMember = async () => {
  const opponent = party.members.find((m) => m._id !== user._id);
  if (!opponent) return;

  try {
    const res = await authFetch(`${API}/api/matches/challenge`, {
      method: 'POST',
      body: JSON.stringify({ challengerId: user._id, opponentId: opponent._id }),
    });
    const data = await res.json();

    if (!res.ok) {
      setPartyError(data.error);
      return;
    }

    navigate(`/match/${data._id}`);
  } catch (err) {
    setPartyError('Could not reach the server');
    }
  };

  const fetchTournament = async () => {
    try {
      const res = await fetch(`${API}/api/tournament/current`);
      const data = await res.json();
      if (res.ok) setTournament(data);
    } catch (err) {
      // ignore
    }
  };

  const handleCreateTournament = async () => {
    setHostError('');
    try {
      const res = await authFetch(`${API}/api/tournament/create`, {
        method: 'POST',
        body: JSON.stringify({ adminId: user._id, name: hostName, format: hostFormat, seeding: hostSeeding }),
      });
      const data = await res.json();
      if (!res.ok) {
        setHostError(data.error);
        return;
      }
      setShowHostForm(false);
      setHostName('');
      navigate('/tournament');
    } catch (err) {
      setHostError('Could not reach the server');
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    navigate('/');
  };

  const handleRightClick = (e, userId, isFriend = false) => {
    e.preventDefault();
    setContextMenu({ userId, x: e.clientX, y: e.clientY, isFriend });
  };

  const closeContextMenu = () => setContextMenu(null);

  const formatStatus = (status) => {
  return status
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

  const getStatusColor = (status) => {
  if (status === 'idle') return 'green';
  if (status === 'in-party') return 'cyan';
  if (status === 'queued') return 'orange';
  if (status === 'in-game') return 'red';
  return 'gray';
};

  const formatTournamentFormat = (format) => {
    if (format === 'single-elimination') return 'Single Elimination';
    if (format === 'double-elimination') return 'Double Elimination';
    if (format === 'round-robin') return 'Round Robin';
    return format;
  };

  const formatTournamentStatus = (status) => {
    if (status === 'registration') return 'Registration Open';
    if (status === 'active') return 'In Progress';
    if (status === 'completed') return 'Completed';
    return status;
  };

  const getInitials = (name) => name.slice(0, 2).toUpperCase();

  const getRankClass = (mmr) => getRank(mmr).name.toLowerCase();

  return (
    <div className="lobby-page" style={{ position: 'relative' }}>
      <TopNav showHome={false} />

    <div style={{ display: 'flex', width: '100%', marginTop: 48, position: 'relative' }}>

      <div className="lb-panel">
        <div className="lb-title">Leaderboard</div>
        {leaderboard.map((u, i) => {
          const rankNum = i + 1;
          const rankClass = rankNum === 1 ? 'gold' : rankNum === 2 ? 'silver' : rankNum === 3 ? 'bronze' : '';
          const avatarClass = rankNum === 1 ? 'top1' : rankNum === 2 ? 'top2' : rankNum === 3 ? 'top3' : '';
          return (
            <div key={u._id}>
              {rankNum === 4 && <div className="lb-divider" />}
              <div className="lb-row" onContextMenu={(e) => handleRightClick(e, u._id)}>
                <span className={`lb-rank ${rankClass}`}>{rankNum}</span>
                {getRankClass(u.mmr) === 'diamond'
                  ? <img src={diamondIcon} alt="Diamond" style={{ width: 42, height: 42, objectFit: 'contain', flexShrink: 0, filter: 'drop-shadow(0 0 6px #5dd5e8) drop-shadow(0 0 12px #5dd5e8aa)' }} />
                  : getRankClass(u.mmr) === 'ruby'
                  ? <img src={rubyIcon} alt="Ruby" style={{ width: 42, height: 42, objectFit: 'contain', flexShrink: 0, filter: 'drop-shadow(0 0 6px #af2323) drop-shadow(0 0 12px #af2323aa)' }} />
                  : getRankClass(u.mmr) === 'emerald'
                  ? <img src={emeraldIcon} alt="Emerald" style={{ width: 42, height: 42, objectFit: 'contain', flexShrink: 0, filter: 'drop-shadow(0 0 6px #4dbf72) drop-shadow(0 0 12px #4dbf72aa)' }} />
                  : getRankClass(u.mmr) === 'amethyst'
                  ? <img src={amethystIcon} alt="Amethyst" style={{ width: 42, height: 42, objectFit: 'contain', flexShrink: 0, filter: 'drop-shadow(0 0 6px #9966cc) drop-shadow(0 0 12px #9966ccaa)' }} />
                  : getRankClass(u.mmr) === 'gold'
                  ? <img src={goldIcon} alt="Gold" style={{ width: 42, height: 42, objectFit: 'contain', flexShrink: 0 }} />
                  : getRankClass(u.mmr) === 'silver'
                  ? <img src={silverIcon} alt="Silver" style={{ width: 42, height: 42, objectFit: 'contain', flexShrink: 0 }} />
                  : getRankClass(u.mmr) === 'bronze'
                  ? <img src={bronzeIcon} alt="Bronze" style={{ width: 42, height: 42, objectFit: 'contain', flexShrink: 0 }} />
                  : getRankClass(u.mmr) === 'coal'
                  ? <img src={coalIcon} alt="Coal" style={{ width: 42, height: 42, objectFit: 'contain', flexShrink: 0 }} />
                  : <div className={`lb-avatar ${avatarClass}`} title={getRank(u.mmr).name} />
                }
                <div className="lb-info">
                  <div className="lb-name glitch" data-text={u.username} style={{ fontWeight: u._id === user._id ? 700 : 500 }}>{u.username}</div>
                  <div className="lb-mmr">{u.mmr.toLocaleString()} ELO</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button className="lb-ranks-btn" onClick={() => navigate('/ranks')}>View Ranks</button>

      <div className="lobby-main">

        {/* Mobile: Leaderboard tab */}
        {isMobile && activeTab === 'leaderboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div className="lb-title">Leaderboard</div>
            {leaderboard.map((u, i) => {
              const rankNum = i + 1;
              const rankClass = rankNum === 1 ? 'gold' : rankNum === 2 ? 'silver' : rankNum === 3 ? 'bronze' : '';
              return (
                <div key={u._id}>
                  {rankNum === 4 && <div className="lb-divider" />}
                  <div className="lb-row" onClick={() => navigate(`/profile/${u._id}`)}>
                    <span className={`lb-rank ${rankClass}`}>{rankNum}</span>
                    {getRankClass(u.mmr) === 'diamond' ? <img src={diamondIcon} alt="Diamond" style={{ width: 36, height: 36, objectFit: 'contain', flexShrink: 0, filter: 'drop-shadow(0 0 6px #5dd5e8)' }} />
                    : getRankClass(u.mmr) === 'ruby' ? <img src={rubyIcon} alt="Ruby" style={{ width: 36, height: 36, objectFit: 'contain', flexShrink: 0, filter: 'drop-shadow(0 0 6px #af2323)' }} />
                    : getRankClass(u.mmr) === 'emerald' ? <img src={emeraldIcon} alt="Emerald" style={{ width: 36, height: 36, objectFit: 'contain', flexShrink: 0, filter: 'drop-shadow(0 0 6px #4dbf72)' }} />
                    : getRankClass(u.mmr) === 'amethyst' ? <img src={amethystIcon} alt="Amethyst" style={{ width: 36, height: 36, objectFit: 'contain', flexShrink: 0, filter: 'drop-shadow(0 0 6px #9966cc)' }} />
                    : getRankClass(u.mmr) === 'gold' ? <img src={goldIcon} alt="Gold" style={{ width: 36, height: 36, objectFit: 'contain', flexShrink: 0 }} />
                    : getRankClass(u.mmr) === 'silver' ? <img src={silverIcon} alt="Silver" style={{ width: 36, height: 36, objectFit: 'contain', flexShrink: 0 }} />
                    : getRankClass(u.mmr) === 'bronze' ? <img src={bronzeIcon} alt="Bronze" style={{ width: 36, height: 36, objectFit: 'contain', flexShrink: 0 }} />
                    : <img src={coalIcon} alt="Coal" style={{ width: 36, height: 36, objectFit: 'contain', flexShrink: 0 }} />}
                    <div className="lb-info">
                      <div className="lb-name" style={{ fontWeight: u._id === user._id ? 700 : 500 }}>{u.username}</div>
                      <div className="lb-mmr">{u.mmr.toLocaleString()} ELO</div>
                    </div>
                  </div>
                </div>
              );
            })}
            <button onClick={() => navigate('/ranks')} style={{ marginTop: 8, width: '100%', padding: '10px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--cyan)', fontSize: 12, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', cursor: 'pointer' }}>View Ranks</button>
          </div>
        )}

        {/* Mobile: Friends tab */}
        {isMobile && activeTab === 'friends' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {user.isAdmin ? (
              <div className="fr-tabs">
                <button className={`fr-tab ${!showAllPlayers ? 'active' : ''}`} onClick={() => setShowAllPlayers(false)}>Friends</button>
                <button className={`fr-tab ${showAllPlayers ? 'active' : ''}`} onClick={() => setShowAllPlayers(true)}>Players</button>
              </div>
            ) : (
              <div className="fr-title">Friends</div>
            )}
            {pendingRequests.length > 0 && (
              <div style={{ background: 'var(--panel2)', border: '1px solid var(--border-strong)', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--cyan)', marginBottom: 8, letterSpacing: 1, textTransform: 'uppercase' }}>Pending ({pendingRequests.length})</div>
                {pendingRequests.map((req) => (
                  <div key={req._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0' }}>
                    <span style={{ fontSize: 13, color: 'var(--text)' }}>{req.requester.username}</span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn-accept" onClick={() => handleRespondToRequest(req._id, true)}>Accept</button>
                      <button className="btn-decline" onClick={() => handleRespondToRequest(req._id, false)}>Decline</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {!showAllPlayers && (
              <>
                <div className="fr-add-card">
                  <div className="fr-add-header">
                    <div className="fr-add-title">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <line x1="19" y1="8" x2="19" y2="14" />
                        <line x1="16" y1="11" x2="22" y2="11" />
                      </svg>
                      Add friend
                    </div>
                    <div className="fr-add-dots"><span /><span /><span /></div>
                  </div>
                  <div className="fr-add-body">
                    <div className="fr-add-group">
                      <input
                        type="text"
                        placeholder=" "
                        aria-label="Username"
                        value={friendUsername}
                        onChange={(e) => setFriendUsername(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendFriendRequest()}
                        className="fr-add-input"
                      />
                      <label className="fr-add-label" data-text="USERNAME">Username</label>
                    </div>
                    <button onClick={handleSendFriendRequest} className="fr-add-submit" data-text="ADD">
                      <span className="btn-text">Add</span>
                    </button>
                  </div>
                </div>
                {friendError && <p className="fr-error">{friendError}</p>}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {friends.map((friend) => {
                    const isOnline = onlineUserIds.includes(friend._id);
                    const dotClass = !isOnline ? 'offline' : friend.status === 'in-game' ? 'ingame' : friend.status === 'queued' ? 'queued' : friend.status === 'in-party' ? 'inparty' : 'online';
                    const statusLabel = !isOnline ? 'Offline' : friend.status === 'in-game' ? 'In game' : friend.status === 'queued' ? 'In queue' : friend.status === 'in-party' ? 'In party' : 'Idle';
                    return (
                      <div key={friend._id} className="fr-card" onClick={() => navigate(`/profile/${friend._id}`)}>
                        <div className={`fr-dot ${dotClass}`} />
                        <div className="fr-info">
                          <div className="fr-name">{friend.username}</div>
                          <div className="fr-status">{statusLabel}</div>
                        </div>
                      </div>
                    );
                  })}
                  {friends.length === 0 && <p className="fr-empty">No friends yet</p>}
                </div>
              </>
            )}
            {showAllPlayers && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {allUsers.map((u) => {
                  const isOnline = onlineUserIds.includes(u._id);
                  const dotClass = !isOnline ? 'offline' : u.status === 'in-game' ? 'ingame' : u.status === 'queued' ? 'queued' : u.status === 'in-party' ? 'inparty' : 'online';
                  const statusLabel = !isOnline ? 'Offline' : u.status === 'in-game' ? 'In game' : u.status === 'queued' ? 'In queue' : u.status === 'in-party' ? 'In party' : 'Idle';
                  return (
                    <div key={u._id} className="fr-card" onClick={() => navigate(`/profile/${u._id}`)}>
                      <div className={`fr-dot ${dotClass}`} />
                      <div className="fr-info">
                        <div className="fr-name">{u.username}</div>
                        <div className="fr-status">{statusLabel}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Main tab content */}
        {(!isMobile || activeTab === 'main') && <>

        {/* Pending party notifications */}
        {party && party.status === 'pending' && party.invitedFriendId?._id === user._id && (
          <div className="lm-card" style={{ marginBottom: 16 }}>
            <p className="lm-card-title">{party.leader.username} invited you to a party</p>
            <div className="lm-card-btns">
              <button className="btn-accept" onClick={() => handleRespondToParty(true)}>Accept</button>
              <button className="btn-decline" onClick={() => handleRespondToParty(false)}>Decline</button>
            </div>
          </div>
        )}
        {party && party.status === 'pending' && party.leader._id === user._id && (
          <div className="lm-card" style={{ marginBottom: 16 }}>
            <p className="lm-card-title">Waiting for {party.invitedFriendId?.username} to accept...</p>
            <button className="btn-decline" onClick={handleLeaveParty}>Cancel</button>
          </div>
        )}
        {partyError && <p style={{ color: 'var(--danger)', fontSize: 12, textAlign: 'center', marginBottom: 8 }}>{partyError}</p>}

        {/* Player card(s) */}
        {(() => {
          const partyMember = party?.status === 'active'
            ? party.members.find((m) => m._id !== user._id)
            : null;
          const partyMemberFull = partyMember
            ? allUsers.find((u) => u._id === partyMember._id) || partyMember
            : null;

          const renderTournamentSection = () => (
            <div className="pc-section">
              <div className="pc-section-label">Tournament</div>
              {tournament && tournament.status !== 'completed' ? (
                <>
                  <p className="pc-tournament-name">{tournament.name}</p>
                  <p className="pc-tournament-sub">{formatTournamentFormat(tournament.format)} â€” {formatTournamentStatus(tournament.status)}</p>
                  {tournament.status === 'registration' && (
                    <p className="pc-tournament-sub">{tournament.participants.length} player(s) joined</p>
                  )}
                  <button className="pc-tournament-btn" onClick={() => navigate('/tournament')}>
                    {tournament.status === 'registration' ? 'Enter Tournament' : 'View Tournament'}
                    <span>â€º</span>
                  </button>
                </>
              ) : tournament && tournament.status === 'completed' && !user.isAdmin ? (
                <button className="pc-tournament-btn" onClick={() => navigate('/tournaments')}>View Tournaments <span>â€º</span></button>
              ) : user.isAdmin ? (
                !showHostForm ? (
                  <>
                    {tournament && tournament.status === 'completed' && (
                      <button className="pc-tournament-btn" onClick={() => navigate('/tournaments')} style={{ marginBottom: 6 }}>View Tournaments <span>â€º</span></button>
                    )}
                    <button className="pc-tournament-btn" onClick={() => setShowHostForm(true)}>Host Tournament <span>â€º</span></button>
                  </>
                ) : (
                  <>
                    <input className="lm-input" type="text" placeholder="Tournament name" value={hostName} onChange={(e) => setHostName(e.target.value)} />
                    <select className="lm-input" value={hostFormat} onChange={(e) => setHostFormat(e.target.value)}>
                      <option value="single-elimination">Single Elimination</option>
                      <option value="double-elimination">Double Elimination</option>
                      <option value="round-robin">Round Robin</option>
                    </select>
                    <select className="lm-input" value={hostSeeding} onChange={(e) => setHostSeeding(e.target.value)}>
                      <option value="shuffled">Shuffled (Random)</option>
                      <option value="seeded">Seeded (by ELO)</option>
                    </select>
                    <button className="pc-tournament-btn" onClick={handleCreateTournament} disabled={!hostName.trim()}>Create Tournament <span>â€º</span></button>
                    <button className="lm-btn-ghost" style={{ marginTop: 4 }} onClick={() => { setShowHostForm(false); setHostError(''); }}>Cancel</button>
                    {hostError && <p style={{ color: 'var(--danger)', fontSize: 12, marginTop: 4 }}>{hostError}</p>}
                  </>
                )
              ) : (
                <p className="pc-tournament-sub">No tournament in progress.</p>
              )}
            </div>
          );


          return (
            <>
            {/* Tournament bar centered at top */}
            <div className="pc-tourn-bar-top">
              {tournament && tournament.status !== 'completed' ? (
                <button className="pc-tourn-tab active" onClick={() => navigate('/tournament')}>
                  {tournament.status === 'registration' ? 'Enter Tournament' : 'View Tournament'}
                </button>
              ) : tournament && tournament.status === 'completed' && !user.isAdmin ? (
                <button className="pc-tourn-tab" onClick={() => navigate('/tournaments')}>View Tournaments</button>
              ) : user.isAdmin ? (
                !showHostForm ? (
                  <>
                    {tournament && tournament.status === 'completed' && (
                      <button className="pc-tourn-tab" onClick={() => navigate('/tournaments')}>View Tournaments</button>
                    )}
                    <button className="pc-tourn-tab active" onClick={() => setShowHostForm(true)}>Host Tournament</button>
                  </>
                ) : (
                  <>
                    <input className="lm-input" type="text" placeholder="Tournament name" value={hostName} onChange={(e) => setHostName(e.target.value)} style={{ marginBottom: 4 }} />
                    <select className="lm-input" value={hostFormat} onChange={(e) => setHostFormat(e.target.value)} style={{ marginBottom: 4 }}>
                      <option value="single-elimination">Single Elimination</option>
                      <option value="double-elimination">Double Elimination</option>
                      <option value="round-robin">Round Robin</option>
                    </select>
                    <select className="lm-input" value={hostSeeding} onChange={(e) => setHostSeeding(e.target.value)} style={{ marginBottom: 4 }}>
                      <option value="shuffled">Shuffled (Random)</option>
                      <option value="seeded">Seeded (by ELO)</option>
                    </select>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="pc-tourn-tab active" onClick={handleCreateTournament} disabled={!hostName.trim()}>Create</button>
                      <button className="pc-tourn-tab" onClick={() => { setShowHostForm(false); setHostError(''); }}>Cancel</button>
                    </div>
                    {hostError && <p style={{ color: 'var(--danger)', fontSize: 11, margin: '4px 0 0' }}>{hostError}</p>}
                  </>
                )
              ) : null}
            </div>

            <div className="pc-area">
              {/* My card */}
              <div className="pc-stack">
                <div className="player-card">
                  <div className="pc-top" onClick={() => navigate(`/profile/${user._id}`)} style={{ cursor: 'pointer' }}>
                    {getRankClass(user.mmr) === 'diamond'
                      ? <img src={diamondIcon} alt="Diamond" style={{ width: 72, height: 72, objectFit: 'contain', filter: 'drop-shadow(0 0 8px #5dd5e8) drop-shadow(0 0 20px #5dd5e8aa)', marginTop: -12, marginBottom: 4 }} />
                      : getRankClass(user.mmr) === 'ruby'
                      ? <img src={rubyIcon} alt="Ruby" style={{ width: 72, height: 72, objectFit: 'contain', filter: 'drop-shadow(0 0 8px #af2323) drop-shadow(0 0 20px #af2323aa)', marginTop: -12, marginBottom: 4 }} />
                      : getRankClass(user.mmr) === 'emerald'
                      ? <img src={emeraldIcon} alt="Emerald" style={{ width: 72, height: 72, objectFit: 'contain', filter: 'drop-shadow(0 0 8px #4dbf72) drop-shadow(0 0 20px #4dbf72aa)', marginTop: -12, marginBottom: 4 }} />
                      : getRankClass(user.mmr) === 'amethyst'
                      ? <img src={amethystIcon} alt="Amethyst" style={{ width: 72, height: 72, objectFit: 'contain', filter: 'drop-shadow(0 0 8px #9966cc) drop-shadow(0 0 20px #9966ccaa)', marginTop: -12, marginBottom: 4 }} />
                      : getRankClass(user.mmr) === 'gold'
                      ? <img src={goldIcon} alt="Gold" style={{ width: 72, height: 72, objectFit: 'contain', marginTop: -12, marginBottom: 4 }} />
                      : getRankClass(user.mmr) === 'silver'
                      ? <img src={silverIcon} alt="Silver" style={{ width: 72, height: 72, objectFit: 'contain', marginTop: -12, marginBottom: 4 }} />
                      : getRankClass(user.mmr) === 'bronze'
                      ? <img src={bronzeIcon} alt="Bronze" style={{ width: 72, height: 72, objectFit: 'contain', marginTop: -12, marginBottom: 4 }} />
                      : getRankClass(user.mmr) === 'coal'
                      ? <img src={coalIcon} alt="Coal" style={{ width: 72, height: 72, objectFit: 'contain', marginTop: -12, marginBottom: 4 }} />
                      : <div className={`pc-rank-badge ${getRankClass(user.mmr)}`}>{getRank(user.mmr).name.slice(0, 2).toUpperCase()}</div>
                    }
                    <div className="pc-rank-label" style={{ color: getRank(user.mmr).color }}>
                      {user.isPlaced ? getRank(user.mmr).name : 'Unranked'}
                    </div>
                    <div className="pc-username glitch" data-text={user.username}>{user.username}</div>
                    <div className="pc-elo">
                      {user.isPlaced ? `${user.mmr.toLocaleString()} ELO` : `Placement (${user.placementGamesPlayed ?? 0}/5)`}
                    </div>
                    {user.lastMatchEloChange !== null && user.lastMatchEloChange !== undefined && (
                      <div className="pc-elo-change" style={{ color: user.lastMatchEloChange >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                        Last match: {user.lastMatchEloChange >= 0 ? '+' : ''}{user.lastMatchEloChange} ELO
                      </div>
                    )}
                    {user.lastRankChange?.from && user.lastRankChange?.to && (
                      <div className="pc-rank-change" style={{ color: getRank(user.mmr).color }}>
                        {RANK_ORDER.indexOf(user.lastRankChange.to) > RANK_ORDER.indexOf(user.lastRankChange.from)
                          ? `Promoted to ${user.lastRankChange.to}!`
                          : `Demoted to ${user.lastRankChange.to}`}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Party member card */}
              {partyMemberFull && (
                <div className="pc-stack">
                  <div className="player-card">
                    <div className="pc-top" onClick={() => navigate(`/profile/${partyMemberFull._id}`)} style={{ cursor: 'pointer' }}>
                      {getRankClass(partyMemberFull.mmr ?? 1000) === 'diamond'
                        ? <img src={diamondIcon} alt="Diamond" style={{ width: 72, height: 72, objectFit: 'contain', filter: 'drop-shadow(0 0 8px #5dd5e8) drop-shadow(0 0 20px #5dd5e8aa)', marginTop: -12, marginBottom: 4 }} />
                        : getRankClass(partyMemberFull.mmr ?? 1000) === 'ruby'
                        ? <img src={rubyIcon} alt="Ruby" style={{ width: 72, height: 72, objectFit: 'contain', filter: 'drop-shadow(0 0 8px #af2323) drop-shadow(0 0 20px #af2323aa)', marginTop: -12, marginBottom: 4 }} />
                        : getRankClass(partyMemberFull.mmr ?? 1000) === 'emerald'
                        ? <img src={emeraldIcon} alt="Emerald" style={{ width: 72, height: 72, objectFit: 'contain', filter: 'drop-shadow(0 0 8px #4dbf72) drop-shadow(0 0 20px #4dbf72aa)', marginTop: -12, marginBottom: 4 }} />
                        : getRankClass(partyMemberFull.mmr ?? 1000) === 'amethyst'
                        ? <img src={amethystIcon} alt="Amethyst" style={{ width: 72, height: 72, objectFit: 'contain', filter: 'drop-shadow(0 0 8px #9966cc) drop-shadow(0 0 20px #9966ccaa)', marginTop: -12, marginBottom: 4 }} />
                        : getRankClass(partyMemberFull.mmr ?? 1000) === 'gold'
                        ? <img src={goldIcon} alt="Gold" style={{ width: 72, height: 72, objectFit: 'contain', marginTop: -12, marginBottom: 4 }} />
                        : getRankClass(partyMemberFull.mmr ?? 1000) === 'silver'
                        ? <img src={silverIcon} alt="Silver" style={{ width: 72, height: 72, objectFit: 'contain', marginTop: -12, marginBottom: 4 }} />
                        : getRankClass(partyMemberFull.mmr ?? 1000) === 'bronze'
                        ? <img src={bronzeIcon} alt="Bronze" style={{ width: 72, height: 72, objectFit: 'contain', marginTop: -12, marginBottom: 4 }} />
                        : getRankClass(partyMemberFull.mmr ?? 1000) === 'coal'
                        ? <img src={coalIcon} alt="Coal" style={{ width: 72, height: 72, objectFit: 'contain', marginTop: -12, marginBottom: 4 }} />
                        : <div className={`pc-rank-badge ${getRankClass(partyMemberFull.mmr ?? 1000)}`}>{getRank(partyMemberFull.mmr ?? 1000).name.slice(0, 2).toUpperCase()}</div>
                      }
                      <div className="pc-rank-label" style={{ color: getRank(partyMemberFull.mmr ?? 1000).color }}>
                        {partyMemberFull.isPlaced ? getRank(partyMemberFull.mmr ?? 1000).name : 'Unranked'}
                      </div>
                      <div className="pc-username">{partyMemberFull.username}</div>
                      <div className="pc-elo">
                        {partyMemberFull.isPlaced ? `${(partyMemberFull.mmr ?? 1000).toLocaleString()} ELO` : 'Unranked'}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            </>
          );
        })()}

        {/* Queue section pinned near bottom */}
        <div className="lm-queue">
          <div className="pc-modes-bar" style={{ maxWidth: 320 }}>
            {['1v1', '2v2'].map((m) => (
              <button
                key={m}
                className={`pc-mode-tab ${mode === m ? 'active' : ''}`}
                onClick={() => !(party?.status === 'active') && setMode(m)}
                disabled={!!(party?.status === 'active')}
              >
                {m}
              </button>
            ))}
          </div>
          {!user.isApproved ? (
            <p style={{ fontStyle: 'italic', color: 'var(--warning)', fontSize: 13, textAlign: 'center' }}>
              Your account is pending admin approval.
            </p>
          ) : party && party.status === 'active' && party.leader._id !== user._id ? (
            <p style={{ fontStyle: 'italic', color: 'var(--sub)', fontSize: 13, textAlign: 'center' }}>
              Waiting for {party.leader.username} to start the queue...
            </p>
          ) : (
            <button
              className="lm-queue-btn"
              onClick={() => {
                if (party && party.status === 'active') {
                  navigate('/queue', { state: { mode: '2v2', partyId: party._id } });
                } else {
                  navigate('/queue', { state: { mode } });
                }
              }}
            >
              {party && party.status === 'active' ? 'Join Queue with Party' : 'Join Queue'}
            </button>
          )}
          {party?.status === 'active' && (
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 12 }}>
              <button className="btn-decline" onClick={handleLeaveParty}>Leave Party</button>
              {party.leader._id === user._id && (
                <button className="btn-accept" onClick={handleChallengePartyMember}>1v1</button>
              )}
            </div>
          )}
        </div>

        </>}
      </div>

      <div className="fr-panel">
        {user.isAdmin ? (
          <div className="fr-tabs">
            <button className={`fr-tab ${!showAllPlayers ? 'active' : ''}`} onClick={() => setShowAllPlayers(false)}>Friends</button>
            <button className={`fr-tab ${showAllPlayers ? 'active' : ''}`} onClick={() => setShowAllPlayers(true)}>Players</button>
          </div>
        ) : (
          <div className="fr-title">Friends</div>
        )}

        {showAllPlayers ? (
          <div className="fr-list">
            {allUsers.map((u) => {
              const isOnline = onlineUserIds.includes(u._id);
              const dotClass = !isOnline ? 'offline'
                : u.status === 'in-game' ? 'ingame'
                : u.status === 'queued' ? 'queued'
                : u.status === 'in-party' ? 'inparty'
                : 'online';
              const statusLabel = !isOnline ? 'Offline'
                : u.status === 'in-game' ? 'In game'
                : u.status === 'queued' ? 'In queue'
                : u.status === 'in-party' ? 'In party'
                : 'Idle';
              return (
                <div key={u._id} className="fr-card" onContextMenu={(e) => handleRightClick(e, u._id)}>
                  <div className={`fr-dot ${dotClass}`} />
                  <div className="fr-info">
                    <div className="fr-name">{u.username}</div>
                    <div className="fr-status">{statusLabel}</div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <>
        <div className="fr-add-card">
          <div className="fr-add-header">
            <div className="fr-add-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="19" y1="8" x2="19" y2="14" />
                <line x1="16" y1="11" x2="22" y2="11" />
              </svg>
              Add friend
            </div>
            <div className="fr-add-dots"><span /><span /><span /></div>
          </div>
          <div className="fr-add-body">
            <div className="fr-add-group">
              <input
                type="text"
                placeholder=" "
                aria-label="Username"
                value={friendUsername}
                onChange={(e) => setFriendUsername(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendFriendRequest()}
                className="fr-add-input"
              />
              <label className="fr-add-label" data-text="USERNAME">Username</label>
            </div>
            <button onClick={handleSendFriendRequest} className="fr-add-submit" data-text="ADD">
              <span className="btn-text">Add</span>
            </button>
          </div>
        </div>
        {friendError && <p className="fr-error">{friendError}</p>}

        <div className="fr-list">
          {friends.map((friend) => {
            const isOnline = onlineUserIds.includes(friend._id);
            const dotClass = !isOnline ? 'offline'
              : friend.status === 'in-game' ? 'ingame'
              : friend.status === 'queued' ? 'queued'
              : friend.status === 'in-party' ? 'inparty'
              : 'online';
            const statusLabel = !isOnline ? 'Offline'
              : friend.status === 'in-game' ? 'In game'
              : friend.status === 'queued' ? 'In queue'
              : friend.status === 'in-party' ? 'In party'
              : 'Idle';
            return (
              <div
                key={friend._id}
                className="fr-card"
                onContextMenu={(e) => handleRightClick(e, friend._id, true)}
              >
                <div className={`fr-dot ${dotClass}`} />
                <div className="fr-info">
                  <div className="fr-name">{friend.username}</div>
                  <div className="fr-status">{statusLabel}</div>
                </div>
              </div>
            );
          })}
          {friends.length === 0 && (
            <p className="fr-empty">No friends yet</p>
          )}
        </div>
          </>
        )}
      </div>

      {contextMenu && (() => {
        const ctxUser = allUsers.find((u) => u._id === contextMenu.userId);
        if (!ctxUser) return null;
        const isOnline = onlineUserIds.includes(ctxUser._id);
        return (
          <div
            style={{
              position: 'fixed',
              top: contextMenu.y,
              left: contextMenu.x,
              background: 'var(--panel2)',
              border: '1px solid var(--border-strong)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
              zIndex: 2000,
              minWidth: 150,
              overflow: 'hidden',
              fontFamily: "'Fira Code', Consolas, monospace",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => { navigate(`/profile/${ctxUser._id}`); closeContextMenu(); }}
              style={{ display: 'block', width: '100%', padding: '10px 14px', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--text)', fontFamily: 'inherit' }}
            >
              View Profile
            </button>
            {contextMenu.isFriend && !party && isOnline && ctxUser.status === 'idle' && (
              <button
                onClick={() => { handleInviteToParty(ctxUser._id); closeContextMenu(); }}
                style={{ display: 'block', width: '100%', padding: '10px 14px', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--text)', fontFamily: 'inherit' }}
              >
                Invite to Party
              </button>
            )}
            {contextMenu.isFriend && (
              <>
                <div style={{ borderTop: '1px solid var(--border)' }} />
                <button
                  onClick={() => { handleRemoveFriend(ctxUser._id); closeContextMenu(); }}
                  style={{ display: 'block', width: '100%', padding: '10px 14px', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--danger)', fontFamily: 'inherit' }}
                >
                  Remove Friend
                </button>
              </>
            )}
          </div>
        );
      })()}

      {!isMobile && pendingRequests.length > 0 && (
        <div className={`pending-bar ${pendingOpen ? 'open' : ''}`}>
          <div className="pending-tab" onClick={() => setPendingOpen((v) => !v)}>
            <div className="pending-tab-label">
              <div className="pending-count">{pendingRequests.length}</div>
              Pending requests
            </div>
            <span className={`pending-arrow ${pendingOpen ? 'flipped' : ''}`}>â–²</span>
          </div>
          {pendingOpen && (
            <div className="pending-list">
              {pendingRequests.map((req) => (
                <div key={req._id} className="pending-row">
                  <span className="pending-name">{req.requester.username}</span>
                  <div className="pending-btns">
                    <button className="btn-accept" onClick={() => handleRespondToRequest(req._id, true)}>Accept</button>
                    <button className="btn-decline" onClick={() => handleRespondToRequest(req._id, false)}>Decline</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Mobile bottom nav */}
      {isMobile && (
        <div className="mobile-nav">
          <button
            className={`mobile-nav-btn ${activeTab === 'leaderboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('leaderboard')}
          >
            Leaderboard
          </button>
          <button
            className={`mobile-nav-btn ${activeTab === 'main' ? 'active' : ''}`}
            onClick={() => setActiveTab('main')}
          >
            Lobby
          </button>
          <button
            className={`mobile-nav-btn ${activeTab === 'friends' ? 'active' : ''}`}
            onClick={() => setActiveTab('friends')}
          >
            Friends
            {pendingRequests.length > 0 && <span className="mobile-nav-badge">{pendingRequests.length}</span>}
          </button>
        </div>
      )}

    </div>
    </div>
  );
}


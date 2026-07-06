import API from '../api.js';
import { createContext, useContext, useState, useEffect } from 'react';
import socket from '../socket';

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('matchmaking_user');
    if (stored) {
      const parsedUser = JSON.parse(stored);
      setUser(parsedUser);
      socket.emit('register', parsedUser._id);
    }
    setLoading(false);
  }, []);

  const loginUser = (userData) => {
    localStorage.setItem('matchmaking_user', JSON.stringify(userData));
    setUser(userData);
    if (!socket.connected) {
    socket.connect();
  }
  socket.emit('register', userData._id);
};

  const logoutUser = async () => {
    const stored = localStorage.getItem('matchmaking_user');
    if (stored) {
      const u = JSON.parse(stored);
      if (u?.status === 'queued') {
        try {
          await fetch(`${API}/api/queue/leave`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: u._id }),
          });
        } catch (err) {
          // ignore â€” best effort
        }
      }
    }
    localStorage.removeItem('matchmaking_user');
    setUser(null);
    socket.emit();
  };

  const refreshUser = async () => {
    if (!user?._id) return;
    try {
      const res = await fetch(`${API}/api/users/${user._id}`);
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('matchmaking_user', JSON.stringify(data));
        setUser(data);
      }
    } catch (err) {
      // ignore
    }
  };

  return (
    <UserContext.Provider value={{ user, loginUser, logoutUser, loading, refreshUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}


import API, { authFetch } from '../api.js';
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

  useEffect(() => {
    const handle = () => {
      localStorage.removeItem('matchmaking_user');
      setUser(null);
      window.location.href = '/';
    };
    window.addEventListener('auth:unauthorized', handle);
    return () => window.removeEventListener('auth:unauthorized', handle);
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
          await authFetch(`${API}/api/queue/leave`, {
            method: 'POST',
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
        const updated = { ...data, token: user.token };
        localStorage.setItem('matchmaking_user', JSON.stringify(updated));
        setUser(updated);
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


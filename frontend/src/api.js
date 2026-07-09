const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
export default API;

export const authHeaders = () => {
  const stored = localStorage.getItem('matchmaking_user');
  const token = stored ? JSON.parse(stored).token : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const authFetch = async (url, options = {}) => {
  const res = await fetch(url, {
    ...options,
    headers: { ...authHeaders(), ...(options.headers || {}) },
  });
  if (res.status === 401) {
    window.dispatchEvent(new Event('auth:unauthorized'));
  }
  return res;
};

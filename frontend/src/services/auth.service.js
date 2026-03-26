const BASE = (import.meta.env.VITE_API_URL );

// ── Token helpers ─────────────────────────────────────────
export const getToken = () => localStorage.getItem('gg_token');
export const getUser = () => { try { return JSON.parse(localStorage.getItem('gg_user')); } catch { return null; } };
export const isAdmin = () => getUser()?.role === 'admin';
export const isLoggedIn = () => !!getToken();


const saveSession = (data) => {


  localStorage.setItem('gg_token', data.token);
  localStorage.setItem('gg_user', JSON.stringify({ _id: data._id, name: data.name, email: data.email, role: data.role }));
};

export const clearSession = () => {
  localStorage.removeItem('gg_token');
  localStorage.removeItem('gg_user');
};

// ── API calls ─────────────────────────────────────────────
export const loginUser = async (email, password) => {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  saveSession(data.data);
  return data.data;
};

export const fetchMe = async () => {
  const res = await fetch(`${BASE}/api/auth/me`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
};

export const registerUser = async (body) => {
  const res = await fetch(`${BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
};

export const fetchAuthUsers = async () => {
  const res = await fetch(`${BASE}/api/auth/users`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
};

export const toggleAuthUser = async (id) => {
  const res = await fetch(`${BASE}/api/auth/users/${id}/toggle`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
};

export const seedAdmin = async () => {
  const res = await fetch(`${BASE}/api/auth/seed`, { method: 'POST' });
  return res.json();
};
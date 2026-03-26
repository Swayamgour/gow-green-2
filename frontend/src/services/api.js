// const BASE_URL = 'http://localhost:5000/api';
const BASE_URL = 'https://glow-green.onrender.com/api';
export const SERVER_URL = 'https://glowgreen-backend.onrender.com';

const getToken = () => localStorage.getItem('gg_token');
// 
const request = async (method, path, body = null, isForm = false) => {
  const headers = {};
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!isForm && body) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: isForm ? body : body ? JSON.stringify(body) : undefined,
  });

  // Token expired or invalid — force logout
  if (res.status === 401) {
    localStorage.removeItem('gg_token');
    localStorage.removeItem('gg_user');
    window.location.href = '/';
    return;
  }

  return res.json();
};

const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body),
  put: (path, body) => request('PUT', path, body),
  patch: (path, body) => request('PATCH', path, body),
  delete: (path) => request('DELETE', path),
  postForm: (path, formData) => request('POST', path, formData, true),
  putForm: (path, formData) => request('PUT', path, formData, true),
};

export default api;
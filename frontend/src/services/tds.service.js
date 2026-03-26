import api from './api';

const BASE = (import.meta.env.VITE_API_URL );

export const fetchTDSList = (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return api.get(`/tds${q ? `?${q}` : ''}`);
};

export const fetchTDSById     = (id)       => api.get(`/tds/${id}`);
export const fetchTDSCategories = ()       => api.get('/tds/categories');
export const updateTDS        = (id, body) => api.put(`/tds/${id}`, body);
export const deleteTDS        = (id)       => api.delete(`/tds/${id}`);

export const uploadTDS = async (formData) => {
  const response = await fetch(`${BASE}/api/tds`, {
    method: 'POST',
    body: formData,   // multipart — no Content-Type header
  });
  return response.json();
};

export const downloadTDS = (id, fileName) => {
  const link = document.createElement('a');
  link.href = `${BASE}/api/tds/${id}/download`;
  link.download = fileName || 'document';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const getTDSFileUrl = (id) => `${BASE}/api/tds/${id}/download`;
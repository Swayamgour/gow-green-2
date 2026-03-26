import api from './api';

const BASE = (import.meta.env.VITE_API_URL );

export const fetchQuotations   = (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return api.get(`/quotations${q ? `?${q}` : ''}`);
};
export const fetchQuotationById = (id)       => api.get(`/quotations/${id}`);
export const createQuotation    = (body)     => api.post('/quotations', body);
export const updateQuotation    = (id, body) => api.put(`/quotations/${id}`, body);
export const deleteQuotation    = (id)       => api.delete(`/quotations/${id}`);
export const updateQuotationStatus = (id, status) => api.patch(`/quotations/${id}/status`, { status });

export const downloadQuotationPDF = async (id) => {
  const res = await api.get(`/quotations/${id}/pdf`);
  if (res.pdfUrl) window.open(res.pdfUrl, '_blank');
};

export const getQuotationPdfUrl = (pdfPath) =>
  pdfPath ? `${BASE}/quotations/${pdfPath}` : null;
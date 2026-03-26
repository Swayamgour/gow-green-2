import api from './api';

export const fetchLeads = (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  return api.get(`/leads${params ? `?${params}` : ''}`);
};

export const fetchLeadById    = (id)        => api.get(`/leads/${id}`);
export const createLead       = (body)      => api.post('/leads', body);
export const updateLead       = (id, body)  => api.put(`/leads/${id}`, body);
export const deleteLead       = (id)        => api.delete(`/leads/${id}`);

// ✅ Unified status update — sends both keys to handle backend inconsistencies
export const updateLeadStatus = (id, status) =>
  api.patch(`/leads/${id}/status`, { status, leadStatus: status });

// ✅ Unified category update
export const updateLeadCategory = (id, category) =>
  api.patch(`/leads/${id}/category`, { category });

// ✅ Inline field update — used by dropdown menus to patch any single field
export const updateLeadField = (id, field, value) =>
  api.patch(`/leads/${id}`, { [field]: value });

export const addLeadNote    = (id, text)   => api.post(`/leads/${id}/notes`, { text });
export const deleteLeadNote = (id, noteId) => api.delete(`/leads/${id}/notes/${noteId}`);
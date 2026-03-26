// src/services/executive.service.js
import api from './api';

// Fetch all executives
export const fetchExecutives = () => api.get('/executives');

// Fetch one executive by ID
export const fetchExecutiveById = (id) => api.get(`/executives/${id}`);


export const createExecutive = (formData) => api.postForm('/executives', formData);

// Update executive (with optional new photo)
export const updateExecutive = (id, data) => api.put(`/executives/${id}`, data);

// Delete executive
export const deleteExecutive = (id) => api.delete(`/executives/${id}`);
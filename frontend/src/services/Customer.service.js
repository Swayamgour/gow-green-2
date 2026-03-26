import api from './api';

const BASE = (import.meta.env.VITE_API_URL );

export const fetchCustomers = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return api.get(`/customers${query ? `?${query}` : ''}`);
};

export const fetchCustomerById = (id) => api.get(`/customers/${id}`);

export const createCustomer = (body) => api.post('/customers', body);

export const updateCustomer = (id, body) => api.put(`/customers/${id}`, body);

export const deleteCustomer = (id) => api.delete(`/customers/${id}`);

export const addCustomerNote = (id, text) => api.post(`/customers/${id}/notes`, { text });

// export const exportCustomersExcel = () => {
//   window.open(`${BASE}/api/customers/export`, '_blank');
// };

export const exportCustomersExcel = (params = {}) => {
  console.log(params)
  const query = new URLSearchParams(params).toString();

  const link = document.createElement("a");
  // link.href = `/api/customers/export?${query}`;
  link.href = `${BASE}/api/customers/export?${query}`;
  link.download = "customers.xlsx"; // optional
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const downloadCustomerTemplate = () => {
  window.open(`${BASE}/api/customers/template`, '_blank');
};

export const importCustomersExcel = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await fetch(`${BASE}/api/customers/import`, {
    method: 'POST',
    body: formData
  });
  return response.json();
};
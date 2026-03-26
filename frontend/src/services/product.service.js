import api from './api';

const BASE = (import.meta.env.VITE_API_URL );

export const fetchProducts = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return api.get(`/products${query ? `?${query}` : ''}`);
};

export const fetchProductById = (id) => api.get(`/products/${id}`);

export const createProduct = (body) => api.post('/products', body);

export const updateProduct = (id, body) => api.put(`/products/${id}`, body);

export const deleteProduct = (id) => api.delete(`/products/${id}`);

// export const exportProductsExcel = (type = '') => {
//   const query = type ? `?type=${type}` : '';
//   window.open(`${BASE}/api/products/export${query}`, '_blank');
// };

export const exportProductsExcel = (type = '') => {
  const query = type ? `?type=${type}` : '';

  // const link = document.createElement("a");
  window.open(`${BASE}/api/products/export${query}`, '_blank');

  // link.click();
};

// export const downloadProductTemplate = () => {
//   window.open(`${BASE}/api/products/template`, '_blank');
// };

export const downloadProductTemplate = (type) => {
  window.open(`${BASE}/api/products/template?type=${type}`, '_blank');
};

// export const importProductsExcel = async (file) => {
//   const formData = new FormData();
//   formData.append('file', file);
//   const response = await fetch(`${BASE}/api/products/import`, {
//     method: 'POST',
//     body: formData
//   });
//   return response.json();
// };


export const importProductsExcel = async (file, type) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', type); // 👈 VERY IMPORTANT

  const response = await fetch(`${BASE}/api/products/import`, {
    method: 'POST',
    body: formData
  });

  return response.json();
};

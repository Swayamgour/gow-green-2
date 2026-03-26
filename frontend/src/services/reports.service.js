const BASE = (import.meta.env.VITE_API_URL );

const downloadReport = async (endpoint, filename, params = {}) => {
  const query = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v))
  ).toString();

  const url = `${BASE}/api/reports/${endpoint}${query ? `?${query}` : ''}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Export failed: ${res.statusText}`);

  const blob = await res.blob();
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
};

export const exportLeadsReport = (params)      => downloadReport('leads',      `GlowGreen_Leads_${Date.now()}.xlsx`,      params);
export const exportCustomersReport = (params)  => downloadReport('customers',  `GlowGreen_Customers_${Date.now()}.xlsx`,  params);
export const exportProductsReport = (params)   => downloadReport('products',   `GlowGreen_Products_${Date.now()}.xlsx`,   params);
export const exportQuotationsReport = (params) => downloadReport('quotations', `GlowGreen_Quotations_${Date.now()}.xlsx`, params);
export const exportMasterReport = (params)     => downloadReport('master',     `GlowGreen_MasterReport_${Date.now()}.xlsx`, params);
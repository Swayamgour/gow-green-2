const BASE = 'https://glowgreen-backend.onrender.com';

const safeJson = async (response) => {
  const text = await response.text();
  if (!text || text.trim() === '') {
    throw new Error(`Server returned empty response (status ${response.status})`);
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Invalid JSON from server: ${text.slice(0, 100)}`);
  }
};

export const momService = {
  scanAndGenerateMOM: async (imageFile) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    const response = await fetch(`${BASE}/api/mom/scan-and-generate`, {
      method: 'POST',
      body: formData
    });
    return safeJson(response);
  },

  generateFromText: async (text) => {
    const response = await fetch(`${BASE}/api/mom/generate-from-text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    return safeJson(response);
  }
};
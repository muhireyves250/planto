import { getCached, setCached, clearCached } from './cache';

const BASE_URL = import.meta.env.VITE_API_URL || '';

function authHeaders(extra = {}) {
  const user = JSON.parse(sessionStorage.getItem('planto_user'));
  const headers = { 'Content-Type': 'application/json', ...extra };
  if (user?.access_token) headers['Authorization'] = `Bearer ${user.access_token}`;
  return headers;
}

async function handle(res) {
  if (res.status === 401) { sessionStorage.removeItem('planto_user'); window.location.reload(); }
  if (!res.ok) { const err = new Error(await res.text()); err.status = res.status; throw err; }
  if (res.status === 204) return null;
  return res.json();
}

export const agronomistApi = {
  getFarmers: async () => {
    const cached = getCached('agro_farmers');
    if (cached) return cached;
    const data = await fetch(`${BASE_URL}/agronomist/farmers`, { headers: authHeaders() }).then(handle);
    setCached('agro_farmers', data);
    return data;
  },

  getFarmer: (id) =>
    fetch(`${BASE_URL}/agronomist/farmers/${id}`, { headers: authHeaders() }).then(handle),

  addFarmer: async (data) => {
    const result = await fetch(`${BASE_URL}/agronomist/farmers`, {
      method: 'POST', headers: authHeaders(), body: JSON.stringify(data),
    }).then(handle);
    clearCached('agro_farmers');
    clearCached('agro_farms');
    return result;
  },

  updateFarmer: async (id, data) => {
    const result = await fetch(`${BASE_URL}/agronomist/farmers/${id}`, {
      method: 'PATCH', headers: authHeaders(), body: JSON.stringify(data),
    }).then(handle);
    clearCached('agro_farmers');
    return result;
  },

  deleteFarmer: async (id) => {
    const result = await fetch(`${BASE_URL}/agronomist/farmers/${id}`, {
      method: 'DELETE', headers: authHeaders(),
    }).then(handle);
    clearCached('agro_farmers');
    clearCached('agro_farms');
    return result;
  },

  getFarms: async () => {
    const cached = getCached('agro_farms');
    if (cached) return cached;
    const data = await fetch(`${BASE_URL}/agronomist/farms`, { headers: authHeaders() }).then(handle);
    setCached('agro_farms', data);
    return data;
  },

  getFarmDetail: async (farmId) => {
    const key = `agro_farm_${farmId}`;
    const cached = getCached(key);
    if (cached) return cached;
    const data = await fetch(`${BASE_URL}/agronomist/farms/${farmId}`, { headers: authHeaders() }).then(handle);
    setCached(key, data);
    return data;
  },

  invalidateFarm: (farmId) => {
    clearCached(`agro_farm_${farmId}`);
    clearCached('agro_farms');
  },

  updateFarm: async (farmId, data) => {
    const result = await fetch(`${BASE_URL}/agronomist/farms/${farmId}`, {
      method: 'PATCH', headers: authHeaders(), body: JSON.stringify(data),
    }).then(handle);
    clearCached(`agro_farm_${farmId}`);
    clearCached('agro_farms');
    return result;
  },

  sendFarmerReport: (farmId) =>
    fetch(`${BASE_URL}/reports/send-farmer-report/${farmId}`, {
      method: 'POST', headers: authHeaders(),
    }).then(handle),
};

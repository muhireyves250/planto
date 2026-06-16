import { getCached, setCached, clearCached } from './cache';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8080';

function authHeaders() {
  const user = JSON.parse(localStorage.getItem('planto_user'));
  return user?.access_token
    ? { Authorization: `Bearer ${user.access_token}` }
    : {};
}

async function handle(res) {
  if (res.status === 401) { localStorage.removeItem('planto_user'); window.location.reload(); }
  if (!res.ok) throw new Error(res.status);
  if (res.status === 204) return null;
  return res.json();
}

export const monitoringApi = {
  getMyCrops: async (userId) => {
    const key = `my_crops_${userId}`;
    const cached = getCached(key);
    if (cached) return cached;
    const data = await fetch(`${BASE_URL}/planted-crops/${userId}`, { headers: authHeaders() }).then(handle);
    setCached(key, data);
    return data;
  },

  invalidateCrops: (userId) => clearCached(`my_crops_${userId}`),

  plantCrop: async (userId, cropName, status = 'pending') => {
    const data = await fetch(
      `${BASE_URL}/plant-crop?user_id=${userId}&crop_name=${cropName}&status=${status}`,
      { method: 'POST', headers: authHeaders() }
    ).then(handle);
    clearCached(`my_crops_${userId}`);
    return data;
  },

  getAllCrops: async () =>
    fetch(`${BASE_URL}/planted-crops`, { headers: authHeaders() }).then(handle),

  submitMonitoring: async (plantId, monitoringData) => {
    const data = await fetch(`${BASE_URL}/soil-monitoring/${plantId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(monitoringData),
    }).then(handle);
    // Invalidate so the next getMyCrops fetch returns fresh health/soil data
    const user = JSON.parse(localStorage.getItem('planto_user'));
    if (user?.id) clearCached(`my_crops_${user.id}`);
    return data;
  },

  updateCropStatus: async (plantId, status) => {
    const data = await fetch(`${BASE_URL}/planted-crops/${plantId}/status?status=${status}`, {
      method: 'PUT',
      headers: authHeaders(),
    }).then(handle);
    const user = JSON.parse(localStorage.getItem('planto_user'));
    if (user?.id) clearCached(`my_crops_${user.id}`);
    return data;
  },

  deleteCrop: async (plantId) => {
    const data = await fetch(`${BASE_URL}/planted-crops/${plantId}`, {
      method: 'DELETE',
      headers: authHeaders(),
    }).then(handle);
    const user = JSON.parse(localStorage.getItem('planto_user'));
    if (user?.id) clearCached(`my_crops_${user.id}`);
    return data;
  },
};

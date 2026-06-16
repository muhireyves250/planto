import { getCached, setCached, clearCached } from './cache';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8080';

function _authHeaders() {
    const user = JSON.parse(localStorage.getItem('planto_user'));
    return user?.access_token ? { Authorization: `Bearer ${user.access_token}` } : {};
}

export const farmApi = {
    getFarms: async () => {
        const cached = getCached('farmer_farms');
        if (cached) return cached;
        const headers = _authHeaders();
        const response = await fetch(`${BASE_URL}/farms/`, { headers });
        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem('planto_user');
                window.location.reload();
                return [];
            }
            const err = new Error('Failed to fetch farms');
            err.status = response.status;
            throw err;
        }
        const data = await response.json();
        setCached('farmer_farms', data);
        return data;
    },
    createFarm: async (farmData) => {
        const response = await fetch(`${BASE_URL}/farms/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ..._authHeaders() },
            body: JSON.stringify(farmData),
        });
        if (!response.ok) {
            if (response.status === 401) { localStorage.removeItem('planto_user'); window.location.reload(); throw new Error('Session expired'); }
            throw new Error('Failed to create farm');
        }
        clearCached('farmer_farms');
        return response.json();
    },
    updateFarm: async (farmId, farmData) => {
        const response = await fetch(`${BASE_URL}/farms/${farmId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ..._authHeaders() },
            body: JSON.stringify(farmData),
        });
        if (!response.ok) {
            if (response.status === 401) { localStorage.removeItem('planto_user'); window.location.reload(); throw new Error('Session expired'); }
            throw new Error('Failed to update farm');
        }
        clearCached('farmer_farms');
        return response.json();
    },
    deleteFarm: async (farmId) => {
        const response = await fetch(`${BASE_URL}/farms/${farmId}`, {
            method: 'DELETE',
            headers: _authHeaders(),
        });
        if (!response.ok) {
            if (response.status === 401) { localStorage.removeItem('planto_user'); window.location.reload(); throw new Error('Session expired'); }
            throw new Error('Failed to delete farm');
        }
        clearCached('farmer_farms');
        return response.json();
    },
};

export const weatherApi = {
    getWeather: async (lat, lon) => {
        const response = await fetch(`${BASE_URL}/weather/?lat=${lat}&lon=${lon}`);
        if (!response.ok) {
            const err = new Error('Failed to fetch weather');
            err.status = response.status;
            throw err;
        }
        return response.json();
    }
};

export const alertApi = {
    getAlerts: async () => {
        const user = JSON.parse(localStorage.getItem('planto_user'));
        const headers = {};
        if (user?.access_token) {
            headers['Authorization'] = `Bearer ${user.access_token}`;
        }
        const response = await fetch(`${BASE_URL}/alerts/`, { headers });
        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem('planto_user');
                window.location.reload();
                return [];
            }
            const err = new Error('Failed to fetch alerts');
            err.status = response.status;
            throw err;
        }
        return response.json();
    },
    markRead: async (alertId) => {
        const user = JSON.parse(localStorage.getItem('planto_user'));
        const response = await fetch(`${BASE_URL}/alerts/${alertId}/read`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${user?.access_token}`
            }
        });
        if (!response.ok) {
            const err = new Error('Failed to mark alert as read');
            err.status = response.status;
            throw err;
        }
        return response.json();
    }
};

function authHeaders() {
  const user = JSON.parse(localStorage.getItem('planto_user'));
  return user?.access_token ? { Authorization: `Bearer ${user.access_token}` } : {};
}

export const notificationApi = {
  getAlerts: async () => {
    const res = await fetch(`${BASE_URL}/alerts/`, { headers: authHeaders() });
    if (!res.ok) throw new Error(res.status);
    return res.json();
  },

  markRead: async (id) => {
    const res = await fetch(`${BASE_URL}/alerts/${id}/read`, { method: 'PUT', headers: authHeaders() });
    if (!res.ok) throw new Error(res.status);
    return res.json();
  },

  markAllRead: async () => {
    const res = await fetch(`${BASE_URL}/alerts/read-all`, { method: 'PUT', headers: authHeaders() });
    if (!res.ok) throw new Error(res.status);
    return res.json();
  },

  deleteAlert: async (id) => {
    const res = await fetch(`${BASE_URL}/alerts/${id}`, { method: 'DELETE', headers: authHeaders() });
    if (!res.ok) throw new Error(res.status);
    return res.json();
  },

  subscribe: async (subscription) => {
    const keys = subscription.toJSON().keys;
    const res = await fetch(`${BASE_URL}/alerts/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ endpoint: subscription.endpoint, p256dh: keys.p256dh, auth: keys.auth }),
    });
    if (!res.ok) throw new Error(res.status);
    return res.json();
  },

  getVapidKey: async () => {
    const res = await fetch(`${BASE_URL}/alerts/vapid-public-key`);
    if (!res.ok) throw new Error(res.status);
    return res.json(); // { public_key: "..." }
  },
};

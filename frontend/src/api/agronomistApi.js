const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8080';

function authHeaders(extra = {}) {
  const user = JSON.parse(localStorage.getItem('planto_user'));
  const headers = { 'Content-Type': 'application/json', ...extra };
  if (user?.access_token) headers['Authorization'] = `Bearer ${user.access_token}`;
  return headers;
}

async function handle(res) {
  if (res.status === 401) { localStorage.removeItem('planto_user'); window.location.reload(); }
  if (!res.ok) { const err = new Error(await res.text()); err.status = res.status; throw err; }
  if (res.status === 204) return null;
  return res.json();
}

export const agronomistApi = {
  // Managed farmers
  getFarmers: () =>
    fetch(`${BASE_URL}/agronomist/farmers`, { headers: authHeaders() }).then(handle),

  getFarmer: (id) =>
    fetch(`${BASE_URL}/agronomist/farmers/${id}`, { headers: authHeaders() }).then(handle),

  addFarmer: (data) =>
    fetch(`${BASE_URL}/agronomist/farmers`, {
      method: 'POST', headers: authHeaders(), body: JSON.stringify(data),
    }).then(handle),

  updateFarmer: (id, data) =>
    fetch(`${BASE_URL}/agronomist/farmers/${id}`, {
      method: 'PATCH', headers: authHeaders(), body: JSON.stringify(data),
    }).then(handle),

  deleteFarmer: (id) =>
    fetch(`${BASE_URL}/agronomist/farmers/${id}`, {
      method: 'DELETE', headers: authHeaders(),
    }).then(handle),

  // Managed farms
  getFarms: () =>
    fetch(`${BASE_URL}/agronomist/farms`, { headers: authHeaders() }).then(handle),

  getFarmDetail: (farmId) =>
    fetch(`${BASE_URL}/agronomist/farms/${farmId}`, { headers: authHeaders() }).then(handle),
};

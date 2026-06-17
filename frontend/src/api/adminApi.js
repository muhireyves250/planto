const BASE_URL = import.meta.env.VITE_API_URL || '';

function authHeaders() {
  const user = JSON.parse(sessionStorage.getItem('planto_user') || '{}');
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${user?.access_token}` };
}

async function api(method, path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: authHeaders(),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Request failed');
  }
  return res.json();
}

export const adminApi = {
  getOverview: () => api('GET', '/admin/overview'),
  getPending:  () => api('GET', '/admin/pending'),

  approveUser: (id)          => api('POST',   `/admin/users/${id}/approve`),
  rejectUser:  (id)          => api('POST',   `/admin/users/${id}/reject`),
  updateUser:  (id, payload) => api('PATCH',  `/admin/users/${id}`, payload),
  deleteUser:  (id)          => api('DELETE', `/admin/users/${id}`),
  deleteFarm:  (id)          => api('DELETE', `/admin/farms/${id}`),
};

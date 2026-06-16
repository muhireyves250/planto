const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8080';

export const adminApi = {
  getOverview: async () => {
    const user = JSON.parse(localStorage.getItem('planto_user'));
    const res = await fetch(`${BASE_URL}/admin/overview`, {
      headers: { Authorization: `Bearer ${user?.access_token}` },
    });
    if (!res.ok) throw new Error('Failed to fetch admin overview');
    return res.json();
  },
};

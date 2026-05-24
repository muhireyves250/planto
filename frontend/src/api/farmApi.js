const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8080';

export const farmApi = {
    getFarms: async () => {
        const user = JSON.parse(localStorage.getItem('planto_user'));
        const headers = {};
        if (user?.access_token) {
            headers['Authorization'] = `Bearer ${user.access_token}`;
        }
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
        return response.json();
    },
    createFarm: async (farmData) => {
        const user = JSON.parse(localStorage.getItem('planto_user'));
        const headers = { 'Content-Type': 'application/json' };
        if (user?.access_token) {
            headers['Authorization'] = `Bearer ${user.access_token}`;
        }
        const response = await fetch(`${BASE_URL}/farms/`, {
            method: 'POST',
            headers,
            body: JSON.stringify(farmData)
        });
        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem('planto_user');
                window.location.reload();
                throw new Error('Session expired');
            }
            const err = new Error('Failed to create farm');
            err.status = response.status;
            throw err;
        }
        return response.json();
    },
    updateFarm: async (farmId, farmData) => {
        const user = JSON.parse(localStorage.getItem('planto_user'));
        const headers = { 'Content-Type': 'application/json' };
        if (user?.access_token) {
            headers['Authorization'] = `Bearer ${user.access_token}`;
        }
        const response = await fetch(`${BASE_URL}/farms/${farmId}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(farmData)
        });
        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem('planto_user');
                window.location.reload();
                throw new Error('Session expired');
            }
            throw new Error('Failed to update farm');
        }
        return response.json();
    },
    deleteFarm: async (farmId) => {
        const user = JSON.parse(localStorage.getItem('planto_user'));
        const headers = {};
        if (user?.access_token) {
            headers['Authorization'] = `Bearer ${user.access_token}`;
        }
        const response = await fetch(`${BASE_URL}/farms/${farmId}`, {
            method: 'DELETE',
            headers
        });
        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem('planto_user');
                window.location.reload();
                throw new Error('Session expired');
            }
            throw new Error('Failed to delete farm');
        }
        return response.json();
    }
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

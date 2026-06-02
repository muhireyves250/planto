const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8080';

export const sensorApi = {
  getLatest: async () => {
    const response = await fetch(`${BASE_URL}/sensor/latest`);
    if (!response.ok) throw new Error('Sensor fetch failed');
    return await response.json();
  }
};

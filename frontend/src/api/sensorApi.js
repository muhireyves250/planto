const BASE_URL = import.meta.env.VITE_API_URL || '';

export const sensorApi = {
  getLatest: async () => {
    const response = await fetch(`${BASE_URL}/sensor/latest`);
    if (!response.ok) throw new Error('Sensor fetch failed');
    return await response.json();
  }
};

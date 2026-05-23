const BASE_URL = 'http://127.0.0.1:8080';

export const predictionApi = {
  getPrediction: async (formData) => {
    const user = JSON.parse(localStorage.getItem('planto_user'));
    const response = await fetch(`${BASE_URL}/predict`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...(user?.access_token ? { 'Authorization': `Bearer ${user.access_token}` } : {})
      },
      body: JSON.stringify(formData)
    });
    if (!response.ok) throw new Error('Prediction failed');
    return await response.json();
  },
  
  getHistory: async () => {
    const user = JSON.parse(localStorage.getItem('planto_user'));
    const response = await fetch(`${BASE_URL}/predictions`, {
      headers: {
        ...(user?.access_token ? { 'Authorization': `Bearer ${user.access_token}` } : {})
      }
    });
    if (!response.ok) throw new Error('History fetch failed');
    return await response.json();
  }
};

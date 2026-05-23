const BASE_URL = 'http://127.0.0.1:8080';

export const fertilizerApi = {
  getRecommendation: async (plantId) => {
    const user = JSON.parse(localStorage.getItem('planto_user'));
    const response = await fetch(`${BASE_URL}/fertilizer-recommendation/${plantId}`, {
      headers: {
        'Authorization': `Bearer ${user?.access_token}`
      }
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch recommendation');
    }
    return await response.json();
  }
};

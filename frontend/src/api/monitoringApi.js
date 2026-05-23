const BASE_URL = 'http://127.0.0.1:8080';

export const monitoringApi = {
  plantCrop: async (userId, cropName, status = "pending") => {
    const user = JSON.parse(localStorage.getItem('planto_user'));
    const response = await fetch(`${BASE_URL}/plant-crop?user_id=${userId}&crop_name=${cropName}&status=${status}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${user?.access_token}`
      }
    });
    if (!response.ok) throw new Error('Planting failed');
    return await response.json();
  },
  
  getMyCrops: async (userId) => {
    const user = JSON.parse(localStorage.getItem('planto_user'));
    const response = await fetch(`${BASE_URL}/planted-crops/${userId}`, {
      headers: {
        'Authorization': `Bearer ${user?.access_token}`
      }
    });
    if (!response.ok) throw new Error('Fetch crops failed');
    return await response.json();
  },

  getAllCrops: async () => {
    const user = JSON.parse(localStorage.getItem('planto_user'));
    const response = await fetch(`${BASE_URL}/planted-crops`, {
      headers: {
        'Authorization': `Bearer ${user?.access_token}`
      }
    });
    if (!response.ok) throw new Error('Fetch all crops failed');
    return await response.json();
  },
  
  submitMonitoring: async (plantId, monitoringData) => {
    const user = JSON.parse(localStorage.getItem('planto_user'));
    const response = await fetch(`${BASE_URL}/soil-monitoring/${plantId}`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user?.access_token}`
      },
      body: JSON.stringify(monitoringData)
    });
    if (!response.ok) throw new Error('Monitoring submission failed');
    return await response.json();
  },

  updateCropStatus: async (plantId, status) => {
    const user = JSON.parse(localStorage.getItem('planto_user'));
    const response = await fetch(`${BASE_URL}/planted-crops/${plantId}/status?status=${status}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${user?.access_token}`
      }
    });
    if (!response.ok) throw new Error('Status update failed');
    return await response.json();
  },

  deleteCrop: async (plantId) => {
    const user = JSON.parse(localStorage.getItem('planto_user'));
    const response = await fetch(`${BASE_URL}/planted-crops/${plantId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${user?.access_token}`
      }
    });
    if (!response.ok) throw new Error('Delete failed');
    return await response.json();
  }
};

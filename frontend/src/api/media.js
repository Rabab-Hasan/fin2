// API functions for media management
const API_BASE = process.env.REACT_APP_API_URL || 'https://fin2-4.onrender.com';

const mediaApi = {
  // Get all media assets
  getAssets: async (filters = {}) => {
    const searchParams = new URLSearchParams();
    if (filters.stage && filters.stage !== 'all') searchParams.append('stage', filters.stage);
    if (filters.search) searchParams.append('search', filters.search);
    if (filters.status) searchParams.append('status', filters.status);
    
    const response = await fetch(`${API_BASE}/api/media?${searchParams}`);
    if (!response.ok) throw new Error('Failed to fetch media assets');
    return response.json();
  },

  // Get specific asset
  getAsset: async (id) => {
    const response = await fetch(`${API_BASE}/api/media/${id}`);
    if (!response.ok) throw new Error('Failed to fetch media asset');
    return response.json();
  },

  // Upload new asset
  uploadAsset: async (file, metadata) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('stage', metadata.stage);
    formData.append('tags', metadata.tags);
    formData.append('description', metadata.description);
    formData.append('status', metadata.status || 'active');

    const response = await fetch(`${API_BASE}/api/media/upload`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) throw new Error('Failed to upload asset');
    return response.json();
  },

  // Update asset metadata
  updateAsset: async (id, metadata) => {
    const response = await fetch(`/api/media/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(metadata),
    });
    
    if (!response.ok) throw new Error('Failed to update asset');
    return response.json();
  },

  // Delete asset
  deleteAsset: async (id) => {
    const response = await fetch(`/api/media/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) throw new Error('Failed to delete asset');
    return response.json();
  },

  // Get asset statistics
  getStats: async () => {
    const response = await fetch(`${API_BASE}/api/media/stats/overview`);
    if (!response.ok) throw new Error('Failed to fetch stats');
    return response.json();
  }
};

export default mediaApi;
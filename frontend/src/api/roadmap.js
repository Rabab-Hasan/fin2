// API functions for roadmap management
const roadmapApi = {
  // Get all roadmap assets
  getAssets: async (clientId) => {
    const response = await fetch(`/api/roadmap/assets?clientId=${clientId}`);
    if (!response.ok) throw new Error('Failed to fetch roadmap assets');
    return response.json();
  },

  // Create new asset
  createAsset: async (asset) => {
    const response = await fetch('/api/roadmap/assets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(asset),
    });
    if (!response.ok) throw new Error('Failed to create asset');
    return response.json();
  },

  // Update asset
  updateAsset: async (id, updates) => {
    const response = await fetch(`/api/roadmap/assets/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error('Failed to update asset');
    return response.json();
  },

  // Delete asset
  deleteAsset: async (id) => {
    const response = await fetch(`/api/roadmap/assets/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete asset');
    return response.json();
  },

  // Export roadmap
  exportRoadmap: async (format, clientId) => {
    const response = await fetch(`/api/roadmap/export?format=${format}&clientId=${clientId}`);
    if (!response.ok) throw new Error('Failed to export roadmap');
    
    if (format === 'image') {
      return response.blob();
    }
    
    return response.json();
  },

  // Sync with content management system
  syncWithCMS: async (clientId) => {
    const response = await fetch(`/api/roadmap/sync?clientId=${clientId}`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to sync with CMS');
    return response.json();
  }
};

export default roadmapApi;
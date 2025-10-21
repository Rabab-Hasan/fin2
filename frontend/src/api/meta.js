const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://fin2-4.onrender.com';

export const metaApi = {
  // Get Meta OAuth URL
  getAuthUrl: async () => {
    const response = await fetch(`${API_BASE_URL}/api/meta/auth-url`);
    if (!response.ok) {
      throw new Error('Failed to get Meta auth URL');
    }
    return response.json();
  },

  // Handle OAuth callback
  handleCallback: async (code, state) => {
    const response = await fetch(`${API_BASE_URL}/api/meta/callback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code, state }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to complete Meta authentication');
    }
    return response.json();
  },

  // Get Facebook pages
  getPages: async (accessToken) => {
    const response = await fetch(`${API_BASE_URL}/api/meta/pages?access_token=${accessToken}`);
    if (!response.ok) {
      throw new Error('Failed to fetch Facebook pages');
    }
    return response.json();
  },

  // Get Instagram accounts
  getInstagramAccounts: async (pageAccessToken, pageId) => {
    const response = await fetch(`${API_BASE_URL}/api/meta/instagram-accounts?page_access_token=${pageAccessToken}&page_id=${pageId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch Instagram accounts');
    }
    return response.json();
  },

  // Post to Facebook
  postToFacebook: async (pageId, pageAccessToken, message, link = null) => {
    const response = await fetch(`${API_BASE_URL}/api/meta/post-facebook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        page_id: pageId,
        page_access_token: pageAccessToken,
        message,
        link,
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to post to Facebook');
    }
    return response.json();
  },

  // Post to Instagram
  postToInstagram: async (instagramAccountId, pageAccessToken, imageUrl, caption = '') => {
    const response = await fetch(`${API_BASE_URL}/api/meta/post-instagram`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        instagram_account_id: instagramAccountId,
        page_access_token: pageAccessToken,
        image_url: imageUrl,
        caption,
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to post to Instagram');
    }
    return response.json();
  },

  // Get page insights
  getInsights: async (pageId, pageAccessToken, metric = 'page_fans,page_impressions,page_engaged_users', period = 'day') => {
    const response = await fetch(`${API_BASE_URL}/api/meta/insights/${pageId}?page_access_token=${pageAccessToken}&metric=${metric}&period=${period}`);
    if (!response.ok) {
      throw new Error('Failed to fetch page insights');
    }
    return response.json();
  },

  // Get Facebook page posts
  getFacebookPosts: async (pageId, pageAccessToken, limit = 25, since = null, until = null) => {
    const params = new URLSearchParams({
      page_access_token: pageAccessToken,
      limit: limit.toString()
    });
    if (since) params.append('since', since);
    if (until) params.append('until', until);

    const response = await fetch(`${API_BASE_URL}/api/meta/posts/${pageId}?${params}`);
    if (!response.ok) {
      throw new Error('Failed to fetch Facebook posts');
    }
    return response.json();
  },

  // Get Instagram posts
  getInstagramPosts: async (instagramAccountId, accessToken, limit = 25, since = null, until = null) => {
    const params = new URLSearchParams({
      access_token: accessToken,
      limit: limit.toString()
    });
    if (since) params.append('since', since);
    if (until) params.append('until', until);

    const response = await fetch(`${API_BASE_URL}/api/meta/instagram-posts/${instagramAccountId}?${params}`);
    if (!response.ok) {
      throw new Error('Failed to fetch Instagram posts');
    }
    return response.json();
  },

  // Get Meta connection status
  getConnectionStatus: async (clientId) => {
    const response = await fetch(`${API_BASE_URL}/api/meta/connection-status/${clientId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch Meta connection status');
    }
    return response.json();
  },

  // Get aggregated Meta analytics
  getAnalytics: async (pageId, pageAccessToken, instagramAccountId = null, since = null, until = null) => {
    const params = new URLSearchParams({
      page_access_token: pageAccessToken
    });
    if (instagramAccountId) params.append('instagram_account_id', instagramAccountId);
    if (since) params.append('since', since);
    if (until) params.append('until', until);

    const response = await fetch(`${API_BASE_URL}/api/meta/analytics/${pageId}?${params}`);
    if (!response.ok) {
      throw new Error('Failed to fetch Meta analytics');
    }
    return response.json();
  },
};

export default metaApi;
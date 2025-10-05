const API_BASE = process.env.NODE_ENV === 'production' 
  ? `${window.location.protocol}//${window.location.hostname}:2345/api`
  : `${window.location.protocol}//${window.location.hostname}:2345/api`;

export const tiktokApi = {
  // Exchange auth code for access token
  exchangeToken: async (authCode: string, clientId: string) => {
    const response = await fetch(`${API_BASE}/tiktok/exchange-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        auth_code: authCode,
        client_id: clientId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to exchange TikTok token');
    }

    return response.json();
  },

  // Get connected TikTok accounts for a client
  getAccounts: async (clientId: string) => {
    const response = await fetch(`${API_BASE}/tiktok/accounts/${clientId}`);

    if (!response.ok) {
      throw new Error('Failed to fetch TikTok accounts');
    }

    return response.json();
  },

  // Refresh access token
  refreshToken: async (refreshToken: string, clientId: string) => {
    const response = await fetch(`${API_BASE}/tiktok/refresh-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refresh_token: refreshToken,
        client_id: clientId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to refresh TikTok token');
    }

    return response.json();
  },

  // Get TikTok ad campaigns (example of additional functionality)
  getCampaigns: async (clientId: string, advertiserId: string) => {
    const response = await fetch(`${API_BASE}/tiktok/campaigns/${clientId}/${advertiserId}`);

    if (!response.ok) {
      throw new Error('Failed to fetch TikTok campaigns');
    }

    return response.json();
  },

  // Get TikTok analytics (example of additional functionality)
  getAnalytics: async (clientId: string, advertiserId: string, dateRange: { start: string; end: string }) => {
    const params = new URLSearchParams({
      start_date: dateRange.start,
      end_date: dateRange.end,
    });

    const response = await fetch(`${API_BASE}/tiktok/analytics/${clientId}/${advertiserId}?${params}`);

    if (!response.ok) {
      throw new Error('Failed to fetch TikTok analytics');
    }

    return response.json();
  },

  // Get TikTok videos/posts
  getVideos: async (advertiserId: string, accessToken: string, pageSize = 50, page = 1, since?: string, until?: string) => {
    const params = new URLSearchParams({
      access_token: accessToken,
      page_size: pageSize.toString(),
      page: page.toString()
    });
    if (since) params.append('since', since);
    if (until) params.append('until', until);

    const response = await fetch(`${API_BASE}/tiktok/videos/${advertiserId}?${params}`);

    if (!response.ok) {
      throw new Error('Failed to fetch TikTok videos');
    }

    return response.json();
  },

  // Get TikTok campaign analytics
  getCampaignAnalytics: async (advertiserId: string, accessToken: string, since?: string, until?: string, metrics?: string) => {
    const params = new URLSearchParams({
      access_token: accessToken
    });
    if (since) params.append('since', since);
    if (until) params.append('until', until);
    if (metrics) params.append('metrics', metrics);

    const response = await fetch(`${API_BASE}/tiktok/analytics/${advertiserId}?${params}`);

    if (!response.ok) {
      throw new Error('Failed to fetch TikTok campaign analytics');
    }

    return response.json();
  },

  // Get TikTok audience insights
  getAudienceInsights: async (advertiserId: string, accessToken: string, since?: string, until?: string) => {
    const params = new URLSearchParams({
      access_token: accessToken
    });
    if (since) params.append('since', since);
    if (until) params.append('until', until);

    const response = await fetch(`${API_BASE}/tiktok/audience/${advertiserId}?${params}`);

    if (!response.ok) {
      throw new Error('Failed to fetch TikTok audience insights');
    }

    return response.json();
  },
};
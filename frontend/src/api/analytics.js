import secureApiClient from '../utils/secure-api-client';

const API_BASE_URL = (process.env.REACT_APP_API_URL || 'https://fin2-4.onrender.com') + '/api';

export const analyticsApi = {
  // Monthly Comparison
  getMonthlyComparison: (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.weeks) searchParams.append('weeks', params.weeks);
    if (params.months) searchParams.append('months', params.months);
    if (params.metric) searchParams.append('metric', params.metric);
    
    return secureApiClient.get(`/analytics/monthly-comparison?${searchParams}`);
  },

  // Weekly Comparison
  getWeeklyComparison: (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.days) searchParams.append('days', params.days);
    if (params.month) searchParams.append('month', params.month);
    if (params.metric) searchParams.append('metric', params.metric);
    
    return secureApiClient.get(`/analytics/weekly-comparison?${searchParams}`);
  },

  // Best Month Analysis
  getBestMonth: (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.metric) searchParams.append('metric', params.metric);
    if (params.weeks) searchParams.append('weeks', params.weeks);
    
    return secureApiClient.get(`/analytics/best-month?${searchParams}`);
  },

  // Strategy Advisor
  getStrategyAdvisor: (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.metric) searchParams.append('metric', params.metric);
    if (params.weeks) searchParams.append('weeks', params.weeks);
    if (params.months) searchParams.append('months', params.months);
    
    return secureApiClient.get(`/analytics/strategy-advisor?${searchParams}`);
  }
};

export const notesApi = {
  // Create a note
  create: (noteData) => {
    return secureApiClient.post('/notes', noteData);
  },

  // Get all notes
  getAll: () => {
    return secureApiClient.get('/notes');
  },

  // Delete a note
  delete: (id) => {
    return secureApiClient.delete(`/notes/${id}`);
  }
};

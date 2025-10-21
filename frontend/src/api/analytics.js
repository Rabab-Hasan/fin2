const API_BASE_URL = (process.env.REACT_APP_API_URL || 'https://fin2-4.onrender.com') + '/api';

export const analyticsApi = {
  // Monthly Comparison
  getMonthlyComparison: (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.weeks) searchParams.append('weeks', params.weeks);
    if (params.months) searchParams.append('months', params.months);
    if (params.metric) searchParams.append('metric', params.metric);
    
    return fetch(`${API_BASE}/analytics/monthly-comparison?${searchParams}`)
      .then(res => res.json());
  },

  // Weekly Comparison
  getWeeklyComparison: (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.days) searchParams.append('days', params.days);
    if (params.month) searchParams.append('month', params.month);
    if (params.metric) searchParams.append('metric', params.metric);
    
    return fetch(`${API_BASE}/analytics/weekly-comparison?${searchParams}`)
      .then(res => res.json());
  },

  // Best Month Analysis
  getBestMonth: (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.metric) searchParams.append('metric', params.metric);
    if (params.weeks) searchParams.append('weeks', params.weeks);
    
    return fetch(`${API_BASE}/analytics/best-month?${searchParams}`)
      .then(res => res.json());
  },

  // Strategy Advisor
  getStrategyAdvisor: (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.metric) searchParams.append('metric', params.metric);
    if (params.weeks) searchParams.append('weeks', params.weeks);
    if (params.months) searchParams.append('months', params.months);
    
    return fetch(`${API_BASE}/analytics/strategy-advisor?${searchParams}`)
      .then(res => res.json());
  }
};

export const notesApi = {
  // Create a note
  create: (noteData) => {
    return fetch(`${API_BASE}/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(noteData),
    }).then(res => res.json());
  },

  // Get all notes
  getAll: () => {
    return fetch(`${API_BASE}/notes`)
      .then(res => res.json());
  },

  // Delete a note
  delete: (id) => {
    return fetch(`${API_BASE}/notes/${id}`, {
      method: 'DELETE',
    }).then(res => res.json());
  }
};

import secureApiClient from '../utils/secure-api-client.js';

const API_BASE = process.env.REACT_APP_API_URL || 'https://fin2-4.onrender.com';

export const exportApi = {
  // Export all data as CSV - return authenticated URL
  exportCsv: (): string => {
    const token = secureApiClient.getAuthToken();
    return `${API_BASE}/api/export/csv${token ? `?token=${token}` : ''}`;
  },
};

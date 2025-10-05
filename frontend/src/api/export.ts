const API_BASE = '/api';

export const exportApi = {
  // Export all data as CSV
  exportCsv: (): string => {
    return `${API_BASE}/export/csv`;
  },
};

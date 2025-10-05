const API_BASE_URL = 'http://localhost:2345/api';

export const reportsApi = {
  async getReports(clientId) {
    const response = await fetch(`${API_BASE_URL}/reports?clientId=${clientId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch reports: ${response.statusText}`);
    }
    return response.json();
  },

  async getReportNotes(reportDate) {
    const response = await fetch(`${API_BASE_URL}/reports/${reportDate}/notes`);
    if (!response.ok) {
      throw new Error(`Failed to fetch report notes: ${response.statusText}`);
    }
    return response.json();
  },

  async updateReportNotes(reportDate, notes) {
    const response = await fetch(`${API_BASE_URL}/reports/${reportDate}/notes`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ notes }),
    });
    if (!response.ok) {
      throw new Error(`Failed to update report notes: ${response.statusText}`);
    }
    return response.json();
  },
};
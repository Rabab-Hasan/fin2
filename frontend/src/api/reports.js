import secureApiClient from '../utils/secure-api-client.js';

export const reportsApi = {
  async getReports(clientId) {
    return secureApiClient.get(`/reports?clientId=${clientId}`);
  },

  async getStats(clientId) {
    return secureApiClient.get(`/reports/stats?clientId=${clientId}`);
  },

  async getReportNotes(reportDate) {
    return secureApiClient.get(`/reports/${reportDate}/notes`);
  },

  async updateReportNotes(reportDate, notes) {
    return secureApiClient.put(`/reports/${reportDate}/notes`, { notes });
  },
};
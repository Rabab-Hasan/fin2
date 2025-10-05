import { Report, Stats, Rollup } from '../types';

const API_BASE = '/api';

export const reportsApi = {
  // Get all reports with optional filtering
  getReports: async (params?: { 
    month?: string; 
    limit?: number; 
    offset?: number; 
    clientId?: string; 
  }): Promise<Report[]> => {
    const searchParams = new URLSearchParams();
    if (params?.month) searchParams.append('month', params.month);
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.offset) searchParams.append('offset', params.offset.toString());
    if (params?.clientId) searchParams.append('clientId', params.clientId);
    
    const response = await fetch(`${API_BASE}/reports?${searchParams}`);
    if (!response.ok) throw new Error('Failed to fetch reports');
    return response.json();
  },

  // Create or update a report
  createReport: async (data: {
    report_date: string;
    month_label?: string;
    data: Record<string, any>;
    clientId: string;
  }): Promise<Report> => {
    const response = await fetch(`${API_BASE}/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create report');
    return response.json();
  },

  // Get dashboard statistics
  getStats: async (clientId: string): Promise<Stats> => {
    const searchParams = new URLSearchParams();
    if (clientId) searchParams.append('clientId', clientId);
    
    const response = await fetch(`${API_BASE}/reports/stats?${searchParams}`);
    if (!response.ok) throw new Error('Failed to fetch stats');
    return response.json();
  },

  // Get rollup data for charts
  getRollups: async (clientId: string, group: string = 'month'): Promise<Rollup[]> => {
    const searchParams = new URLSearchParams();
    searchParams.append('group', group);
    if (clientId) searchParams.append('clientId', clientId);
    
    const response = await fetch(`${API_BASE}/reports/rollups?${searchParams}`);
    if (!response.ok) throw new Error('Failed to fetch rollups');
    return response.json();
  },

  // Clear all data
  clearAll: async (): Promise<void> => {
    const response = await fetch(`${API_BASE}/reports`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to clear data');
  },
};

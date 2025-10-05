import { Column } from '../types';

const API_BASE = '/api';

export const columnsApi = {
  // Get all columns
  getColumns: async (): Promise<Column[]> => {
    const response = await fetch(`${API_BASE}/columns`);
    if (!response.ok) throw new Error('Failed to fetch columns');
    return response.json();
  },

  // Update column properties
  updateColumn: async (key: string, data: { label?: string; display_order?: number }): Promise<Column> => {
    const response = await fetch(`${API_BASE}/columns/${key}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update column');
    return response.json();
  },
};

import { ImportResult } from '../types';

const API_BASE = '/api';

export const importApi = {
  // Import file (Excel or CSV)
  importFile: async (file: File, clientId: string): Promise<ImportResult> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('clientId', clientId);

    const response = await fetch(`${API_BASE}/import`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) throw new Error('Failed to import file');
    return response.json();
  },

  // Download template CSV
  downloadTemplate: (): string => {
    return `${API_BASE}/template.csv`;
  },
};

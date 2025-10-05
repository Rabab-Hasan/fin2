import { BackupStatus } from '../types';

const API_BASE = '/api';

export const backupApi = {
  // Get backup status
  getStatus: async (): Promise<BackupStatus> => {
    const response = await fetch(`${API_BASE}/backup/status`);
    if (!response.ok) throw new Error('Failed to fetch backup status');
    return response.json();
  },

  // Create backup
  createBackup: async (target: 'primary' | 'emergency' = 'primary'): Promise<any> => {
    const response = await fetch(`${API_BASE}/backup/run?target=${target}`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to create backup');
    return response.json();
  },

  // Check integrity
  checkIntegrity: async (): Promise<any> => {
    const response = await fetch(`${API_BASE}/backup/integrity`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to check integrity');
    return response.json();
  },

  // Recover from backup
  recover: async (source: 'primary' | 'emergency' = 'primary'): Promise<any> => {
    const response = await fetch(`${API_BASE}/backup/recover?source=${source}`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to recover from backup');
    return response.json();
  },
};

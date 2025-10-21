import { BackupStatus } from '../types';
import secureApiClient from '../utils/secure-api-client.js';

export const backupApi = {
  // Get backup status
  getStatus: async (): Promise<BackupStatus> => {
    return secureApiClient.get('/backup/status');
  },

  // Create backup
  createBackup: async (target: 'primary' | 'emergency' = 'primary'): Promise<any> => {
    return secureApiClient.post(`/backup/run?target=${target}`);
  },

  // Check integrity
  checkIntegrity: async (): Promise<any> => {
    return secureApiClient.post('/backup/integrity');
  },

  // Recover from backup
  recover: async (source: 'primary' | 'emergency' = 'primary'): Promise<any> => {
    return secureApiClient.post(`/backup/recover?source=${source}`);
  },
};

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Database, 
  Shield, 
  AlertTriangle, 
  Download, 
  RefreshCw, 
  CheckCircle,
  X
} from 'lucide-react';
import { backupApi } from '../api/backup';
import { exportApi } from '../api/export';
import Card from './Card';

const BackupStatus: React.FC = () => {
  const [showDetails, setShowDetails] = useState(false);
  const queryClient = useQueryClient();

  const { data: status, isLoading } = useQuery({
    queryKey: ['backupStatus'],
    queryFn: backupApi.getStatus,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const createBackupMutation = useMutation({
    mutationFn: backupApi.createBackup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backupStatus'] });
    },
  });

  const checkIntegrityMutation = useMutation({
    mutationFn: backupApi.checkIntegrity,
  });

  const recoverMutation = useMutation({
    mutationFn: backupApi.recover,
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });

  const formatSize = (kb: number) => {
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleString();
  };

  const getStatusColor = (hasBackup: boolean) => {
    return hasBackup ? 'text-green-600' : 'text-red-600';
  };

  const handleRecover = async (source: 'primary' | 'emergency') => {
    const confirmed = window.confirm(
      `Are you sure you want to recover from ${source} backup? This will replace all current data.`
    );
    if (confirmed) {
      recoverMutation.mutate(source);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Data Persistence Status</h3>
          <button
            onClick={() => setShowDetails(true)}
            className="btn-secondary text-sm"
          >
            View Details
          </button>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          {/* Records Stored */}
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <Database className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{status?.records_stored || 0}</div>
            <div className="text-sm text-gray-600">Records Stored</div>
            <div className="text-xs text-gray-500 mt-1">v1.0</div>
          </div>

          {/* Main Storage */}
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-center mb-2">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <div className="text-sm font-medium text-gray-900">Main Storage</div>
            <div className="text-xs text-gray-600">{formatSize(status?.main_storage_kb || 0)}</div>
            <div className="w-2 h-2 bg-green-400 rounded-full mx-auto mt-1"></div>
          </div>

          {/* Primary Backup */}
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-center mb-2">
              <Shield className={`w-8 h-8 ${getStatusColor(!!status?.primary_last_at)}`} />
            </div>
            <div className="text-sm font-medium text-gray-900">Primary Backup</div>
            <div className="text-xs text-gray-600">{formatSize(status?.primary_backup_kb || 0)}</div>
            <div className={`w-2 h-2 rounded-full mx-auto mt-1 ${
              status?.primary_last_at ? 'bg-green-400' : 'bg-red-400'
            }`}></div>
          </div>

          {/* Emergency Backup */}
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-center mb-2">
              <AlertTriangle className={`w-8 h-8 ${getStatusColor(!!status?.emergency_last_at)}`} />
            </div>
            <div className="text-sm font-medium text-gray-900">Emergency Backup</div>
            <div className="text-xs text-gray-600">{formatSize(status?.emergency_backup_kb || 0)}</div>
            <div className={`w-2 h-2 rounded-full mx-auto mt-1 ${
              status?.emergency_last_at ? 'bg-green-400' : 'bg-red-400'
            }`}></div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setShowDetails(true)}
            className="btn-secondary text-sm"
          >
            View Storage Details
          </button>
          
          <button
            onClick={() => createBackupMutation.mutate('primary')}
            disabled={createBackupMutation.isPending}
            className="btn-primary text-sm"
          >
            {createBackupMutation.isPending ? 'Creating...' : 'Create Backup Now'}
          </button>
          
          <a
            href={exportApi.exportCsv()}
            className="btn-secondary text-sm inline-flex items-center"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Safety Copy
          </a>
          
          <button
            onClick={() => checkIntegrityMutation.mutate()}
            disabled={checkIntegrityMutation.isPending}
            className="btn-secondary text-sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${checkIntegrityMutation.isPending ? 'animate-spin' : ''}`} />
            Check Data Integrity
          </button>
          
          <button
            onClick={() => handleRecover('primary')}
            disabled={recoverMutation.isPending}
            className="btn-danger text-sm"
          >
            Recover Data
          </button>
        </div>

        {/* Status Messages */}
        {checkIntegrityMutation.data && (
          <div className={`mt-4 p-3 rounded-md ${
            checkIntegrityMutation.data.match ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            <p className={`text-sm ${checkIntegrityMutation.data.match ? 'text-green-800' : 'text-red-800'}`}>
              {checkIntegrityMutation.data.match 
                ? `✓ Data integrity verified (${checkIntegrityMutation.data.database_count} records)`
                : `⚠ Integrity check failed: DB has ${checkIntegrityMutation.data.database_count} records, backup has ${checkIntegrityMutation.data.backup_count}`
              }
            </p>
          </div>
        )}
      </Card>

      {/* Details Modal */}
      {showDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Storage Details</h3>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Primary Backup</h4>
                <p className="text-sm text-gray-600">
                  Size: {formatSize(status?.primary_backup_kb || 0)}
                </p>
                <p className="text-sm text-gray-600">
                  Last backup: {formatDate(status?.primary_last_at)}
                </p>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Emergency Backup</h4>
                <p className="text-sm text-gray-600">
                  Size: {formatSize(status?.emergency_backup_kb || 0)}
                </p>
                <p className="text-sm text-gray-600">
                  Last backup: {formatDate(status?.emergency_last_at)}
                </p>
              </div>

              <div className="pt-4 border-t">
                <button
                  onClick={() => createBackupMutation.mutate('emergency')}
                  disabled={createBackupMutation.isPending}
                  className="btn-secondary w-full mb-2"
                >
                  Create Emergency Backup
                </button>
                
                <button
                  onClick={() => handleRecover('emergency')}
                  disabled={recoverMutation.isPending}
                  className="btn-danger w-full"
                >
                  Recover from Emergency Backup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BackupStatus;

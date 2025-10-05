import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Upload, 
  Download, 
  RefreshCw, 
  Trash2,
  Search,
  Calendar,
  Plus,
  Edit2,
  Save,
  X
} from 'lucide-react';
import { useClient } from '../contexts/ClientContext';

interface Record {
  report_date: string;
  registered_onboarded: number;
  linked_accounts: number;
  total_advance_applications: number;
  total_advance_applicants: number;
  total_micro_financing_applications: number;
  total_micro_financing_applicants: number;
  total_personal_finance_application: number;
  total_personal_finance_applicants: number;
  total_bnpl_applications: number;
  total_bnpl_applicants: number;
  notes?: string;
}

const SimpleDataManager: React.FC = () => {
  const { selectedClient } = useClient();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [editingNoteValue, setEditingNoteValue] = useState('');
  
  // Fetch records directly from the API
  const { data: records = [], isLoading, error, refetch } = useQuery({
    queryKey: ['records', selectedClient?.id],
    queryFn: async () => {
      if (!selectedClient?.id) return [];
      
      console.log('Fetching records for client:', selectedClient.id);
      const response = await fetch(`/api/reports?clientId=${selectedClient.id}&limit=1000`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`Failed to fetch records: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Received records:', data);
      return data;
    },
    enabled: !!selectedClient?.id,
    retry: 3,
    retryDelay: 1000,
  });

  // Get stats
  const { data: stats } = useQuery({
    queryKey: ['stats', selectedClient?.id],
    queryFn: async () => {
      if (!selectedClient?.id) return {};
      
      const response = await fetch(`/api/reports/stats?clientId=${selectedClient.id}`);
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    },
    enabled: !!selectedClient?.id,
  });

  // Update note mutation
  const updateNoteMutation = useMutation({
    mutationFn: async ({ date, notes }: { date: string; notes: string }) => {
      const response = await fetch(`/api/reports/${date}/notes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes, clientId: selectedClient?.id }),
      });
      if (!response.ok) throw new Error('Failed to update note');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['records', selectedClient?.id] });
      setEditingNote(null);
      setEditingNoteValue('');
    },
  });

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    if (!selectedClient?.id) {
      alert('Please select a client first');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('clientId', selectedClient.id);

    try {
      const response = await fetch('/api/import', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      
      if (response.ok) {
        alert(`Import successful! ${result.inserted || 0} records imported`);
        refetch();
      } else {
        alert(`Import failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Please try again.');
    }
  };

  // Handle note editing
  const startEditingNote = (date: string, currentNote: string = '') => {
    setEditingNote(date);
    setEditingNoteValue(currentNote);
  };

  const saveNote = () => {
    if (editingNote) {
      updateNoteMutation.mutate({ 
        date: editingNote, 
        notes: editingNoteValue 
      });
    }
  };

  const cancelEditing = () => {
    setEditingNote(null);
    setEditingNoteValue('');
  };

  // Filter records based on search
  const filteredRecords = records.filter((record: Record) => 
    record.report_date.includes(searchTerm) ||
    (record.notes && record.notes.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (!selectedClient) {
    return (
      <div className="p-8 text-center">
        <h3 className="text-xl font-semibold text-gray-600">Please select a client to view records</h3>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Data Records for {selectedClient.name}</h2>
          <p className="text-gray-600">View and manage your financial data records</p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{stats.total_records || 0}</div>
            <div className="text-sm text-gray-600">Total Records</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{stats.total_applications || 0}</div>
            <div className="text-sm text-gray-600">Total Applications</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{stats.total_applicants || 0}</div>
            <div className="text-sm text-gray-600">Total Applicants</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{stats.avg_per_day || 0}</div>
            <div className="text-sm text-gray-600">Avg Per Day</div>
          </div>
        </div>
      )}

      {/* Upload Area */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
        <div className="text-center">
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <div className="mt-4">
            <label className="cursor-pointer">
              <span className="text-lg font-medium text-gray-900">
                Upload CSV or Excel file
              </span>
              <input
                type="file"
                className="hidden"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
              />
            </label>
            <p className="text-gray-600 mt-2">Drag and drop or click to browse</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search records by date or notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Records Table */}
      {isLoading ? (
        <div className="text-center py-8">
          <RefreshCw className="animate-spin mx-auto h-8 w-8 text-gray-400" />
          <p className="mt-2 text-gray-600">Loading records...</p>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-red-600">Error: {(error as Error).message}</p>
          <button 
            onClick={() => refetch()} 
            className="mt-2 text-blue-600 hover:underline"
          >
            Try again
          </button>
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">No records found</p>
          <p className="text-sm text-gray-500">Upload a CSV or Excel file to get started</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registered</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Linked Accounts</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Advance Apps</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Advance Applicants</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Micro Finance Apps</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Micro Finance Applicants</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRecords.map((record: Record) => (
                  <tr key={record.report_date} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {new Date(record.report_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.registered_onboarded || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.linked_accounts || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.total_advance_applications || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.total_advance_applicants || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.total_micro_financing_applications || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.total_micro_financing_applicants || 0}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {editingNote === record.report_date ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editingNoteValue}
                            onChange={(e) => setEditingNoteValue(e.target.value)}
                            className="border border-gray-300 rounded px-2 py-1 text-sm flex-1"
                            placeholder="Add a note..."
                          />
                          <button
                            onClick={saveNote}
                            className="text-green-600 hover:text-green-800"
                            disabled={updateNoteMutation.isPending}
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="flex-1">{record.notes || 'No notes'}</span>
                          <button
                            onClick={() => startEditingNote(record.report_date, record.notes || '')}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="text-sm text-gray-600">
        Showing {filteredRecords.length} of {records.length} records
      </div>
    </div>
  );
};

export default SimpleDataManager;
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Eye, Edit, Save, X, FileText } from 'lucide-react';
import { columnsApi } from '../api/columns';
import { Report } from '../types';

interface DataTableProps {
  data: Report[];
  loading?: boolean;
  onEdit?: (report: Report) => void;
  onView?: (report: Report) => void;
}

const DataTable: React.FC<DataTableProps> = ({ data, loading = false, onEdit, onView }) => {
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [noteValue, setNoteValue] = useState('');
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [selectedRow, setSelectedRow] = useState<Report | null>(null);
  const queryClient = useQueryClient();

  // Update notes mutation
  const updateNotesMutation = useMutation({
    mutationFn: async ({ date, notes }: { date: string; notes: string }) => {
      const response = await fetch(`/api/reports/${date}/notes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes })
      });
      if (!response.ok) throw new Error('Failed to update notes');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      setShowNotesModal(false);
      setSelectedRow(null);
      setNoteValue('');
    }
  });

  const handleEditNotes = (report: Report) => {
    setSelectedRow(report);
    setNoteValue((report as any).notes || '');
    setShowNotesModal(true);
  };

  const handleSaveNotes = () => {
    if (selectedRow) {
      updateNotesMutation.mutate({ 
        date: selectedRow.report_date, 
        notes: noteValue 
      });
    }
  };

  const handleCancelEdit = () => {
    setShowNotesModal(false);
    setSelectedRow(null);
    setNoteValue('');
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="animate-pulse">
          <div className="h-12 bg-gray-50 border-b border-gray-200"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 border-b border-gray-100"></div>
          ))}
        </div>
      </div>
    );
  }

  // Define the specific columns you want to show
  const requiredColumns = [
    'total_advance_applications',
    'total_advance_applicants', 
    'total_micro_financing_applications',
    'total_micro_financing_applicants',
    'total_personal_finance_application',
    'total_personal_finance_applicants',
    'total_bnpl_applications',
    'total_bnpl_applicants'
  ];

  const formatValue = (value: any) => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'number') return value.toLocaleString();
    return value.toString();
  };

  const calculateSum = (columnKey: string) => {
    return data.reduce((sum, row) => {
      const value = (row as any)[columnKey] || 0;
      return sum + (typeof value === 'number' ? value : 0);
    }, 0);
  };

  const totalNumericSum = requiredColumns.reduce((total, col) => {
    return total + calculateSum(col);
  }, 0);

  const avgPerDay = data.length > 0 ? totalNumericSum / data.length : 0;

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="sticky left-0 bg-gray-50 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Advance Applications
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Advance Applicants
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Micro Financing Applications
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Micro Financing Applicants
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Personal Finance Application
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Personal Finance Applicants
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total BNPL Applications
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total BNPL Applicants
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  📝 Notes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.length === 0 ? (
                <tr>
                  <td
                    colSpan={12}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No data available
                  </td>
                </tr>
              ) : (
                data.map((row, index) => (
                  <tr key={row.report_date} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="sticky left-0 bg-inherit px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-r border-gray-200">
                      {row.report_date}
                    </td>
                    {requiredColumns.map(column => (
                      <td
                        key={column}
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                      >
                        {formatValue((row as any)[column])}
                      </td>
                    ))}
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 text-sm text-gray-600 max-w-xs truncate">
                          {(row as any).notes || <span className="text-gray-400 italic">No notes</span>}
                        </div>
                        <button
                          onClick={() => handleEditNotes(row)}
                          className="text-blue-500 hover:text-blue-700 text-sm px-2 py-1 border border-blue-300 rounded hover:bg-blue-50 transition-colors"
                          title="Edit Notes"
                        >
                          📝 Edit
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        {onView && (
                          <button
                            onClick={() => onView(row)}
                            className="text-gray-400 hover:text-gray-600"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        {onEdit && (
                          <button
                            onClick={() => onEdit(row)}
                            className="text-gray-400 hover:text-gray-600"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Footer */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-gray-900">{data.length}</div>
            <div className="text-sm text-gray-600">Total Records</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{totalNumericSum.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Total Sum</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{avgPerDay.toFixed(1)}</div>
            <div className="text-sm text-gray-600">Avg Per Day</div>
          </div>
        </div>
        
        {/* Column-wise totals */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Column Totals</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
            {requiredColumns.map(column => (
              <div key={column} className="flex justify-between">
                <span className="text-gray-600">{column.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</span>
                <span className="font-medium">{calculateSum(column).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Notes Modal */}
      {showNotesModal && selectedRow && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                📝 Edit Notes for {selectedRow.report_date}
              </h3>
              <button
                onClick={handleCancelEdit}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                value={noteValue}
                onChange={(e) => setNoteValue(e.target.value)}
                placeholder="Add your notes here..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={6}
              />
              <div className="text-xs text-gray-500 mt-1">
                {noteValue.length}/500 characters
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 p-4 border-t border-gray-200">
              <button
                onClick={handleCancelEdit}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNotes}
                disabled={updateNotesMutation.isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updateNotesMutation.isLoading ? 'Saving...' : 'Save Notes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;

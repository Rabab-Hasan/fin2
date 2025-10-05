import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, 
  Save, 
  Trash2, 
  Download, 
  Calendar, 
  TrendingUp,
  BarChart3,
  FileSpreadsheet,
  Search,
  RefreshCw
} from 'lucide-react';
import Card from './Card';
import { reportsApi } from '../api/reports';
import { exportApi } from '../api/export';

interface DataEntryInterfaceProps {
  clientId: string;
}

const DataEntryInterface: React.FC<DataEntryInterfaceProps> = ({ clientId }) => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    report_date: new Date().toISOString().split('T')[0],
    total_advance_applications: 0,
    total_advance_applicants: 0,
    total_micro_financing_applications: 0,
    total_micro_financing_applicants: 0,
    total_personal_finance_applications: 0,
    total_personal_finance_applicants: 0,
    total_bnpl_applications: 0,
    total_bnpl_applicants: 0,
    notes: ''
  });

  // Fetch client reports
  const { 
    data: reports = [], 
    isLoading: reportsLoading,
    error: reportsError,
    refetch: refetchReports 
  } = useQuery({
    queryKey: ['client-reports', clientId, selectedMonth],
    queryFn: async () => {
      const params: any = { clientId };
      if (selectedMonth) {
        params.month = selectedMonth;
      }
      return await reportsApi.getReports(params);
    },
    enabled: !!clientId,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const reportData = {
        report_date: data.report_date,
        month_label: new Date(data.report_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        data: {
          total_advance_applications: data.total_advance_applications,
          total_advance_applicants: data.total_advance_applicants,
          total_micro_financing_applications: data.total_micro_financing_applications,
          total_micro_financing_applicants: data.total_micro_financing_applicants,
          total_personal_finance_applications: data.total_personal_finance_applications,
          total_personal_finance_applicants: data.total_personal_finance_applicants,
          total_bnpl_applications: data.total_bnpl_applications,
          total_bnpl_applicants: data.total_bnpl_applicants,
          notes: data.notes
        },
        clientId: clientId
      };
      return await reportsApi.createReport(reportData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-reports', clientId] });
      resetForm();
      setShowForm(false);
    },
    onError: (error) => {
      console.error('Error saving report:', error);
      alert('Error saving report. Please try again.');
    }
  });

  // Clear all data mutation
  const clearAllMutation = useMutation({
    mutationFn: async () => {
      return await reportsApi.clearAll();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-reports', clientId] });
    },
    onError: (error) => {
      console.error('Error clearing reports:', error);
      alert('Error clearing reports. Please try again.');
    }
  });

  // Extract unique months from reports
  const availableMonths = React.useMemo(() => {
    const months = new Set<string>();
    reports.forEach(report => {
      if (report.report_date) {
        const date = new Date(report.report_date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        months.add(monthKey);
      }
    });
    return Array.from(months).sort().reverse();
  }, [reports]);

  // Filter reports based on search term
  const filteredReports = React.useMemo(() => {
    if (!searchTerm) return reports;
    return reports.filter(report => 
      Object.values(report.data || {}).some(value => 
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      ) || report.report_date.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [reports, searchTerm]);

  // Calculate analytics
  const analytics = React.useMemo(() => {
    const totalApplications = reports.reduce((sum, report) => {
      const data = report.data || {};
      return sum + 
        (data.total_advance_applications || 0) + 
        (data.total_micro_financing_applications || 0) + 
        (data.total_personal_finance_applications || 0) + 
        (data.total_bnpl_applications || 0);
    }, 0);
    
    const totalApplicants = reports.reduce((sum, report) => {
      const data = report.data || {};
      return sum + 
        (data.total_advance_applicants || 0) + 
        (data.total_micro_financing_applicants || 0) + 
        (data.total_personal_finance_applicants || 0) + 
        (data.total_bnpl_applicants || 0);
    }, 0);

    const avgApplicationsPerDay = reports.length > 0 ? totalApplications / reports.length : 0;
    
    return {
      totalRecords: reports.length,
      totalApplications,
      totalApplicants,
      avgApplicationsPerDay,
      conversionRate: totalApplications > 0 ? (totalApplicants / totalApplications * 100) : 0
    };
  }, [reports]);

  const resetForm = () => {
    setFormData({
      report_date: new Date().toISOString().split('T')[0],
      total_advance_applications: 0,
      total_advance_applicants: 0,
      total_micro_financing_applications: 0,
      total_micro_financing_applicants: 0,
      total_personal_finance_applications: 0,
      total_personal_finance_applicants: 0,
      total_bnpl_applications: 0,
      total_bnpl_applicants: 0,
      notes: ''
    });
  };

  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to clear ALL data for this client? This action cannot be undone.')) {
      clearAllMutation.mutate();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleInputChange = (field: keyof typeof formData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (reportsError) {
    return (
      <Card>
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <BarChart3 className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Data</h3>
          <p className="text-gray-600 mb-4">There was an error loading the reports data.</p>
          <button onClick={() => refetchReports()} className="btn-primary">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500">Total Records</div>
              <div className="text-2xl font-bold text-gray-900">{analytics.totalRecords}</div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500">Total Applications</div>
              <div className="text-2xl font-bold text-gray-900">{analytics.totalApplications.toLocaleString()}</div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500">Total Applicants</div>
              <div className="text-2xl font-bold text-gray-900">{analytics.totalApplicants.toLocaleString()}</div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-orange-600" />
              </div>
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500">Avg Per Day</div>
              <div className="text-2xl font-bold text-gray-900">{analytics.avgApplicationsPerDay.toFixed(1)}</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search records..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              disabled={reportsLoading}
            >
              <option value="">All Months</option>
              {availableMonths.map(month => (
                <option key={month} value={month}>
                  {new Date(month + '-01').toLocaleDateString('en-US', { 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                resetForm();
                setShowForm(!showForm);
              }}
              className="btn-primary inline-flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Record
            </button>
            
            <a
              href={`${exportApi.exportCsv()}?clientId=${clientId}`}
              className="btn-secondary inline-flex items-center"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </a>
            
            <button
              onClick={handleClearAll}
              className="btn-danger inline-flex items-center"
              disabled={clearAllMutation.isPending}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All
            </button>
            
            <button
              onClick={() => refetchReports()}
              className="btn-secondary inline-flex items-center"
              disabled={reportsLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${reportsLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </Card>

      {/* Data Entry Form */}
      {showForm && (
        <Card>
          <div className="border-l-4 border-blue-500 pl-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Add New Record
            </h3>
            <p className="text-sm text-gray-600">
              Enter financial data for the selected date
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Report Date
                </label>
                <input
                  type="date"
                  value={formData.report_date}
                  onChange={(e) => handleInputChange('report_date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Advance Applications
                </label>
                <input
                  type="number"
                  value={formData.total_advance_applications}
                  onChange={(e) => handleInputChange('total_advance_applications', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Advance Applicants
                </label>
                <input
                  type="number"
                  value={formData.total_advance_applicants}
                  onChange={(e) => handleInputChange('total_advance_applicants', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Micro Financing Applications
                </label>
                <input
                  type="number"
                  value={formData.total_micro_financing_applications}
                  onChange={(e) => handleInputChange('total_micro_financing_applications', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Micro Financing Applicants
                </label>
                <input
                  type="number"
                  value={formData.total_micro_financing_applicants}
                  onChange={(e) => handleInputChange('total_micro_financing_applicants', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Personal Finance Applications
                </label>
                <input
                  type="number"
                  value={formData.total_personal_finance_applications}
                  onChange={(e) => handleInputChange('total_personal_finance_applications', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Personal Finance Applicants
                </label>
                <input
                  type="number"
                  value={formData.total_personal_finance_applicants}
                  onChange={(e) => handleInputChange('total_personal_finance_applicants', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  BNPL Applications
                </label>
                <input
                  type="number"
                  value={formData.total_bnpl_applications}
                  onChange={(e) => handleInputChange('total_bnpl_applications', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  BNPL Applicants
                </label>
                <input
                  type="number"
                  value={formData.total_bnpl_applicants}
                  onChange={(e) => handleInputChange('total_bnpl_applicants', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Add any additional notes or observations..."
              />
            </div>
            
            <div className="flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="btn-primary inline-flex items-center"
              >
                <Save className="w-4 h-4 mr-2" />
                {createMutation.isPending ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </Card>
      )}

      {/* Data Table */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Financial Records
          </h3>
          <div className="text-sm text-gray-600">
            {filteredReports.length} record{filteredReports.length !== 1 ? 's' : ''} found
            {selectedMonth && ` for ${new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`}
          </div>
        </div>
        
        {reportsLoading ? (
          <div className="text-center py-8">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">Loading records...</p>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="text-center py-12">
            <FileSpreadsheet className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No Records Found</h4>
            <p className="text-gray-600 mb-4">
              {searchTerm || selectedMonth 
                ? "No records match your current filters."
                : "Start by adding your first financial record."
              }
            </p>
            {!searchTerm && !selectedMonth && (
              <button
                onClick={() => {
                  resetForm();
                  setShowForm(true);
                }}
                className="btn-primary inline-flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add First Record
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Advance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Micro Finance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Personal Finance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    BNPL
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReports.map((report, index) => {
                  const data = report.data || {};
                  return (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {new Date(report.report_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="text-xs text-gray-500">Apps: {data.total_advance_applications || 0}</div>
                        <div className="text-xs text-gray-500">Applicants: {data.total_advance_applicants || 0}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="text-xs text-gray-500">Apps: {data.total_micro_financing_applications || 0}</div>
                        <div className="text-xs text-gray-500">Applicants: {data.total_micro_financing_applicants || 0}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="text-xs text-gray-500">Apps: {data.total_personal_finance_applications || 0}</div>
                        <div className="text-xs text-gray-500">Applicants: {data.total_personal_finance_applicants || 0}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="text-xs text-gray-500">Apps: {data.total_bnpl_applications || 0}</div>
                        <div className="text-xs text-gray-500">Applicants: {data.total_bnpl_applicants || 0}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                        {data.notes || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Summary Statistics */}
      {filteredReports.length > 0 && (
        <Card>
          <h4 className="text-md font-semibold text-gray-900 mb-4">Summary Statistics</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-blue-800">Total Advance</div>
              <div className="text-lg font-bold text-blue-900">
                Apps: {filteredReports.reduce((sum, r) => sum + ((r.data?.total_advance_applications) || 0), 0)}
              </div>
              <div className="text-lg font-bold text-blue-900">
                Applicants: {filteredReports.reduce((sum, r) => sum + ((r.data?.total_advance_applicants) || 0), 0)}
              </div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-green-800">Total Micro Finance</div>
              <div className="text-lg font-bold text-green-900">
                Apps: {filteredReports.reduce((sum, r) => sum + ((r.data?.total_micro_financing_applications) || 0), 0)}
              </div>
              <div className="text-lg font-bold text-green-900">
                Applicants: {filteredReports.reduce((sum, r) => sum + ((r.data?.total_micro_financing_applicants) || 0), 0)}
              </div>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-purple-800">Total Personal Finance</div>
              <div className="text-lg font-bold text-purple-900">
                Apps: {filteredReports.reduce((sum, r) => sum + ((r.data?.total_personal_finance_applications) || 0), 0)}
              </div>
              <div className="text-lg font-bold text-purple-900">
                Applicants: {filteredReports.reduce((sum, r) => sum + ((r.data?.total_personal_finance_applicants) || 0), 0)}
              </div>
            </div>
            
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-orange-800">Total BNPL</div>
              <div className="text-lg font-bold text-orange-900">
                Apps: {filteredReports.reduce((sum, r) => sum + ((r.data?.total_bnpl_applications) || 0), 0)}
              </div>
              <div className="text-lg font-bold text-orange-900">
                Applicants: {filteredReports.reduce((sum, r) => sum + ((r.data?.total_bnpl_applicants) || 0), 0)}
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default DataEntryInterface;
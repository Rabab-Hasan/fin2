import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Users, TrendingUp, Database } from 'lucide-react';
import Card from './Card';
import { useClient } from '../contexts/ClientContext';

const API_BASE = process.env.REACT_APP_API_URL || 'https://fin2-4.onrender.com';interface ImportedRecord {
  report_date: string;
  registered_onboarded: number;
  linked_accounts: number;
  total_advance_applications: number;
  total_advance_applicants: number;
  total_micro_financing_applications: number;
  total_micro_financing_applicants: number;
  total_personal_finance_application: number;
  total_personal_finance_applicants: number;
  total_bnpl_applications?: number;
  total_bnpl_applicants?: number;
  created_at: string;
  updated_at: string;
}

const ImportedDataTable: React.FC = () => {
  const { selectedClient } = useClient();
  
  const { data: reports, isLoading, error, refetch } = useQuery({
    queryKey: ['imported-reports', selectedClient?.id],
    queryFn: async () => {
      if (!selectedClient) return [];
      
      const response = await fetch(`${API_BASE}/api/reports?clientId=${selectedClient.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch reports');
      }
      return response.json();
    },
    enabled: !!selectedClient,
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  if (!selectedClient) {
    return (
      <Card>
        <div className="text-center py-8">
          <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">Please select a client</p>
          <p className="text-sm text-gray-500">Choose a client to view their imported data</p>
        </div>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return null;
  }

  if (!reports || reports.length === 0) {
    return (
      <Card>
        <div className="text-center py-8">
          <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">No imported data found</p>
          <p className="text-sm text-gray-500">Import an Excel file to see data here</p>
        </div>
      </Card>
    );
  }

  const formatNumber = (value: number | null | undefined): string => {
    return value ? value.toLocaleString() : '0';
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };

  // Calculate totals
  const totals = reports.reduce((acc, record) => ({
    registered_onboarded: acc.registered_onboarded + (record.registered_onboarded || 0),
    linked_accounts: acc.linked_accounts + (record.linked_accounts || 0),
    total_advance_applications: acc.total_advance_applications + (record.total_advance_applications || 0),
    total_advance_applicants: acc.total_advance_applicants + (record.total_advance_applicants || 0),
    total_micro_financing_applications: acc.total_micro_financing_applications + (record.total_micro_financing_applications || 0),
    total_micro_financing_applicants: acc.total_micro_financing_applicants + (record.total_micro_financing_applicants || 0),
    total_personal_finance_application: acc.total_personal_finance_application + (record.total_personal_finance_application || 0),
    total_personal_finance_applicants: acc.total_personal_finance_applicants + (record.total_personal_finance_applicants || 0),
    total_bnpl_applications: (acc.total_bnpl_applications || 0) + (record.total_bnpl_applications || 0),
    total_bnpl_applicants: (acc.total_bnpl_applicants || 0) + (record.total_bnpl_applicants || 0),
  }), {
    registered_onboarded: 0,
    linked_accounts: 0,
    total_advance_applications: 0,
    total_advance_applicants: 0,
    total_micro_financing_applications: 0,
    total_micro_financing_applicants: 0,
    total_personal_finance_application: 0,
    total_personal_finance_applicants: 0,
    total_bnpl_applications: 0,
    total_bnpl_applicants: 0,
  });

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Records</p>
              <p className="text-2xl font-bold text-gray-900">{reports.length}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Registered</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(totals.registered_onboarded)}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Linked Accounts</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(totals.linked_accounts)}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-orange-100">
              <Database className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Applications</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(totals.total_advance_applications + totals.total_micro_financing_applications + totals.total_personal_finance_application)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Data Table */}
  <Card style={{width: '100vw', maxWidth: '100vw', minWidth: 0, marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)'}}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Imported Financial Data</h3>
          <button
            onClick={() => refetch()}
            className="btn-secondary text-sm"
          >
            Refresh
          </button>
        </div>

        <div className="overflow-x-auto" style={{width: '100vw', minWidth: 0}}>
          <table className="min-w-full divide-y divide-gray-200" style={{width: '100vw', minWidth: '1400px'}}>
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Registered
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Linked Accounts
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Advance Apps
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Advance Applicants
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Micro Finance Apps
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Micro Finance Applicants
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Personal Finance Apps
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Personal Finance Applicants
                </th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24" style={{width: '80px'}}>
                  Total BNPL Applications
                </th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24" style={{width: '80px'}}>
                  Total BNPL Applicants
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reports.map((record: ImportedRecord, index: number) => (
                <tr key={`${record.report_date}-${index}`} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatDate(record.report_date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatNumber(record.registered_onboarded)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatNumber(record.linked_accounts)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatNumber(record.total_advance_applications)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatNumber(record.total_advance_applicants)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatNumber(record.total_micro_financing_applications)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatNumber(record.total_micro_financing_applicants)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatNumber(record.total_personal_finance_application)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatNumber(record.total_personal_finance_applicants)}
                  </td>
                  <td className="px-2 py-4 whitespace-nowrap text-sm text-gray-500 w-24" style={{width: '80px'}}>
                    {formatNumber(record.total_bnpl_applications)}
                  </td>
                  <td className="px-2 py-4 whitespace-nowrap text-sm text-gray-500 w-24" style={{width: '80px'}}>
                    {formatNumber(record.total_bnpl_applicants)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary Row */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="bg-blue-50 p-3 rounded">
              <p className="font-medium text-blue-900">Total Registered</p>
              <p className="text-xl font-bold text-blue-600">{formatNumber(totals.registered_onboarded)}</p>
            </div>
            <div className="bg-green-50 p-3 rounded">
              <p className="font-medium text-green-900">Total Linked</p>
              <p className="text-xl font-bold text-green-600">{formatNumber(totals.linked_accounts)}</p>
            </div>
            <div className="bg-purple-50 p-3 rounded">
              <p className="font-medium text-purple-900">Total Advance Apps</p>
              <p className="text-xl font-bold text-purple-600">{formatNumber(totals.total_advance_applications)}</p>
            </div>
            <div className="bg-orange-50 p-3 rounded">
              <p className="font-medium text-orange-900">Total Micro Finance Apps</p>
              <p className="text-xl font-bold text-orange-600">{formatNumber(totals.total_micro_financing_applications)}</p>
            </div>
            <div className="bg-yellow-50 p-3 rounded">
              <p className="font-medium text-yellow-900">Total BNPL Apps</p>
              <p className="text-xl font-bold text-yellow-600">{formatNumber(totals.total_bnpl_applications)}</p>
            </div>
            <div className="bg-yellow-100 p-3 rounded">
              <p className="font-medium text-yellow-900">Total BNPL Applicants</p>
              <p className="text-xl font-bold text-yellow-700">{formatNumber(totals.total_bnpl_applicants)}</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ImportedDataTable;

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { reportsApi } from '../api/reports';
import StatCard from '../components/StatCard';
import BackupStatus from '../components/BackupStatus';
import Card from '../components/Card';
import ClientSelector from '../components/ClientSelector';
import { useClient } from '../contexts/ClientContext';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { selectedClient } = useClient();
  
  const { data: stats, isLoading } = useQuery({
    queryKey: ['stats', selectedClient?.id],
    queryFn: () => selectedClient ? reportsApi.getStats(selectedClient.id) : Promise.resolve(null),
    enabled: !!selectedClient,
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <Card className="mb-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Welcome to Your Finance Dashboard
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-6">
            Comprehensive business data management and analytics platform. 
            Import, analyze, and track your financial metrics with advanced 
            backup and recovery capabilities.
          </p>
          
          {/* Client Selection */}
          <div className="max-w-md mx-auto">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Client to Continue
            </label>
            <ClientSelector />
            {!selectedClient && (
              <p className="text-sm text-gray-500 mt-2">
                Please select a client to access your dashboard data
              </p>
            )}
          </div>
        </div>
      </Card>

      {!selectedClient ? (
        <Card>
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <ArrowRight className="w-8 h-8 text-gray-400 rotate-90" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Client Selection Required
            </h3>
            <p className="text-gray-600">
              Choose a client from the dropdown above to view their dashboard data, 
              access business metrics, and manage their information.
            </p>
          </div>
        </Card>
      ) : (
        <>
          {/* Dashboard Overview */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Dashboard Overview - {selectedClient.name}
              </h2>
              <div className="text-sm text-gray-500">
                {selectedClient.company && `${selectedClient.company} • `}
                Client ID: {selectedClient.id}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard
                title="Total Records"
                value={stats?.total_records || 0}
                subtitle="Data entries in system"
                loading={isLoading}
              />
              <StatCard
                title="Months Tracked"
                value={stats?.months_tracked || 0}
                subtitle="Historical coverage"
                loading={isLoading}
              />
              <StatCard
                title="Strategic Notes"
                value={stats?.notes_count || 0}
                subtitle="Entries with insights"
                loading={isLoading}
              />
            </div>
          </div>

          {/* Primary CTA Buttons */}
          <Card className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => navigate('/business')}
                className="flex items-center justify-between p-6 bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-lg transition-colors group"
              >
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-primary-900 mb-1">
                    Access Business Data
                  </h3>
                  <p className="text-primary-700">
                    Import files, manage entries, and view business metrics for {selectedClient.name}
                  </p>
                </div>
                <ArrowRight className="w-6 h-6 text-primary-600 group-hover:text-primary-800 transition-colors" />
              </button>

              <button
                onClick={() => navigate('/labs')}
                className="flex items-center justify-between p-6 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors group"
              >
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    Launch Action Labs
                  </h3>
                  <p className="text-gray-700">
                    Advanced analytics, data visualization, and strategic insights for {selectedClient.name}
                  </p>
                </div>
                <ArrowRight className="w-6 h-6 text-gray-600 group-hover:text-gray-800 transition-colors" />
              </button>
            </div>
          </Card>

          {/* Data Persistence Status */}
          <BackupStatus />
        </>
      )}
    </div>
  );
};

export default Home;

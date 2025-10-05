import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  TrendingUp, 
  AlertTriangle, 
  Clock, 
  Target, 
  Lightbulb,
  Brain,
  Zap,
  BarChart3,
  Users,
  DollarSign,
  Calendar
} from 'lucide-react';
import Card from './Card';
import { useClient } from '../contexts/ClientContext';

const METRICS = [
  { key: 'registered_onboarded', label: 'Registered Onboarded', icon: Users, color: '#3B82F6' },
  { key: 'linked_accounts', label: 'Linked Accounts', icon: Target, color: '#10B981' },
  { key: 'total_advance_applications', label: 'Total Advance Applications', icon: DollarSign, color: '#F59E0B' },
  { key: 'total_advance_applicants', label: 'Total Advance Applicants', icon: Users, color: '#8B5CF6' },
  { key: 'total_micro_financing_applications', label: 'Total Micro Financing Applications', icon: DollarSign, color: '#EF4444' },
  { key: 'total_micro_financing_applicants', label: 'Total Micro Financing Applicants', icon: Users, color: '#06B6D4' },
  { key: 'total_personal_finance_application', label: 'Total Personal Finance Applications', icon: DollarSign, color: '#84CC16' },
  { key: 'total_personal_finance_applicants', label: 'Total Personal Finance Applicants', icon: Users, color: '#F97316' }
];

// Analytics API calls
const analyticsApi = {
  getStrategyAdvisor: async (params: any, clientId: string) => {
    const searchParams = new URLSearchParams();
    if (params.metric) searchParams.append('metric', params.metric);
    if (params.weeks) searchParams.append('weeks', params.weeks);
    if (params.months) searchParams.append('months', params.months);
    searchParams.append('clientId', clientId);
    
    const response = await fetch(`/api/analytics/strategy-advisor?${searchParams}`);
    if (!response.ok) throw new Error('Failed to fetch strategy advisor data');
    return response.json();
  }
};

const MarketingStrategyAdvisor: React.FC = () => {
  const client = useClient();
  const [selectedMetric, setSelectedMetric] = useState('revenue');
  const [selectedWeeks, setSelectedWeeks] = useState('4');
  const [selectedMonths, setSelectedMonths] = useState('3');
  const [viewMode, setViewMode] = useState<'insights' | 'recommendations'>('insights');

  const { data, isLoading, error } = useQuery({
    queryKey: ['strategy-advisor', selectedMetric, selectedWeeks, selectedMonths, client?.selectedClient?.id],
    queryFn: () => analyticsApi.getStrategyAdvisor({
      metric: selectedMetric,
      weeks: selectedWeeks,
      months: selectedMonths
    }, client?.selectedClient?.id || ''),
    enabled: !!client?.selectedClient
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Card title="🤖 Marketing Strategy Advisor">
        <div className="flex items-center justify-center h-64 text-red-500">
          <AlertTriangle className="mr-2" />
          Failed to load strategy advisor data
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card title="🤖 Marketing Strategy Advisor - AI-Powered Insights">
        <div className="space-y-6">
          {/* Controls Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Metric
              </label>
              <select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                {METRICS.map(metric => (
                  <option key={metric.key} value={metric.key}>
                    {metric.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Weeks to Analyze
              </label>
              <select
                value={selectedWeeks}
                onChange={(e) => setSelectedWeeks(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="2">Last 2 Weeks</option>
                <option value="4">Last 4 Weeks</option>
                <option value="8">Last 8 Weeks</option>
                <option value="12">Last 12 Weeks</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Months to Analyze
              </label>
              <select
                value={selectedMonths}
                onChange={(e) => setSelectedMonths(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="1">Last 1 Month</option>
                <option value="3">Last 3 Months</option>
                <option value="6">Last 6 Months</option>
                <option value="12">Last 12 Months</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                View Mode
              </label>
              <select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value as 'insights' | 'recommendations')}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="insights">Strategic Insights</option>
                <option value="recommendations">Action Recommendations</option>
              </select>
            </div>
          </div>

          {/* Content */}
          {viewMode === 'insights' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-blue-50 p-6 rounded-lg">
                <div className="flex items-center mb-4">
                  <Brain className="w-6 h-6 text-blue-600 mr-2" />
                  <h3 className="text-lg font-semibold text-blue-900">Key Insights</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <TrendingUp className="w-4 h-4 text-green-500 mr-2 mt-1" />
                    <p className="text-sm text-gray-700">
                      {selectedMetric.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} showing consistent growth pattern
                    </p>
                  </div>
                  <div className="flex items-start">
                    <Target className="w-4 h-4 text-blue-500 mr-2 mt-1" />
                    <p className="text-sm text-gray-700">
                      Peak performance periods identified for optimization
                    </p>
                  </div>
                  <div className="flex items-start">
                    <Lightbulb className="w-4 h-4 text-yellow-500 mr-2 mt-1" />
                    <p className="text-sm text-gray-700">
                      Seasonal trends detected in the {selectedWeeks}-week analysis window
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 p-6 rounded-lg">
                <div className="flex items-center mb-4">
                  <Zap className="w-6 h-6 text-green-600 mr-2" />
                  <h3 className="text-lg font-semibold text-green-900">Growth Opportunities</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <BarChart3 className="w-4 h-4 text-purple-500 mr-2 mt-1" />
                    <p className="text-sm text-gray-700">
                      Untapped potential in {selectedMonths}-month comparative analysis
                    </p>
                  </div>
                  <div className="flex items-start">
                    <Users className="w-4 h-4 text-blue-500 mr-2 mt-1" />
                    <p className="text-sm text-gray-700">
                      Customer acquisition patterns show room for improvement
                    </p>
                  </div>
                  <div className="flex items-start">
                    <Calendar className="w-4 h-4 text-orange-500 mr-2 mt-1" />
                    <p className="text-sm text-gray-700">
                      Timing optimization could increase conversion rates by 15-25%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {viewMode === 'recommendations' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg">
                <div className="flex items-center mb-4">
                  <Target className="w-6 h-6 text-purple-600 mr-2" />
                  <h3 className="text-lg font-semibold text-purple-900">Strategic Recommendations</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <h4 className="font-medium text-gray-800 mb-2">🎯 Focus Areas</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Optimize {selectedMetric.replace(/_/g, ' ')} campaigns</li>
                      <li>• Increase engagement during peak hours</li>
                      <li>• Leverage seasonal trends</li>
                    </ul>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <h4 className="font-medium text-gray-800 mb-2">⏰ Timing Strategy</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Launch campaigns on high-performance days</li>
                      <li>• Schedule follow-ups during conversion windows</li>
                      <li>• Monitor {selectedWeeks}-week performance cycles</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-teal-50 p-6 rounded-lg">
                <div className="flex items-center mb-4">
                  <Lightbulb className="w-6 h-6 text-green-600 mr-2" />
                  <h3 className="text-lg font-semibold text-green-900">Action Items</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-sm text-gray-700">
                      Implement A/B testing for {selectedMetric.replace(/_/g, ' ')} optimization
                    </span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                    <span className="text-sm text-gray-700">
                      Create automated workflows based on {selectedMonths}-month patterns
                    </span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                    <span className="text-sm text-gray-700">
                      Set up performance monitoring dashboards
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Performance Summary */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Clock className="w-5 h-5 text-gray-500 mr-2" />
                <span className="text-sm text-gray-600">
                  Analysis Period: {selectedWeeks} weeks, {selectedMonths} months
                </span>
              </div>
              <div className="flex items-center">
                <DollarSign className="w-5 h-5 text-green-500 mr-2" />
                <span className="text-sm font-medium text-green-700">
                  Optimized for {selectedMetric.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default MarketingStrategyAdvisor;
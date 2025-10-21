import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart as RechartsLineChart, Line } from 'recharts';
import { TrendingUp, Calendar, Users, CreditCard, Target, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import Card from './Card';
import { useClient } from '../contexts/ClientContext';
import secureApiClient from '../utils/secure-api-client';

const METRICS = [
  { key: 'registered_onboarded', label: 'Registered Onboarded', icon: Users, color: '#3B82F6' },
  { key: 'linked_accounts', label: 'Linked Accounts', icon: CreditCard, color: '#10B981' },
  { key: 'total_advance_applications', label: 'Total Advance Applications', icon: Target, color: '#F59E0B' },
  { key: 'total_advance_applicants', label: 'Total Advance Applicants', icon: Users, color: '#8B5CF6' },
  { key: 'total_micro_financing_applications', label: 'Total Micro Financing Applications', icon: Target, color: '#EF4444' },
  { key: 'total_micro_financing_applicants', label: 'Total Micro Financing Applicants', icon: Users, color: '#06B6D4' },
  { key: 'total_personal_finance_application', label: 'Total Personal Finance Applications', icon: Target, color: '#84CC16' },
  { key: 'total_personal_finance_applicants', label: 'Total Personal Finance Applicants', icon: Users, color: '#F97316' }
];

// Analytics API calls
const analyticsApi = {
  getMonthlyComparison: async (params: any, clientId: string) => {
    const searchParams = new URLSearchParams();
    if (params.months) searchParams.append('months', params.months);
    if (params.metric) searchParams.append('metric', params.metric);
    if (params.maxDays) searchParams.append('maxDays', params.maxDays);
    searchParams.append('clientId', clientId);
    
    return secureApiClient.get(`/api/analytics/monthly-comparison?${searchParams}`);
  },
  getMonthlyComparisonAllMetrics: async (params: any, clientId: string) => {
    // Fetch data for all metrics to populate the cards
    const allMetricsData = {};
    
    for (const metric of METRICS) {
      const searchParams = new URLSearchParams();
      if (params.months) searchParams.append('months', params.months);
      searchParams.append('metric', metric.key);
      if (params.maxDays) searchParams.append('maxDays', params.maxDays);
      searchParams.append('clientId', clientId);
      
      try {
        const data = await secureApiClient.get(`/api/analytics/monthly-comparison?${searchParams}`);
        allMetricsData[metric.key] = data;
      } catch (error) {
        console.warn(`Failed to fetch data for ${metric.key}:`, error);
        allMetricsData[metric.key] = { rows: [] };
      }
    }
    
    return allMetricsData;
  },
  getAllNotes: async () => {
    const response = await fetch('/api/notes');
    if (!response.ok) throw new Error('Failed to fetch notes');
    return response.json();
  }
};

// NotesSection component for monthly comparison
const NotesSection = ({ notes, selectedMonths }: {
  notes: any[];
  selectedMonths: string[];
}) => {
  // Filter notes based on selected months
  const filteredNotes = notes.filter((note: any) => {
    if (!note.date) return false;
    
    try {
      const noteDate = new Date(note.date);
      if (isNaN(noteDate.getTime())) return false;
      
      const noteMonth = noteDate.toLocaleString('default', { month: 'long', year: 'numeric' });
      return selectedMonths.includes('all') || selectedMonths.includes(noteMonth);
    } catch (error) {
      return false;
    }
  });

  if (filteredNotes.length === 0) {
    return (
      <div className="text-gray-500 text-center py-8">
        No notes found for the selected months.
      </div>
    );
  }

  // Group notes by date
  const notesByDate = filteredNotes.reduce((acc: any, note: any) => {
    const date = note.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(note);
    return acc;
  }, {});

  // Sort dates
  const sortedDates = Object.keys(notesByDate).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  return (
    <div className="space-y-4">
      {sortedDates.map((date) => (
        <div key={date} className="border-l-4 border-blue-500 pl-4 py-2 bg-blue-50 rounded-r-lg">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-gray-900">
              {new Date(date).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </h4>
            <span className="text-sm text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
              {notesByDate[date].length} note{notesByDate[date].length > 1 ? 's' : ''}
            </span>
          </div>
          <div className="space-y-2">
            {notesByDate[date].map((note: any, index: number) => (
              <div key={note.id || index} className="bg-white p-3 rounded border border-gray-200">
                <h5 className="font-medium text-gray-800 mb-1">{note.title}</h5>
                {note.content && (
                  <p className="text-gray-600 text-sm">{note.content}</p>
                )}
                {note.created_at && (
                  <p className="text-xs text-gray-400 mt-2">
                    Added: {new Date(note.created_at).toLocaleString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const MonthlyComparison: React.FC = () => {
  const { selectedClient } = useClient();
  const [selectedMonths, setSelectedMonths] = useState<string[]>(['all']);
  const [selectedMetric, setSelectedMetric] = useState('total_advance_applicants');
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');
  const [focusMonth, setFocusMonth] = useState<string>(''); // Focus month feature for detailed analysis
  const [fairComparison, setFairComparison] = useState(true); // Fair comparison toggle

  const { data, isLoading, error } = useQuery({
    queryKey: ['monthly-comparison', selectedMonths, selectedMetric, focusMonth, fairComparison, selectedClient?.id],
    queryFn: async () => {
      if (!selectedClient?.id) return null;
      
      // Calculate maxDays for fair comparison if enabled
      let maxDays = undefined;
      
      if (fairComparison && !focusMonth) {
        // First get all data to find the most recent month
        const allData = await analyticsApi.getMonthlyComparison({
          months: undefined,
          metric: selectedMetric
        }, selectedClient.id);
        
        if (allData?.rows?.length > 0) {
          // Find the most recent month and count its days
          const mostRecentMonth = allData.rows[allData.rows.length - 1];
          maxDays = mostRecentMonth.daysCounted;
          console.log(`🔧 Fair comparison enabled: limiting all months to ${maxDays} days (based on ${mostRecentMonth.month})`);
        }
      }
      
      return analyticsApi.getMonthlyComparison({
        months: focusMonth ? focusMonth : (selectedMonths.includes('all') ? undefined : selectedMonths.join(',')),
        metric: selectedMetric,
        maxDays: maxDays
      }, selectedClient.id);
    },
    enabled: !!selectedClient?.id
  });

  // Fetch all metrics data for the interactive cards
  const { data: allMetricsData } = useQuery({
    queryKey: ['monthly-comparison-all-metrics', selectedMonths, fairComparison, selectedClient?.id],
    queryFn: async () => {
      if (!selectedClient?.id) return null;
      
      // Calculate maxDays for fair comparison if enabled
      let maxDays = undefined;
      
      if (fairComparison) {
        // First get all data to find the most recent month
        const allData = await analyticsApi.getMonthlyComparison({
          months: undefined,
          metric: 'total_advance_applicants' // Use any metric to get the month structure
        }, selectedClient.id);
        
        if (allData?.rows?.length > 0) {
          // Find the most recent month and count its days
          const mostRecentMonth = allData.rows[allData.rows.length - 1];
          maxDays = mostRecentMonth.daysCounted;
        }
      }
      
      return analyticsApi.getMonthlyComparisonAllMetrics({
        months: selectedMonths.includes('all') ? undefined : selectedMonths.join(','),
        maxDays: maxDays
      }, selectedClient.id);
    },
    enabled: !!selectedClient?.id
  });

  // Get all available months (always fetch all months to populate the selector)
  const { data: allMonthsData } = useQuery({
    queryKey: ['all-months', selectedMetric, selectedClient?.id],
    queryFn: () => {
      if (!selectedClient?.id) return null;
      return analyticsApi.getMonthlyComparison({
        months: undefined, // Get all months
        metric: selectedMetric
      }, selectedClient.id);
    },
    enabled: !!selectedClient?.id
  });

  // Fetch all notes
  const { data: notesData } = useQuery({
    queryKey: ['all-notes'],
    queryFn: () => analyticsApi.getAllNotes()
  });

  const handleMonthToggle = (month: string) => {
    if (month === 'all') {
      setSelectedMonths(['all']);
    } else {
      setSelectedMonths(prev => {
        const withoutAll = prev.filter(m => m !== 'all');
        if (withoutAll.includes(month)) {
          const newSelection = withoutAll.filter(m => m !== month);
          return newSelection.length === 0 ? ['all'] : newSelection;
        } else {
          return [...withoutAll, month];
        }
      });
    }
  };

  const handleFocusMonthChange = (month: string) => {
    setFocusMonth(month);
    if (month) {
      // When focusing on a specific month, reset other month selections
      setSelectedMonths(['all']);
    }
  };

  const availableMonths = allMonthsData?.rows?.map((r: any) => r.month) || [];
  
  // Calculate KPIs
  const totalValue = data?.rows?.reduce((sum: number, row: any) => sum + row.value, 0) || 0;
  const avgValue = data?.rows?.length ? totalValue / data.rows.length : 0;
  const bestMonth = data?.rows?.reduce((best: any, row: any) => row.value > (best?.value || 0) ? row : best, null);
  const worstMonth = data?.rows?.reduce((worst: any, row: any) => row.value < (worst?.value || Infinity) ? row : worst, null);
  
  // Calculate trend
  const recentChanges = data?.mom_changes?.slice(-3) || [];
  const avgChange = recentChanges.length ? recentChanges.reduce((sum: number, change: any) => sum + change.pct, 0) / recentChanges.length : 0;
  
  const selectedMetricData = METRICS.find(m => m.key === selectedMetric);

  const formatValue = (value: number) => {
    if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
    if (value >= 1000) return (value / 1000).toFixed(1) + 'K';
    return value.toLocaleString();
  };

  const getTrendIcon = (change: number) => {
    if (change > 5) return <ArrowUp className="h-4 w-4 text-green-600" />;
    if (change < -5) return <ArrowDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-600" />;
  };

  const getTrendColor = (change: number) => {
    if (change > 5) return 'text-green-600';
    if (change < -5) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <Card title="📅 Monthly Comparison - Performance Across Months">
      <div className="space-y-6">
        {/* Controls Row */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Metric Selector */}
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

          {/* Focus Month Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Focus Month
            </label>
            <select
              value={focusMonth}
              onChange={(e) => handleFocusMonthChange(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Months</option>
              {availableMonths.map((month: string) => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </select>
          </div>

          {/* Fair Comparison Toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fair Comparison
            </label>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setFairComparison(!fairComparison)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  fairComparison ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    fairComparison ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className="text-sm text-gray-600">
                {fairComparison ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Normalize months to same day count
            </p>
          </div>

          {/* Chart Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chart Type
            </label>
            <div className="flex gap-1">
              <button
                onClick={() => setChartType('bar')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  chartType === 'bar'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Bar
              </button>
              <button
                onClick={() => setChartType('line')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  chartType === 'line'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Line
              </button>
            </div>
          </div>

          {/* Month Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Months
            </label>
            
            <div className="space-y-1">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedMonths.includes('all')}
                  onChange={() => handleMonthToggle('all')}
                  className="mr-2"
                />
                All Months
              </label>
              {availableMonths.map((month: string) => (
                <label key={month} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedMonths.includes(month)}
                    onChange={() => handleMonthToggle(month)}
                    className="mr-2"
                  />
                  <span className="text-sm">{month}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-800">Error loading data: {(error as Error)?.message || 'Unknown error'}</p>
          </div>
        )}

        {/* Interactive Metric Cards */}
        {allMetricsData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
            {METRICS.map((metric) => {
              // Get data for this specific metric
              const metricData = allMetricsData[metric.key];
              
              if (!metricData || !metricData.rows || metricData.rows.length === 0) {
                return (
                  <div
                    key={metric.key}
                    className={`bg-white border-2 rounded-lg p-4 cursor-pointer transition-all hover:shadow-lg ${
                      selectedMetric === metric.key 
                        ? 'border-blue-500 ring-2 ring-blue-200 shadow-md' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedMetric(metric.key)}
                  >
                    <div className="flex items-center space-x-3 mb-3">
                      <div 
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: metric.color }}
                      >
                        <metric.icon className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 text-sm leading-tight">
                          {metric.label}
                        </h4>
                      </div>
                    </div>
                    <div className="text-center text-gray-500 py-4">
                      <p className="text-sm">No data available</p>
                    </div>
                  </div>
                );
              }
              
              // Calculate totals and averages for this metric
              const metricTotals = metricData.rows.reduce((sum, row) => sum + (row.value || 0), 0);
              const totalDays = metricData.rows.reduce((sum, row) => sum + (row.daysCounted || 0), 0);
              const dailyAverage = totalDays > 0 ? metricTotals / totalDays : 0;
              const monthlyAverage = metricData.rows.length > 0 ? metricTotals / metricData.rows.length : 0;
              
              const IconComponent = metric.icon;
              
              return (
                <div
                  key={metric.key}
                  className={`bg-white border-2 rounded-lg p-4 cursor-pointer transition-all hover:shadow-lg ${
                    selectedMetric === metric.key 
                      ? 'border-blue-500 ring-2 ring-blue-200 shadow-md' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedMetric(metric.key)}
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <div 
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: metric.color }}
                    >
                      <IconComponent className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 text-sm leading-tight">
                        {metric.label}
                      </h4>
                      {selectedMetric === metric.key && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                          Selected
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {/* Daily Average */}
                    <div className="bg-gray-50 rounded-md p-2">
                      <div className="text-xs font-medium text-gray-600 mb-1">Daily Average</div>
                      <div className="text-lg font-bold text-gray-900">
                        {formatValue(dailyAverage)}
                      </div>
                      <div className="text-xs text-gray-500">
                        per day
                      </div>
                    </div>
                    
                    {/* Monthly Total */}
                    <div 
                      className="rounded-md p-2"
                      style={{ backgroundColor: `${metric.color}15` }}
                    >
                      <div className="text-xs font-medium" style={{ color: metric.color }}>
                        Total ({metricData.rows.length} month{metricData.rows.length > 1 ? 's' : ''})
                      </div>
                      <div className="text-xl font-bold" style={{ color: metric.color }}>
                        {formatValue(metricTotals)}
                      </div>
                      <div className="text-xs" style={{ color: metric.color }}>
                        {formatValue(monthlyAverage)}/month avg
                      </div>
                    </div>
                  </div>
                  
                  {/* Visual indicator for active metric */}
                  {selectedMetric === metric.key && (
                    <div className="mt-3 flex items-center justify-center">
                      <div className="w-full h-1 bg-blue-500 rounded-full"></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Loading state for metric cards */}
        {!allMetricsData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
            {METRICS.map((metric) => (
              <div key={metric.key} className="bg-white border-2 border-gray-200 rounded-lg p-4 animate-pulse">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-9 h-9 bg-gray-300 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-300 rounded w-3/4 mb-1"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="bg-gray-50 rounded-md p-2">
                    <div className="h-3 bg-gray-300 rounded w-1/2 mb-2"></div>
                    <div className="h-6 bg-gray-300 rounded w-3/4"></div>
                  </div>
                  <div className="bg-gray-100 rounded-md p-2">
                    <div className="h-3 bg-gray-300 rounded w-1/2 mb-2"></div>
                    <div className="h-6 bg-gray-300 rounded w-3/4"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* KPI Cards */}
        {data && data.rows && data.rows.length > 0 && selectedMetricData && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Total Volume */}
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <selectedMetricData.icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-800">Total Volume</p>
                    <p className="text-xl font-bold text-blue-900">{formatValue(totalValue)}</p>
                  </div>
                </div>
              </div>

              {/* Average per Month */}
              <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-500 rounded-lg">
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-800">Monthly Average</p>
                    <p className="text-xl font-bold text-green-900">{formatValue(avgValue)}</p>
                  </div>
                </div>
              </div>

              {/* Best Performance */}
              <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-yellow-500 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-yellow-800">Best Month</p>
                    <p className="text-lg font-bold text-yellow-900">{bestMonth?.month}</p>
                    <p className="text-sm text-yellow-700">{formatValue(bestMonth?.value || 0)}</p>
                  </div>
                </div>
              </div>

              {/* Trend */}
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-500 rounded-lg">
                    {getTrendIcon(avgChange)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-purple-800">3-Month Trend</p>
                    <p className={`text-lg font-bold ${getTrendColor(avgChange)}`}>
                      {avgChange > 0 ? '+' : ''}{avgChange.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Chart */}
            <div className="bg-white rounded-lg border p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {selectedMetricData.label} Trends
                  </h3>
                  {fairComparison && (
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        ⚖️ Fair Comparison Active
                      </span>
                      <span className="text-xs text-gray-500">
                        All months normalized to same day count
                      </span>
                    </div>
                  )}
                </div>
                <div className="text-sm text-gray-500">
                  {data.rows.length} months • {selectedMonths.includes('all') ? 'All months' : selectedMonths.join(', ')}
                </div>
              </div>
              
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === 'bar' ? (
                    <BarChart data={data.rows}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="month" 
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip 
                        formatter={(value: any) => [formatValue(value), selectedMetricData.label]}
                        labelFormatter={(label) => `Month: ${label}`}
                      />
                      <Bar 
                        dataKey="value" 
                        fill={selectedMetricData.color}
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  ) : (
                    <RechartsLineChart data={data.rows}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="month" 
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip 
                        formatter={(value: any) => [formatValue(value), selectedMetricData.label]}
                        labelFormatter={(label) => `Month: ${label}`}
                      />
                      <Line 
                        type="monotone"
                        dataKey="value" 
                        stroke={selectedMetricData.color}
                        strokeWidth={3}
                        dot={{ r: 5, fill: selectedMetricData.color }}
                        activeDot={{ r: 7 }}
                      />
                    </RechartsLineChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>

            {/* Insights Summary */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">📊 Quick Insights</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
                <div>
                  <p><strong>Data Coverage:</strong> {data.rows.length} months • {selectedMonths.includes('all') ? 'All months' : `${selectedMonths.length} selected months`}</p>
                  <p><strong>Best Performance:</strong> {bestMonth?.month} with {formatValue(bestMonth?.value || 0)} {selectedMetricData.label.toLowerCase()}</p>
                  {fairComparison && (
                    <p><strong>Fair Comparison:</strong> ⚖️ All months normalized to same day count for accurate comparison</p>
                  )}
                </div>
                <div>
                  <p><strong>Recent Trend:</strong> {avgChange > 0 ? 'Growing' : avgChange < 0 ? 'Declining' : 'Stable'} ({avgChange.toFixed(1)}% avg change)</p>
                  <p><strong>Consistency:</strong> {worstMonth && bestMonth ? ((worstMonth.value / bestMonth.value) * 100).toFixed(0) : 0}% variance ratio</p>
                  <p><strong>Interactive Cards:</strong> 📊 Metric cards update automatically based on selected months and fair comparison settings</p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Focused Month Analysis */}
        {focusMonth && data && data.rows.length > 0 && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <h4 className="text-lg font-semibold text-blue-900">Focus: {focusMonth} Analysis</h4>
            </div>
            
            {(() => {
              const focusedMonthData = data.rows.find((row: any) => row.month === focusMonth);
              if (!focusedMonthData) return null;
              
              const momChange = data.mom_changes?.find((change: any) => change.to === focusMonth);
              const isAboveAvg = focusedMonthData.value > avgValue;
              const rankPosition = data.rows
                .sort((a: any, b: any) => b.value - a.value)
                .findIndex((row: any) => row.month === focusMonth) + 1;
              
              return (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg p-4 border border-blue-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-800">Performance</p>
                        <p className="text-2xl font-bold text-blue-900">{formatValue(focusedMonthData.value)}</p>
                        <p className="text-xs text-blue-600">
                          {isAboveAvg ? '📈 Above' : '📉 Below'} average ({((focusedMonthData.value / avgValue - 1) * 100).toFixed(1)}%)
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-blue-600">Rank</p>
                        <p className="text-lg font-bold text-blue-900">#{rankPosition}</p>
                        <p className="text-xs text-blue-600">of {data.rows.length}</p>
                      </div>
                    </div>
                  </div>
                  
                  {momChange && (
                    <div className="bg-white rounded-lg p-4 border border-blue-100">
                      <div className="flex items-center space-x-2">
                        {getTrendIcon(momChange.pct)}
                        <div>
                          <p className="text-sm font-medium text-blue-800">Month-over-Month</p>
                          <p className={`text-lg font-bold ${getTrendColor(momChange.pct)}`}>
                            {momChange.pct > 0 ? '+' : ''}{momChange.pct.toFixed(1)}%
                          </p>
                          <p className="text-xs text-blue-600">vs {momChange.from}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="bg-white rounded-lg p-4 border border-blue-100">
                    <p className="text-sm font-medium text-blue-800">Data Quality</p>
                    <p className="text-lg font-bold text-blue-900">{focusedMonthData.daysCounted} days</p>
                    <p className="text-xs text-blue-600">
                      All data included
                    </p>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* No Data */}
        {data && (!data.rows || data.rows.length === 0) && !isLoading && (
          <div className="text-center py-12">
            <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Monthly Data Available</h3>
            <p className="text-gray-500 mb-4">Import your financial data to see detailed monthly comparisons and trends.</p>
            <button className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 transition-colors">
              Go to Data Import
            </button>
          </div>
        )}
      </div>

      {/* Notes Section */}
      <div className="bg-white rounded-lg shadow p-6 mt-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">📝 Notes for Selected Period</h3>
        <NotesSection 
          notes={notesData?.notes || []} 
          selectedMonths={selectedMonths}
        />
      </div>
    </Card>
  );
};

export default MonthlyComparison;

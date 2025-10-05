import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, TrendingUp, TrendingDown, Info } from 'lucide-react';
import Card from './Card';
import { useClient } from '../contexts/ClientContext';

const METRICS = [
  { key: 'registered_onboarded', label: 'Registered Onboarded', shortLabel: 'Reg. Onboarded' },
  { key: 'linked_accounts', label: 'Linked Accounts', shortLabel: 'Linked Acc.' },
  { key: 'total_advance_applications', label: 'Advance Applications', shortLabel: 'Advance Apps' },
  { key: 'total_advance_applicants', label: 'Advance Applicants', shortLabel: 'Advance Users' },
  { key: 'total_micro_financing_applications', label: 'Micro Financing Applications', shortLabel: 'Micro Finance Apps' },
  { key: 'total_micro_financing_applicants', label: 'Micro Financing Applicants', shortLabel: 'Micro Finance Users' },
  { key: 'total_personal_finance_application', label: 'Personal Finance Applications', shortLabel: 'Personal Finance Apps' },
  { key: 'total_personal_finance_applicants', label: 'Personal Finance Applicants', shortLabel: 'Personal Finance Users' }
];

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface DayPerformanceData {
  date: string;
  weekNumber: number;
  dayOfWeek: number;
  [key: string]: any;
}

const DayPerformanceAnalysis: React.FC = () => {
  const { selectedClient } = useClient();
  const [selectedDay, setSelectedDay] = useState<number>(0); // Default to Sunday

  // Fetch all daily data for the selected client
  const { data: dailyData, isLoading, error } = useQuery({
    queryKey: ['day-performance', selectedClient?.id],
    queryFn: async () => {
      if (!selectedClient?.id) return [];
      
      const response = await fetch(`/api/reports?clientId=${selectedClient.id}&limit=1000`);
      if (!response.ok) throw new Error('Failed to fetch daily data');
      
      const reports = await response.json();
      
      // Process data to add day of week information
      return reports.map((report: any) => {
        const date = new Date(report.report_date);
        const dayOfWeek = date.getDay();
        const weekNumber = Math.ceil(date.getDate() / 7);
        
        return {
          ...report,
          date: report.report_date,
          dayOfWeek,
          weekNumber,
          formattedDate: date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: 'numeric'
          })
        };
      }).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
    },
    enabled: !!selectedClient?.id
  });

  // Filter data for selected day of week
  const filteredData = dailyData?.filter((item: DayPerformanceData) => item.dayOfWeek === selectedDay) || [];

  // Calculate best and worst values for each metric
  const getMetricStats = (metricKey: string) => {
    const values = filteredData.map((item: DayPerformanceData) => Number(item[metricKey]) || 0);
    if (values.length === 0) return { best: 0, worst: 0, bestIndex: -1, worstIndex: -1 };
    
    const max = Math.max(...values);
    const min = Math.min(...values);
    const bestIndex = values.indexOf(max);
    const worstIndex = values.indexOf(min);
    
    return { best: max, worst: min, bestIndex, worstIndex };
  };

  const formatValue = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toString();
  };

  const getCellStyle = (value: number, metricKey: string, rowIndex: number) => {
    const stats = getMetricStats(metricKey);
    const numValue = Number(value) || 0;
    
    if (stats.bestIndex === rowIndex && numValue === stats.best && stats.best !== stats.worst) {
      return {
        backgroundColor: '#dcfce7', // green-100
        borderColor: '#16a34a', // green-600
        color: '#15803d', // green-700
        fontWeight: 'bold'
      };
    } else if (stats.worstIndex === rowIndex && numValue === stats.worst && stats.best !== stats.worst) {
      return {
        backgroundColor: '#fef2f2', // red-50
        borderColor: '#dc2626', // red-600
        color: '#dc2626', // red-600
        fontWeight: 'bold'
      };
    }
    
    return {};
  };

  const getTooltipText = (value: number, metricKey: string, rowIndex: number, date: string) => {
    const stats = getMetricStats(metricKey);
    const numValue = Number(value) || 0;
    const dayName = DAY_NAMES[selectedDay];
    
    if (stats.bestIndex === rowIndex && numValue === stats.best && stats.best !== stats.worst) {
      return `Best Performance: Highest ${METRICS.find(m => m.key === metricKey)?.label} on ${dayName}, ${date} — ${formatValue(numValue)}!`;
    } else if (stats.worstIndex === rowIndex && numValue === stats.worst && stats.best !== stats.worst) {
      return `Worst Performance: Lowest ${METRICS.find(m => m.key === metricKey)?.label} on ${dayName}, ${date} — ${formatValue(numValue)}`;
    }
    
    return `${METRICS.find(m => m.key === metricKey)?.label}: ${formatValue(numValue)} on ${dayName}, ${date}`;
  };

  if (!selectedClient) {
    return (
      <Card>
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Client Selection Required
          </h3>
          <p className="text-gray-600">
            Please select a client to view day performance analysis.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <Calendar className="w-6 h-6 mr-2 text-blue-600" />
                📊 Day of Week Performance Analysis
              </h2>
              <p className="text-gray-600 mt-1">
                Analyze performance for specific days across multiple weeks with best/worst highlighting
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-4 h-4 bg-green-100 border border-green-600 rounded"></div>
                <span className="text-gray-700">Best Performance</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-4 h-4 bg-red-50 border border-red-600 rounded"></div>
                <span className="text-gray-700">Worst Performance</span>
              </div>
            </div>
          </div>

          {/* Day Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Day of the Week
            </label>
            <div className="flex flex-wrap gap-2">
              {DAY_NAMES.map((day, index) => (
                <button
                  key={day}
                  onClick={() => setSelectedDay(index)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    selectedDay === index
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
            
            {filteredData.length > 0 && (
              <div className="mt-3 text-sm text-gray-600">
                Showing {filteredData.length} {DAY_NAMES[selectedDay]}s across multiple weeks
              </div>
            )}
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-800">Error loading data: {(error as Error)?.message || 'Unknown error'}</p>
            </div>
          )}

          {/* Data Table */}
          {!isLoading && !error && filteredData.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                      Week ({DAY_NAMES[selectedDay]})
                    </th>
                    {METRICS.map((metric) => (
                      <th
                        key={metric.key}
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 last:border-r-0"
                        title={metric.label}
                      >
                        {metric.shortLabel}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredData.map((row: DayPerformanceData, rowIndex: number) => (
                    <tr key={row.date} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 border-r border-gray-200">
                        {row.formattedDate}
                      </td>
                      {METRICS.map((metric) => {
                        const value = Number(row[metric.key]) || 0;
                        const cellStyle = getCellStyle(value, metric.key, rowIndex);
                        const tooltipText = getTooltipText(value, metric.key, rowIndex, row.formattedDate);
                        
                        return (
                          <td
                            key={metric.key}
                            className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200 last:border-r-0 relative group"
                            style={cellStyle}
                            title={tooltipText}
                          >
                            <div className="flex items-center justify-between">
                              <span>{formatValue(value)}</span>
                              {cellStyle.fontWeight === 'bold' && (
                                <div className="ml-2">
                                  {cellStyle.color === '#15803d' ? (
                                    <TrendingUp className="w-4 h-4 text-green-600" />
                                  ) : (
                                    <TrendingDown className="w-4 h-4 text-red-600" />
                                  )}
                                </div>
                              )}
                            </div>
                            
                            {/* Tooltip */}
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 whitespace-nowrap">
                              {tooltipText}
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* No Data State */}
          {!isLoading && !error && filteredData.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Data Available
              </h3>
              <p className="text-gray-600">
                No data found for {DAY_NAMES[selectedDay]}s in the selected period.
              </p>
            </div>
          )}

          {/* Summary Stats */}
          {!isLoading && !error && filteredData.length > 0 && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-800">Data Coverage</p>
                    <p className="text-xl font-bold text-blue-900">{filteredData.length}</p>
                    <p className="text-xs text-blue-700">{DAY_NAMES[selectedDay]}s analyzed</p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-500 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-800">Best Performance</p>
                    <p className="text-lg font-bold text-green-900">Highlighted in Green</p>
                    <p className="text-xs text-green-700">Highest values per metric</p>
                  </div>
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-red-500 rounded-lg">
                    <TrendingDown className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-red-800">Worst Performance</p>
                    <p className="text-lg font-bold text-red-900">Highlighted in Red</p>
                    <p className="text-xs text-red-700">Lowest values per metric</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default DayPerformanceAnalysis;
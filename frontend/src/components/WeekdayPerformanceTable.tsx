import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, TrendingUp, TrendingDown, Filter } from 'lucide-react';
import Card from './Card';

const WEEKDAYS = [
  { value: 'all', label: 'All Days' },
  { value: 'sunday', label: 'Sunday' },
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' }
];

const METRICS = [
  { key: 'registered_onboarded', label: 'Registered' },
  { key: 'linked_accounts', label: 'Linked Accounts' },
  { key: 'total_advance_applications', label: 'Advance Apps' },
  { key: 'total_advance_applicants', label: 'Advance Applicants' },
  { key: 'total_micro_financing_applications', label: 'Micro Finance Apps' },
  { key: 'total_micro_financing_applicants', label: 'Micro Finance Users' },
  { key: 'total_personal_finance_application', label: 'Personal Finance Apps' },
  { key: 'total_personal_finance_applicants', label: 'Personal Finance Users' },
  { key: 'total_bnpl_applications', label: 'BNPL Apps' },
  { key: 'total_bnpl_applicants', label: 'BNPL Users' }
];

interface WeekdayData {
  date: string;
  week_label: string;
  weekday: string;
  [key: string]: any;
}

const WeekdayPerformanceTable: React.FC = () => {
  const [selectedWeekday, setSelectedWeekday] = useState<string>('all');

  // Fetch weekday performance data
  const { data: weekdayData, isLoading, error } = useQuery({
    queryKey: ['weekday-performance', selectedWeekday],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedWeekday !== 'all') {
        params.append('weekday', selectedWeekday);
      }
      
      const response = await fetch(`/api/analytics/weekday-performance?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch weekday performance data');
      }
      return response.json();
    }
  });

  // Helper function to find best and worst values for each metric
  const getHighlightStyle = (value: number, metric: string, data: WeekdayData[]) => {
    if (!data || data.length === 0) return {};
    
    const values = data.map(row => row[metric] || 0).filter(v => v > 0);
    if (values.length === 0) return {};
    
    const maxValue = Math.max(...values);
    const minValue = Math.min(...values);
    
    if (value === maxValue && value > 0) {
      return {
        backgroundColor: '#dcfce7', // green-100
        color: '#166534', // green-800
        fontWeight: 'bold',
        border: '2px solid #22c55e' // green-500
      };
    }
    
    if (value === minValue && value > 0) {
      return {
        backgroundColor: '#fef2f2', // red-100
        color: '#991b1b', // red-800
        fontWeight: 'bold',
        border: '2px solid #ef4444' // red-500
      };
    }
    
    return {};
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatValue = (value: number) => {
    if (!value || value === 0) return '-';
    return value.toLocaleString();
  };

  const getWeekdayLabel = (weekday: string) => {
    return WEEKDAYS.find(w => w.value === weekday)?.label || weekday;
  };

  return (
    <Card title="📅 Weekday Performance Analysis">
      <div className="space-y-6">
        {/* Filter Controls */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-600" />
            <label className="text-sm font-medium text-gray-700">
              Filter by Day:
            </label>
          </div>
          <select
            value={selectedWeekday}
            onChange={(e) => setSelectedWeekday(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {WEEKDAYS.map(day => (
              <option key={day.value} value={day.value}>
                {day.label}
              </option>
            ))}
          </select>
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
        {weekdayData && weekdayData.length > 0 && (
          <>
            {/* Summary Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                <h4 className="font-medium text-blue-900">
                  {selectedWeekday === 'all' 
                    ? 'All Days Performance' 
                    : `${getWeekdayLabel(selectedWeekday)} Performance Analysis`
                  }
                </h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-800">
                <div>
                  <p><strong>Data Points:</strong> {weekdayData.length} entries</p>
                  <p><strong>Date Range:</strong> {formatDate(weekdayData[0]?.date)} to {formatDate(weekdayData[weekdayData.length - 1]?.date)}</p>
                </div>
                <div>
                  <p><strong>🟢 Green Highlight:</strong> Best performance (highest value)</p>
                  <p><strong>🔴 Red Highlight:</strong> Worst performance (lowest value)</p>
                </div>
                <div>
                  <p><strong>Filter:</strong> {selectedWeekday === 'all' ? 'All weekdays' : `Only ${getWeekdayLabel(selectedWeekday)}s`}</p>
                  <p><strong>Comparison:</strong> Week-over-week performance</p>
                </div>
              </div>
            </div>

            {/* Performance Table */}
            <div className="bg-white rounded-lg border overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b">
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedWeekday === 'all' 
                    ? 'All Days Performance Data' 
                    : `${getWeekdayLabel(selectedWeekday)} Performance Across Weeks`
                  }
                </h3>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Week
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Day
                      </th>
                      {METRICS.map(metric => (
                        <th key={metric.key} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                          {metric.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {weekdayData.map((row: WeekdayData, index: number) => (
                      <tr key={`${row.date}-${index}`} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-white z-10">
                          {formatDate(row.date)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          {row.week_label || 'N/A'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {row.weekday || 'N/A'}
                          </span>
                        </td>
                        {METRICS.map(metric => (
                          <td 
                            key={metric.key} 
                            className="px-4 py-4 whitespace-nowrap text-sm text-gray-900"
                            style={getHighlightStyle(row[metric.key] || 0, metric.key, weekdayData)}
                          >
                            {formatValue(row[metric.key] || 0)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Performance Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Best Performance */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <h4 className="font-medium text-green-900">Best Performance</h4>
                </div>
                <div className="space-y-2 text-sm text-green-800">
                  {METRICS.slice(0, 5).map(metric => {
                    const values = weekdayData.map(row => row[metric.key] || 0).filter(v => v > 0);
                    const maxValue = values.length > 0 ? Math.max(...values) : 0;
                    const bestRow = weekdayData.find(row => row[metric.key] === maxValue);
                    
                    return (
                      <div key={metric.key} className="flex justify-between">
                        <span>{metric.label}:</span>
                        <span className="font-medium">
                          {formatValue(maxValue)} {bestRow ? `(${formatDate(bestRow.date)})` : ''}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Worst Performance */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <TrendingDown className="h-5 w-5 text-red-600" />
                  <h4 className="font-medium text-red-900">Worst Performance</h4>
                </div>
                <div className="space-y-2 text-sm text-red-800">
                  {METRICS.slice(0, 5).map(metric => {
                    const values = weekdayData.map(row => row[metric.key] || 0).filter(v => v > 0);
                    const minValue = values.length > 0 ? Math.min(...values) : 0;
                    const worstRow = weekdayData.find(row => row[metric.key] === minValue);
                    
                    return (
                      <div key={metric.key} className="flex justify-between">
                        <span>{metric.label}:</span>
                        <span className="font-medium">
                          {formatValue(minValue)} {worstRow ? `(${formatDate(worstRow.date)})` : ''}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        )}

        {/* No Data State */}
        {weekdayData && weekdayData.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
            <p className="text-gray-500 mb-4">
              No performance data found for {selectedWeekday === 'all' ? 'any weekday' : getWeekdayLabel(selectedWeekday)}.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default WeekdayPerformanceTable;
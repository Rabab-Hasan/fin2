import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Calendar, TrendingUp, Activity, Eye, Filter } from 'lucide-react';
import Card from './Card';
import secureApiClient from '../utils/secure-api-client';

const METRICS = [
  { key: 'registered_onboarded', label: 'Registered Onboarded', color: '#3B82F6' },
  { key: 'linked_accounts', label: 'Linked Accounts', color: '#10B981' },
  { key: 'total_advance_applications', label: 'Total Advance Applications', color: '#F59E0B' },
  { key: 'total_advance_applicants', label: 'Total Advance Applicants', color: '#8B5CF6' },
  { key: 'total_micro_financing_applications', label: 'Total Micro Financing Applications', color: '#EF4444' },
  { key: 'total_micro_financing_applicants', label: 'Total Micro Financing Applicants', color: '#06B6D4' },
  { key: 'total_personal_finance_application', label: 'Total Personal Finance Applications', color: '#84CC16' },
  { key: 'total_personal_finance_applicants', label: 'Total Personal Finance Applicants', color: '#F97316' }
];

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Analytics API calls
const analyticsApi = {
  getWeeklyComparison: async (params: any) => {
    const searchParams = new URLSearchParams();
    if (params.days) searchParams.append('days', params.days);
    if (params.month) searchParams.append('month', params.month);
    if (params.metric) searchParams.append('metric', params.metric);
    
    return secureApiClient.get(`/analytics/weekly-comparison?${searchParams}`);
  },
  getAllNotes: async () => {
    const response = await fetch('/api/notes');
    if (!response.ok) throw new Error('Failed to fetch notes');
    return response.json();
  }
};

// NotesSection component for weekly comparison
const NotesSection = ({ notes, selectedMonth }: {
  notes: any[];
  selectedMonth: string;
}) => {
  // Filter notes based on selected month
  const filteredNotes = notes.filter((note: any) => {
    if (!note.date) return false;
    
    try {
      const noteDate = new Date(note.date);
      if (isNaN(noteDate.getTime())) return false;
      
      if (selectedMonth === 'all') return true;
      
      const noteMonth = noteDate.toLocaleString('default', { month: 'long', year: 'numeric' });
      return noteMonth === selectedMonth;
    } catch (error) {
      return false;
    }
  });

  if (filteredNotes.length === 0) {
    return (
      <div className="text-gray-500 text-center py-8">
        No notes found for the selected period.
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

const WeeklyComparison: React.FC = () => {
  const [selectedDays, setSelectedDays] = useState([0]); // Default to Sunday
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [selectedMetric, setSelectedMetric] = useState('linked_accounts');
  const [viewMode, setViewMode] = useState<'lines' | 'heatmap'>('heatmap');

  const { data, isLoading, error } = useQuery({
    queryKey: ['weekly-comparison', selectedDays, selectedMonth, selectedMetric],
    queryFn: () => analyticsApi.getWeeklyComparison({
      days: selectedDays.join(','),
      month: selectedMonth || undefined,
      metric: selectedMetric
    })
  });

  // Fetch all notes
  const { data: notesData } = useQuery({
    queryKey: ['all-notes'],
    queryFn: () => analyticsApi.getAllNotes()
  });

  const handleDayToggle = (dayIndex: number) => {
    setSelectedDays(prev => {
      if (prev.includes(dayIndex)) {
        const filtered = prev.filter(d => d !== dayIndex);
        return filtered.length === 0 ? [dayIndex] : filtered; // Keep at least one day
      } else {
        return [...prev, dayIndex];
      }
    });
  };

  // Extract available months from data
  const availableMonths = data?.series?.[0]?.points?.map((p: any) => p.month) || [];

  // Prepare chart data
  const chartData = data?.series?.[0]?.points?.map((point: any) => ({
    month: point.month,
    ...data.series.reduce((acc: any, series: any) => {
      acc[series.label] = series.points.find((p: any) => p.month === point.month)?.value || 0;
      return acc;
    }, {})
  })) || [];

  // Prepare heatmap data
  const heatmapData = () => {
    if (!data?.series) return [];
    
    const result: Array<{day: string, values: Array<{month: string, value: number}>}> = [];
    
    data.series.forEach((series: any) => {
      const dayData = {
        day: series.label,
        values: series.points.map((point: any) => ({
          month: point.month,
          value: point.value
        }))
      };
      result.push(dayData);
    });
    
    return result;
  };

  const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#6B7280'];
  
  const selectedMetricData = METRICS.find(m => m.key === selectedMetric);

  // Calculate statistics
  const totalValues = chartData.map(item => 
    data?.series?.reduce((sum: number, series: any) => {
      const point = series.points.find((p: any) => p.month === item.month);
      return sum + (point?.value || 0);
    }, 0) || 0
  );
  
  const maxValue = Math.max(...totalValues);
  const avgValue = totalValues.length ? totalValues.reduce((sum, val) => sum + val, 0) / totalValues.length : 0;
  const bestMonth = chartData.find((_, index) => totalValues[index] === maxValue);

  // Calculate overall daily average for comparison
  const allDayTotals = data?.series?.map((series: any) => 
    series.points.reduce((sum: number, point: any) => sum + point.value, 0)
  ) || [];
  const overallDailyAvg = allDayTotals.length ? allDayTotals.reduce((sum, val) => sum + val, 0) / allDayTotals.length : 0;

  const formatValue = (value: number) => {
    if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
    if (value >= 1000) return (value / 1000).toFixed(1) + 'K';
    return value.toLocaleString();
  };

  // Get color intensity for heatmap
  const getHeatmapColor = (value: number, maxVal: number) => {
    if (maxVal === 0) return 'bg-gray-100';
    const intensity = value / maxVal;
    if (intensity > 0.8) return 'bg-red-500 text-white';
    if (intensity > 0.6) return 'bg-red-400 text-white';
    if (intensity > 0.4) return 'bg-red-300';
    if (intensity > 0.2) return 'bg-red-200';
    if (intensity > 0) return 'bg-red-100';
    return 'bg-gray-50';
  };

  return (
    <Card title="📊 Cross-Month Weekly Analysis - Weekday Performance Patterns">
      <div className="space-y-6">
        {/* Controls Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

          {/* Day Chips */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Days
            </label>
            <div className="flex flex-wrap gap-1">
              {DAY_NAMES.map((day, index) => (
                <button
                  key={index}
                  onClick={() => handleDayToggle(index)}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                    selectedDays.includes(index)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {day.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>

          {/* Month Scope */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Month Scope
            </label>
            <select
              value={selectedMonth || ''}
              onChange={(e) => setSelectedMonth(e.target.value || null)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Months Combined</option>
              {availableMonths.map((month: string) => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </select>
          </div>

          {/* View Mode */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              View Mode
            </label>
            <div className="flex gap-1">
              <button
                onClick={() => setViewMode('heatmap')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  viewMode === 'heatmap'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Heatmap
              </button>
              <button
                onClick={() => setViewMode('lines')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  viewMode === 'lines'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Lines
              </button>
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

        {/* Results */}
        {data && data.series && data.series.length > 0 && selectedMetricData && (
          <>
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Total Across Selected Days */}
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <Activity className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-800">Peak Performance</p>
                    <p className="text-xl font-bold text-blue-900">{formatValue(maxValue)}</p>
                    <p className="text-xs text-blue-700">{bestMonth?.month || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Average Performance */}
              <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-500 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-800">Monthly Average</p>
                    <p className="text-xl font-bold text-green-900">{formatValue(avgValue)}</p>
                    <p className="text-xs text-green-700">{selectedDays.map(d => DAY_NAMES[d].slice(0, 3)).join(', ')}</p>
                  </div>
                </div>
              </div>

              {/* Coverage */}
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-500 rounded-lg">
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-purple-800">Data Coverage</p>
                    <p className="text-xl font-bold text-purple-900">{availableMonths.length}</p>
                    <p className="text-xs text-purple-700">months analyzed</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Visualization */}
            <div className="bg-white rounded-lg border p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {viewMode === 'heatmap' ? 'Weekday Performance Heatmap' : 'Cross-Month Trends'}
                </h3>
                <div className="text-sm text-gray-500">
                  {selectedDays.length} day{selectedDays.length > 1 ? 's' : ''} • {selectedMonth || 'All months'}
                </div>
              </div>

              {viewMode === 'heatmap' ? (
                /* Heatmap View */
                <div className="space-y-4">
                  <div className="text-sm text-gray-600 mb-4">
                    Intensity shows {selectedMetricData.label.toLowerCase()} levels across months and weekdays. Darker = higher values.
                  </div>
                  
                  {/* Heatmap Grid */}
                  <div className="overflow-x-auto">
                    <div className="min-w-max">
                      {/* Header with months */}
                      <div className="grid grid-cols-1 gap-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-24 text-xs font-medium text-gray-700">Weekday</div>
                          {availableMonths.slice(0, 12).map((month: string) => (
                            <div key={month} className="w-16 text-xs text-center font-medium text-gray-700">
                              {month.split('-')[1]}
                            </div>
                          ))}
                        </div>
                        
                        {/* Heatmap rows */}
                        {heatmapData().map((dayData) => {
                          const maxDayValue = Math.max(...dayData.values.map(v => v.value));
                          return (
                            <div key={dayData.day} className="flex items-center space-x-2">
                              <div className="w-24 text-xs font-medium text-gray-700">
                                {dayData.day}
                              </div>
                              {dayData.values.slice(0, 12).map((monthData, index) => (
                                <div
                                  key={monthData.month}
                                  className={`w-16 h-8 rounded flex items-center justify-center text-xs font-medium cursor-pointer transition-all hover:scale-105 ${
                                    getHeatmapColor(monthData.value, maxDayValue)
                                  }`}
                                  title={`${dayData.day}, ${monthData.month}: ${formatValue(monthData.value)}`}
                                >
                                  {formatValue(monthData.value)}
                                </div>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Heatmap Legend */}
                  <div className="flex items-center justify-center space-x-4 text-xs text-gray-600">
                    <span>Low</span>
                    <div className="flex space-x-1">
                      <div className="w-4 h-4 bg-gray-50 border rounded"></div>
                      <div className="w-4 h-4 bg-red-100 rounded"></div>
                      <div className="w-4 h-4 bg-red-200 rounded"></div>
                      <div className="w-4 h-4 bg-red-300 rounded"></div>
                      <div className="w-4 h-4 bg-red-400 rounded"></div>
                      <div className="w-4 h-4 bg-red-500 rounded"></div>
                    </div>
                    <span>High</span>
                  </div>
                </div>
              ) : (
                /* Line Chart View */
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
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
                        formatter={(value: any, name: string) => [formatValue(value), name]}
                        labelFormatter={(label) => `Month: ${label}`}
                      />
                      {data.series.map((series: any, index: number) => (
                        <Line
                          key={series.label}
                          type="monotone"
                          dataKey={series.label}
                          stroke={colors[index % colors.length]}
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Weekday Analysis Table */}
            <div className="bg-white rounded-lg border overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Weekday Performance Analysis</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Weekday
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Average
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Best Month
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Performance
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.series.map((series: any, index: number) => {
                      const total = series.points.reduce((sum: number, point: any) => sum + point.value, 0);
                      const average = total / series.points.length;
                      const bestPoint = series.points.reduce((best: any, point: any) => 
                        point.value > (best?.value || 0) ? point : best, null
                      );
                      const isTopPerformer = total === Math.max(...data.series.map((s: any) => 
                        s.points.reduce((sum: number, p: any) => sum + p.value, 0)
                      ));
                      
                      return (
                        <tr key={series.label} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-3">
                              <div 
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: colors[index % colors.length] }}
                              ></div>
                              <span className="text-sm font-medium text-gray-900">{series.label}</span>
                              {isTopPerformer && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                  🏆 Top Day
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {formatValue(total)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatValue(average)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {bestPoint?.month} ({formatValue(bestPoint?.value || 0)})
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              total > overallDailyAvg 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {total > overallDailyAvg ? '📈 Above Avg' : '📉 Below Avg'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Insights */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">🎯 Weekday Performance Insights</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
                <div>
                  <p><strong>Analysis Scope:</strong> {selectedDays.map(d => DAY_NAMES[d]).join(', ')} across {availableMonths.length} months</p>
                  <p><strong>Peak Period:</strong> {bestMonth?.month || 'N/A'} with {formatValue(maxValue)} total {selectedMetricData.label.toLowerCase()}</p>
                </div>
                <div>
                  <p><strong>Best Performing Day:</strong> {data.series.reduce((best: any, series: any) => {
                    const total = series.points.reduce((sum: number, p: any) => sum + p.value, 0);
                    return total > (best.total || 0) ? { label: series.label, total } : best;
                  }, {}).label || 'N/A'}</p>
                  <p><strong>Data Quality:</strong> {selectedMonth ? `Focused on ${selectedMonth}` : 'Cross-month comparison'}</p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* No Data */}
        {data && (!data.series || data.series.length === 0) && !isLoading && (
          <div className="text-center py-12">
            <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Activity className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Weekly Pattern Data</h3>
            <p className="text-gray-500 mb-4">Import more data to analyze weekday performance patterns across months.</p>
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
          selectedMonth={selectedMonth || 'all'}
        />
      </div>
    </Card>
  );
};

export default WeeklyComparison;

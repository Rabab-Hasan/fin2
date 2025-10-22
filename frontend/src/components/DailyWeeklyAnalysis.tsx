import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart as RechartsLineChart, Line } from 'recharts';
import { TrendingUp, Calendar, BarChart3, PieChart, LineChart, Users, CreditCard, Target, ArrowUp, ArrowDown, Minus, StickyNote } from 'lucide-react';
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

const analyticsApi = {
  getDailyWeeklyAnalysis: async (params: any, clientId: string) => {
    const searchParams = new URLSearchParams();
    if (params.weeks) searchParams.append('weeks', params.weeks);
    if (params.months) searchParams.append('months', params.months);
    if (params.metric) searchParams.append('metric', params.metric);
    if (params.startDate) searchParams.append('startDate', params.startDate);
    if (params.endDate) searchParams.append('endDate', params.endDate);
    if (params.view) searchParams.append('view', params.view);
    if (params.weekdays) searchParams.append('weekdays', params.weekdays);
    searchParams.append('clientId', clientId);
    
    return secureApiClient.get(`/api/analytics/daily-weekly?${searchParams}`);
  },
  
  getDayNotes: async (date: string) => {
    return secureApiClient.get(`/api/notes/day/${date}`);
  },

  getAllNotes: async () => {
    const response = await fetch('/api/notes');
    if (!response.ok) throw new Error('Failed to fetch notes');
    return response.json();
  }
};

// NotesSection component to display notes for the selected period
const NotesSection = ({ notes, selectedMonths, selectedWeeks, analysisView }: {
  notes: any[];
  selectedMonths: string[];
  selectedWeeks: string[];
  analysisView: 'daily' | 'weekly';
}) => {
  // Add debugging
  console.log('NotesSection Props:', {
    notes: notes,
    selectedMonths: selectedMonths,
    selectedWeeks: selectedWeeks,
    analysisView: analysisView
  });

  // Filter notes based on selected date range
  const filteredNotes = notes.filter((note: any) => {
    if (!note.date) {
      console.log('Note missing date:', note);
      return false;
    }

    try {
      const noteDate = new Date(note.date);
      if (isNaN(noteDate.getTime())) {
        console.log('Invalid note date:', note.date);
        return false;
      }

      // Always show notes if "all" is selected
      if (selectedMonths.includes('all')) {
        console.log('Showing note because "all" months selected:', note);
        return true;
      }

      // Get the note's month and year in the same format as selectedMonths (YYYY-MM)
      const year = noteDate.getFullYear();
      const month = String(noteDate.getMonth() + 1).padStart(2, '0');
      const noteMonth = `${year}-${month}`;
      
      // Check if note's month is in selected months
      const monthMatch = selectedMonths.includes(noteMonth);
      console.log('Month match check:', { 
        noteDate: note.date, 
        noteMonth, 
        selectedMonths, 
        monthMatch 
      });
      
      if (!monthMatch) return false;
      
      // For weekly analysis, also check week
      if (analysisView === 'weekly') {
        // If all weeks selected, show the note (already passed month filter)
        if (selectedWeeks.includes('all')) {
          return true;
        }
        
        // Calculate week of year for the note
        const year = noteDate.getFullYear();
        const startOfYear = new Date(year, 0, 1);
        const dayOfYear = Math.floor((noteDate.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
        const weekNumber = Math.ceil((dayOfYear + startOfYear.getDay() + 1) / 7);
        const weekString = `${year}-W${weekNumber}`;
        
        const weekMatch = selectedWeeks.includes(weekString);
        console.log('Week match check:', { weekString, selectedWeeks, weekMatch });
        return weekMatch;
      }
      
      return true;
    } catch (error) {
      console.error('Error processing note date:', note.date, error);
      return false;
    }
  });

  console.log('Filtered notes:', filteredNotes);

  if (filteredNotes.length === 0) {
    return (
      <div className="text-gray-500 text-center py-8">
        <p>No notes found for the selected time period.</p>
        <p className="text-xs mt-2">Total notes available: {notes.length}</p>
        <p className="text-xs">Selected months: {selectedMonths.join(', ')}</p>
        <p className="text-xs">Selected weeks: {selectedWeeks.join(', ')}</p>
        <p className="text-xs">Analysis view: {analysisView}</p>
        {notes.length > 0 && (
          <details className="mt-4 text-left">
            <summary className="cursor-pointer">Show all notes (debug)</summary>
            <pre className="text-xs bg-gray-100 p-2 rounded mt-2 max-h-40 overflow-y-auto">
              {JSON.stringify(notes, null, 2)}
            </pre>
          </details>
        )}
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

const DailyWeeklyAnalysis: React.FC = () => {
  const { selectedClient } = useClient();
  const [selectedWeeks, setSelectedWeeks] = useState(['all']);
  const [selectedMonths, setSelectedMonths] = useState<string[]>(['all']);
  const [selectedMetric, setSelectedMetric] = useState('total_advance_applicants');
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');
  // Removed notes date range state
  const [analysisView, setAnalysisView] = useState<'weekly' | 'daily'>('weekly');
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]); // All days by default
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({ from: '', to: '' });
  const [pendingRange, setPendingRange] = useState<{ from: string; to: string }>({ from: '', to: '' });

  const { data, isLoading, error } = useQuery({
    queryKey: ['daily-weekly-analysis', selectedWeeks, selectedMonths, selectedMetric, analysisView, selectedWeekdays, dateRange, selectedClient?.id],
    queryFn: () => {
      if (!selectedClient?.id) return null;
      return analyticsApi.getDailyWeeklyAnalysis({
        weeks: selectedWeeks.includes('all') ? 'all' : selectedWeeks.join(','),
        months: selectedMonths.includes('all') ? undefined : selectedMonths.join(','),
        metric: selectedMetric,
        view: analysisView,
        weekdays: selectedWeekdays.length === 7 ? undefined : selectedWeekdays.join(','), // Only send if not all days selected
        startDate: dateRange.from || undefined,
        endDate: dateRange.to || undefined
      }, selectedClient.id).then(result => {
        console.log('API Response:', result);
        console.log('Rows count:', result?.rows?.length);
        console.log('First few rows:', result?.rows?.slice(0, 3));
        return result;
      });
    },
    enabled: !!selectedClient?.id
  });

  // Fetch all notes to show on hover
  const { data: notesData } = useQuery({
    queryKey: ['all-notes'],
    queryFn: () => analyticsApi.getAllNotes()
  });

  // Helper function to get notes for a specific date
  const getNotesForDate = (date: string) => {
    if (!notesData?.notes) return [];
    return notesData.notes.filter((note: any) => {
      // Use the correct field name - it's 'date', not 'report_date'
      const noteDate = new Date(note.date).toISOString().split('T')[0];
      return noteDate === date;
    });
  };

  // Helper function to check if a date has notes
  const hasNotes = (date: string) => {
    return getNotesForDate(date).length > 0;
  };

  // Helper function to get notes for a week (any day in that week)
  const getNotesForWeek = (weekLabel: string) => {
    if (!notesData?.notes) return [];
    return notesData.notes.filter((note: any) => {
      // Use the correct field name - it's 'date', not 'report_date'
      const noteDate = new Date(note.date);
      const year = noteDate.getFullYear();
      const weekNum = Math.ceil((noteDate.getDate() + new Date(year, noteDate.getMonth(), 1).getDay()) / 7);
      const monthNum = noteDate.getMonth() + 1;
      const noteWeekLabel = `${year}-${String(monthNum).padStart(2, '0')}-W${weekNum}`;
      return noteWeekLabel === weekLabel;
    });
  };

  // Custom dot component for line charts to show note indicators
  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (!payload || !cx || !cy || !payload.date) return null;
    
    let hasNotesForThisDate = false;
    try {
      const date = new Date(payload.date);
      if (!isNaN(date.getTime())) {
        const dateStr = date.toISOString().split('T')[0];
        hasNotesForThisDate = hasNotes(dateStr);
      }
    } catch (error) {
      console.warn('Invalid date in CustomDot payload:', payload.date);
    }
    
    return (
      <g>
        <circle 
          cx={cx} 
          cy={cy} 
          r={3} 
          fill={props.fill || props.stroke}
          stroke={hasNotesForThisDate ? '#F59E0B' : props.stroke}
          strokeWidth={hasNotesForThisDate ? 2 : 1}
        />
        {hasNotesForThisDate && (
          <text 
            x={cx} 
            y={cy - 8} 
            textAnchor="middle" 
            fontSize="10" 
            fill="#F59E0B"
          >
            📝
          </text>
        )}
      </g>
    );
  };
  // Handler for pending date range change
  const handlePendingRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPendingRange((prev) => ({ ...prev, [name]: value }));
  };
  // Apply the pending range to the analysis
  const handleApplyRange = () => {
    setDateRange(pendingRange);
  };

  // Removed notes range query

  const handleWeekdayToggle = (weekday: number) => {
    setSelectedWeekdays(prev => {
      if (prev.includes(weekday)) {
        const newSelection = prev.filter(w => w !== weekday);
        return newSelection.length === 0 ? [0, 1, 2, 3, 4, 5, 6] : newSelection;
      } else {
        return [...prev, weekday].sort();
      }
    });
  };

  const handleWeekToggle = (week: string) => {
    if (week === 'all') {
      setSelectedWeeks(['all']);
    } else {
      setSelectedWeeks(prev => {
        const withoutAll = prev.filter(w => w !== 'all');
        if (withoutAll.includes(week)) {
          const newSelection = withoutAll.filter(w => w !== week);
          return newSelection.length === 0 ? ['all'] : newSelection;
        } else {
          return [...withoutAll, week];
        }
      });
    }
  };

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

  const formatValue = (value: number): string => {
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

  const getWeekdayName = (day: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[day];
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center text-red-600">
          <p className="font-semibold">Error loading daily/weekly analysis</p>
          <p className="text-sm">{error instanceof Error ? error.message : 'Unknown error occurred'}</p>
        </div>
      </Card>
    );
  }

  // Add debugging information
  console.log('=== DEBUGGING DATA ===');
  console.log('Full data object:', data);
  console.log('data.rows exists?', !!data?.rows);
  console.log('data.rows length:', data?.rows?.length);
  console.log('analysisView:', analysisView);
  console.log('selectedMetric:', selectedMetric);
  console.log('Chart type:', chartType);
  console.log('======================');

  if (!data || !data.rows || data.rows.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-500">
          <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="font-semibold">No Data Available</p>
          <p className="text-sm">No daily/weekly data found for the selected criteria.</p>
        </div>
      </Card>
    );
  }

  const currentMetric = METRICS.find(m => m.key === selectedMetric);
  const IconComponent = currentMetric?.icon || BarChart3;

  // Calculate weekday statistics for heatmap
  const weekdayStats = data.weekday_breakdown || [];
  const maxWeekdayValue = Math.max(...weekdayStats.map((d: any) => d.avg_value));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-blue-500 rounded-lg">
          <Calendar className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Daily & Weekly Analysis</h2>
          <p className="text-gray-600">Detailed breakdown with week filters and daily insights</p>
        </div>
      </div>

      {/* Controls */}
      <Card className="p-6">
        {/* Date Range Filter */}
        <div className="mb-4 flex gap-4 items-center">
          <label className="text-sm font-medium text-gray-700">From:
            <input
              type="date"
              name="from"
              value={pendingRange.from}
              onChange={handlePendingRangeChange}
              className="ml-2 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              max={pendingRange.to || undefined}
            />
          </label>
          <label className="text-sm font-medium text-gray-700">To:
            <input
              type="date"
              name="to"
              value={pendingRange.to}
              onChange={handlePendingRangeChange}
              className="ml-2 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              min={pendingRange.from || undefined}
            />
          </label>
          <button
            className="ml-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            onClick={handleApplyRange}
            disabled={!pendingRange.from || !pendingRange.to}
          >
            Apply Range
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          {/* Analysis View Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">View Type</label>
            <select
              value={analysisView}
              onChange={(e) => setAnalysisView(e.target.value as 'weekly' | 'daily')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="weekly">Weekly Breakdown</option>
              <option value="daily">Daily Analysis</option>
            </select>
          </div>

          {/* Metric Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Metric</label>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {METRICS.map(metric => (
                <option key={metric.key} value={metric.key}>
                  {metric.label}
                </option>
              ))}
            </select>
          </div>

          {/* Chart Type Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Chart Type</label>
            <div className="flex space-x-2">
              <button
                onClick={() => setChartType('bar')}
                className={`p-2 rounded ${chartType === 'bar' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                title="Bar Chart"
              >
                <BarChart3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setChartType('line')}
                className={`p-2 rounded ${chartType === 'line' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                title="Line Chart"
              >
                <LineChart className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Week Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Weeks</label>
            <div className="space-y-1">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedWeeks.includes('all')}
                  onChange={() => handleWeekToggle('all')}
                  className="mr-2"
                />
                All Weeks
              </label>
              {[1, 2, 3, 4].map(week => (
                <label key={week} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedWeeks.includes(week.toString())}
                    onChange={() => handleWeekToggle(week.toString())}
                    className="mr-2"
                  />
                  Week {week}
                </label>
              ))}
            </div>
          </div>

          {/* Month Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Months</label>
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
              {data.available_months?.map((month: string) => (
                <label key={month} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedMonths.includes(month)}
                    onChange={() => handleMonthToggle(month)}
                    className="mr-2"
                  />
                  {month}
                </label>
              ))}
            </div>
          </div>

          {/* Notes Date Range removed */}
        </div>

        {/* Weekday Filter - Always visible */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-3">Filter by Days of the Week</label>
          <div className="grid grid-cols-7 gap-2">
            {[
              { day: 0, name: 'Sunday', short: 'Sun', color: 'bg-purple-100 border-purple-300 text-purple-800' },
              { day: 1, name: 'Monday', short: 'Mon', color: 'bg-blue-100 border-blue-300 text-blue-800' },
              { day: 2, name: 'Tuesday', short: 'Tue', color: 'bg-green-100 border-green-300 text-green-800' },
              { day: 3, name: 'Wednesday', short: 'Wed', color: 'bg-yellow-100 border-yellow-300 text-yellow-800' },
              { day: 4, name: 'Thursday', short: 'Thu', color: 'bg-orange-100 border-orange-300 text-orange-800' },
              { day: 5, name: 'Friday', short: 'Fri', color: 'bg-red-100 border-red-300 text-red-800' },
              { day: 6, name: 'Saturday', short: 'Sat', color: 'bg-pink-100 border-pink-300 text-pink-800' }
            ].map((weekday) => (
              <label 
                key={weekday.day} 
                className={`
                  flex flex-col items-center p-2 border-2 rounded-lg cursor-pointer transition-all text-center
                  ${selectedWeekdays.includes(weekday.day) 
                    ? `${weekday.color} border-opacity-100 shadow-md scale-105` 
                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                  }
                `}
              >
                <input
                  type="checkbox"
                  checked={selectedWeekdays.includes(weekday.day)}
                  onChange={() => handleWeekdayToggle(weekday.day)}
                  className="sr-only"
                />
                <div className="text-xs font-bold">{weekday.short}</div>
                <div className="text-xs">{weekday.name}</div>
              </label>
            ))}
          </div>
          <div className="mt-2 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Selected: {selectedWeekdays.length === 7 ? 'All days' : 
                selectedWeekdays.map(d => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]).join(', ')}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedWeekdays([0, 1, 2, 3, 4, 5, 6])}
                className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                All Days
              </button>
              <button
                onClick={() => setSelectedWeekdays([1, 2, 3, 4, 5])}
                className="text-xs px-2 py-1 bg-blue-200 text-blue-700 rounded hover:bg-blue-300"
              >
                Weekdays
              </button>
              <button
                onClick={() => setSelectedWeekdays([5, 6])}
                className="text-xs px-2 py-1 bg-purple-200 text-purple-700 rounded hover:bg-purple-300"
              >
                Weekends
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Analysis Content */}

      {/* Chart View */}
      <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <IconComponent className="h-6 w-6" style={{color: currentMetric?.color}} />
              <div>
                <h3 className="text-lg font-semibold">
                  {analysisView === 'weekly' ? 'Weekly' : 'Daily'} {currentMetric?.label}
                </h3>
                {selectedWeekdays.length < 7 && (
                  <p className="text-sm text-gray-500">
                    Filtered by: {selectedWeekdays.map(d => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]).join(', ')}
                  </p>
                )}
              </div>
            </div>
            <div className="text-sm text-gray-500">
              {data?.rows?.length || 0} {analysisView === 'weekly' ? 'weeks' : 'days'} • {selectedWeeks.includes('all') ? 'All weeks' : `Week ${selectedWeeks.join(', ')}`} • {selectedMonths.includes('all') ? 'All months' : selectedMonths.join(', ')}
            </div>
          </div>

          {/* Custom Legend for Weekdays - only show for line charts */}
          {chartType === 'line' && analysisView === 'daily' && (
            <div className="flex flex-wrap justify-center mb-4 gap-4">
              {[
                { name: 'Sunday', color: '#ef4444', day: 0 },
                { name: 'Monday', color: '#f97316', day: 1 },
                { name: 'Tuesday', color: '#eab308', day: 2 },
                { name: 'Wednesday', color: '#22c55e', day: 3 },
                { name: 'Thursday', color: '#3b82f6', day: 4 },
                { name: 'Friday', color: '#8b5cf6', day: 5 },
                { name: 'Saturday', color: '#ec4899', day: 6 }
              ].filter(day => selectedWeekdays.includes(day.day)).map(day => (
                <div key={day.name} className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2" 
                    style={{backgroundColor: day.color}}
                  ></div>
                  <span className="text-sm text-gray-600">{day.name}</span>
                </div>
              ))}
            </div>
          )}

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'line' ? (
                <RechartsLineChart data={(() => {
                  console.log('Line chart data check:', data);
                  console.log('data.rows:', data?.rows);
                  
                  if (!data?.rows || data.rows.length === 0) {
                    return [];
                  }
                  
                  // Check if we're in daily or weekly view
                  const isDaily = analysisView === 'daily';
                  const dateKey = isDaily ? 'date' : 'week';
                  
                  console.log('Using dateKey:', dateKey, 'for view:', analysisView);
                  
                  if (isDaily) {
                    // Daily view: separate lines for each weekday
                    const allDates = Array.from(new Set(data.rows.map((row: any) => row.date))).sort();
                    console.log('All dates:', allDates);
                    
                    const chartData = allDates.map(date => {
                      const dateEntry: any = { date };
                      
                      // Only initialize selected weekdays
                      const weekdayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                      selectedWeekdays.forEach((selectedDay) => {
                        dateEntry[weekdayNames[selectedDay]] = null;
                      });
                      
                      // Find data for this specific date and populate only selected weekdays
                      const dateData = data.rows.filter((row: any) => row.date === date && selectedWeekdays.includes(row.weekday));
                      dateData.forEach((row: any) => {
                        const weekdayName = weekdayNames[row.weekday];
                        dateEntry[weekdayName] = row.value;
                      });
                      
                      return dateEntry;
                    });
                    
                    console.log('Daily chart data:', chartData);
                    return chartData;
                  } else {
                    // Weekly view: single line
                    console.log('Weekly chart data:', data.rows);
                    return data.rows;
                  }
                })()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey={analysisView === 'daily' ? 'date' : 'week'} 
                    tick={{fontSize: 12}}
                    tickFormatter={(value) => {
                      if (analysisView === 'daily') {
                        const date = new Date(value);
                        return `${date.getMonth() + 1}/${date.getDate()}`;
                      } else {
                        return value; // Week format like "2025-07-W3"
                      }
                    }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis tick={{fontSize: 12}} />
                  <Tooltip 
                    formatter={(value: any, name: any) => {
                      if (value === null || value === undefined) return [null, ''];
                      return [formatValue(value), name];
                    }}
                    labelFormatter={(label) => {
                      if (analysisView === 'daily') {
                        try {
                          const date = new Date(label);
                          if (!isNaN(date.getTime())) {
                            const dateStr = date.toISOString().split('T')[0];
                            const notes = getNotesForDate(dateStr);
                            const noteText = notes.length > 0 ? `\n📝 ${notes.length} note(s): ${notes.map(n => n.title).join(', ')}` : '';
                            return `${date.toLocaleDateString()}${noteText}`;
                          } else {
                            return label;
                          }
                        } catch (error) {
                          console.warn('Invalid date in tooltip label:', label);
                          return label;
                        }
                      } else {
                        const notes = getNotesForWeek(label);
                        const noteText = notes.length > 0 ? `\n📝 ${notes.length} note(s) this week` : '';
                        return `${label}${noteText}`;
                      }
                    }}
                    content={({ active, payload, label }) => {
                      if (!active || !payload || !payload.length) return null;
                      
                      let notes = [];
                      if (analysisView === 'daily') {
                        try {
                          const date = new Date(label);
                          if (!isNaN(date.getTime())) {
                            const dateStr = date.toISOString().split('T')[0];
                            notes = getNotesForDate(dateStr);
                          }
                        } catch (error) {
                          console.warn('Invalid date in line chart tooltip:', label);
                        }
                      } else {
                        notes = getNotesForWeek(label);
                      }
                      
                      return (
                        <div className="bg-white p-3 border border-gray-300 rounded shadow-lg max-w-xs">
                          <p className="font-medium text-gray-900">
                            {analysisView === 'daily' ? (() => {
                              try {
                                const date = new Date(label);
                                return !isNaN(date.getTime()) ? date.toLocaleDateString() : label;
                              } catch {
                                return label;
                              }
                            })() : label}
                          </p>
                          {payload.map((entry, index) => (
                            <p key={index} className="text-sm" style={{ color: entry.color }}>
                              {entry.name}: {formatValue(entry.value)}
                            </p>
                          ))}
                          {notes.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-gray-200">
                              <p className="text-xs font-medium text-gray-700 mb-1">📝 Notes ({notes.length}):</p>
                              {notes.slice(0, 2).map((note, index) => (
                                <div key={index} className="text-xs text-gray-600 mb-1">
                                  <span className="font-medium">{note.title}</span>
                                  {note.content && (
                                    <p className="truncate max-w-48">{note.content.substring(0, 80)}...</p>
                                  )}
                                </div>
                              ))}
                              {notes.length > 2 && (
                                <p className="text-xs text-gray-500">+ {notes.length - 2} more...</p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    }}
                  />
                  {analysisView === 'daily' ? (
                    // Daily view: separate line for each selected weekday only
                    <>
                      {selectedWeekdays.includes(0) && <Line type="monotone" dataKey="Sunday" stroke="#ef4444" strokeWidth={2} dot={<CustomDot fill="#ef4444" stroke="#ef4444" />} connectNulls={true} />}
                      {selectedWeekdays.includes(1) && <Line type="monotone" dataKey="Monday" stroke="#f97316" strokeWidth={2} dot={<CustomDot fill="#f97316" stroke="#f97316" />} connectNulls={true} />}
                      {selectedWeekdays.includes(2) && <Line type="monotone" dataKey="Tuesday" stroke="#eab308" strokeWidth={2} dot={<CustomDot fill="#eab308" stroke="#eab308" />} connectNulls={true} />}
                      {selectedWeekdays.includes(3) && <Line type="monotone" dataKey="Wednesday" stroke="#22c55e" strokeWidth={2} dot={<CustomDot fill="#22c55e" stroke="#22c55e" />} connectNulls={true} />}
                      {selectedWeekdays.includes(4) && <Line type="monotone" dataKey="Thursday" stroke="#3b82f6" strokeWidth={2} dot={<CustomDot fill="#3b82f6" stroke="#3b82f6" />} connectNulls={true} />}
                      {selectedWeekdays.includes(5) && <Line type="monotone" dataKey="Friday" stroke="#8b5cf6" strokeWidth={2} dot={<CustomDot fill="#8b5cf6" stroke="#8b5cf6" />} connectNulls={true} />}
                      {selectedWeekdays.includes(6) && <Line type="monotone" dataKey="Saturday" stroke="#ec4899" strokeWidth={2} dot={<CustomDot fill="#ec4899" stroke="#ec4899" />} connectNulls={true} />}
                    </>
                  ) : (
                    // Weekly view: single line
                    <Line 
                      type="monotone" 
                      dataKey="value"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      dot={{fill: "#3b82f6", strokeWidth: 2, r: 4}}
                    />
                  )}
                </RechartsLineChart>
              ) : (
                <BarChart data={data.rows}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey={analysisView === 'weekly' ? 'week' : 'date'} 
                    tick={{fontSize: 12}}
                    tickFormatter={analysisView === 'daily' ? 
                      (value) => {
                        const date = new Date(value);
                        return `${date.getMonth() + 1}/${date.getDate()} (${getWeekdayName(date.getDay()).slice(0, 3)})`;
                      } : undefined
                    }
                    angle={analysisView === 'daily' ? -45 : 0}
                    textAnchor={analysisView === 'daily' ? 'end' : 'middle'}
                    height={analysisView === 'daily' ? 60 : 30}
                  />
                  <YAxis tick={{fontSize: 12}} />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (!active || !payload || !payload.length) return null;
                      
                      let notes = [];
                      if (analysisView === 'daily') {
                        try {
                          const date = new Date(label);
                          if (!isNaN(date.getTime())) {
                            const dateStr = date.toISOString().split('T')[0];
                            notes = getNotesForDate(dateStr);
                          }
                        } catch (error) {
                          console.warn('Invalid date in bar chart tooltip:', label);
                        }
                      } else {
                        notes = getNotesForWeek(label);
                      }
                      
                      return (
                        <div className="bg-white p-3 border border-gray-300 rounded shadow-lg max-w-xs">
                          <p className="font-medium text-gray-900">
                            {analysisView === 'daily' 
                              ? (() => {
                                  try {
                                    const date = new Date(label);
                                    if (!isNaN(date.getTime())) {
                                      return `${date.toLocaleDateString()} (${getWeekdayName(date.getDay())})`;
                                    } else {
                                      return label;
                                    }
                                  } catch {
                                    return label;
                                  }
                                })()
                              : `${analysisView === 'weekly' ? 'Week' : 'Date'}: ${label}`
                            }
                          </p>
                          {payload.map((entry, index) => (
                            <p key={index} className="text-sm" style={{ color: entry.color }}>
                              {entry.name || currentMetric?.label}: {formatValue(entry.value)}
                            </p>
                          ))}
                          {notes.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-gray-200">
                              <p className="text-xs font-medium text-gray-700 mb-1">📝 Notes ({notes.length}):</p>
                              {notes.slice(0, 2).map((note, index) => (
                                <div key={index} className="text-xs text-gray-600 mb-1">
                                  <span className="font-medium">{note.title}</span>
                                  {note.content && (
                                    <p className="truncate max-w-48">{note.content.substring(0, 80)}...</p>
                                  )}
                                </div>
                              ))}
                              {notes.length > 2 && (
                                <p className="text-xs text-gray-500">+ {notes.length - 2} more...</p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    }}
                  />
                  <Bar 
                    dataKey="value" 
                    fill={currentMetric?.color}
                    radius={[4, 4, 0, 0]}
                    shape={(props: any) => {
                      const { payload } = props;
                      let hasNotesForThisDate = false;
                      
                      if (analysisView === 'daily' && payload && payload.date) {
                        try {
                          const date = new Date(payload.date);
                          if (!isNaN(date.getTime())) {
                            const dateStr = date.toISOString().split('T')[0];
                            hasNotesForThisDate = hasNotes(dateStr);
                          }
                        } catch (error) {
                          console.warn('Invalid date in payload:', payload.date);
                        }
                      } else if (analysisView === 'weekly' && payload && payload.week) {
                        const notes = getNotesForWeek(payload.week);
                        hasNotesForThisDate = notes.length > 0;
                      }
                      
                      return (
                        <g>
                          <rect {...props} style={{
                            ...props.style,
                            stroke: hasNotesForThisDate ? '#F59E0B' : 'none',
                            strokeWidth: hasNotesForThisDate ? 3 : 0
                          }} />
                          {hasNotesForThisDate && (
                            <text 
                              x={props.x + props.width / 2} 
                              y={props.y - 5} 
                              textAnchor="middle" 
                              fontSize="12" 
                              fill="#F59E0B"
                            >
                              📝
                            </text>
                          )}
                        </g>
                      );
                    }}
                  />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* Daily View Additional Info */}
          {analysisView === 'daily' && data.rows.length > 0 && (
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="text-sm font-medium text-blue-800">Total Days</div>
                <div className="text-lg font-bold text-blue-900">{data.rows.length}</div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="text-sm font-medium text-green-800">Best Day</div>
                <div className="text-lg font-bold text-green-900">
                  {(() => {
                    const bestDay = data.rows.reduce((best: any, current: any) => 
                      current.value > best.value ? current : best
                    );
                    const date = new Date(bestDay.date);
                    return getWeekdayName(date.getDay()).slice(0, 3);
                  })()}
                </div>
                <div className="text-xs text-green-600">
                  {formatValue(Math.max(...data.rows.map((d: any) => d.value)))}
                </div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="text-sm font-medium text-red-800">Lowest Day</div>
                <div className="text-lg font-bold text-red-900">
                  {(() => {
                    const worstDay = data.rows.reduce((worst: any, current: any) => 
                      current.value < worst.value ? current : worst
                    );
                    const date = new Date(worstDay.date);
                    return getWeekdayName(date.getDay()).slice(0, 3);
                  })()}
                </div>
                <div className="text-xs text-red-600">
                  {formatValue(Math.min(...data.rows.map((d: any) => d.value)))}
                </div>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <div className="text-sm font-medium text-gray-800">Average</div>
                <div className="text-lg font-bold text-gray-900">
                  {formatValue(data.rows.reduce((sum: number, d: any) => sum + d.value, 0) / data.rows.length)}
                </div>
              </div>
            </div>
          )}
        </Card>

      {/* Notes Date Range display removed */}

      {/* Weekly Summary (only in weekly view) */}
      {analysisView === 'weekly' && data.weekly_summary && (
        <Card className="p-6">
          <h4 className="text-lg font-semibold mb-4">Weekly Performance Summary</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-800">Best Week</p>
                  <p className="text-lg font-bold text-green-900">Week {data.weekly_summary.best_week.week}</p>
                  <p className="text-xs text-green-600">{formatValue(data.weekly_summary.best_week.value)}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <ArrowDown className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-sm font-medium text-red-800">Worst Week</p>
                  <p className="text-lg font-bold text-red-900">Week {data.weekly_summary.worst_week.week}</p>
                  <p className="text-xs text-red-600">{formatValue(data.weekly_summary.worst_week.value)}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-blue-800">Average</p>
                  <p className="text-lg font-bold text-blue-900">{formatValue(data.weekly_summary.avg_value)}</p>
                  <p className="text-xs text-blue-600">across {data.weekly_summary.total_weeks} weeks</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Notes Section */}
      <div className="bg-white rounded-lg shadow p-6 mt-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">📝 Notes for Selected Period</h3>
        <NotesSection 
          notes={notesData?.notes || []} 
          selectedMonths={selectedMonths}
          selectedWeeks={selectedWeeks}
          analysisView={analysisView}
        />
      </div>
    </div>
  );
};

export default DailyWeeklyAnalysis;

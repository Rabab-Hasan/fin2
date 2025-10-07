import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Trophy, Info, Award, Target, TrendingUp, Star, Medal, Crown } from 'lucide-react';
import Card from './Card';

const METRICS = [
  { key: 'registered_onboarded', label: 'Registered Onboarded', icon: Target, color: '#3B82F6' },
  { key: 'linked_accounts', label: 'Linked Accounts', icon: Target, color: '#10B981' },
  { key: 'total_advance_applications', label: 'Total Advance Applications', icon: Target, color: '#F59E0B' },
  { key: 'total_advance_applicants', label: 'Total Advance Applicants', icon: Target, color: '#8B5CF6' },
  { key: 'total_micro_financing_applications', label: 'Total Micro Financing Applications', icon: Target, color: '#EF4444' },
  { key: 'total_micro_financing_applicants', label: 'Total Micro Financing Applicants', icon: Target, color: '#06B6D4' },
  { key: 'total_personal_finance_application', label: 'Total Personal Finance Applications', icon: Target, color: '#84CC16' },
  { key: 'total_personal_finance_applicants', label: 'Total Personal Finance Applicants', icon: Target, color: '#F97316' }
];

// Analytics API calls
const analyticsApi = {
  getBestMonth: async (params: any) => {
    const searchParams = new URLSearchParams();
    if (params.metric) searchParams.append('metric', params.metric);
    if (params.weeks) searchParams.append('weeks', params.weeks);
    
    const response = await fetch(`/api/analytics/best-month?${searchParams}`);
    if (!response.ok) throw new Error('Failed to fetch best month analysis');
    return response.json();
  },
  getAllNotes: async () => {
    const response = await fetch('/api/notes');
    if (!response.ok) throw new Error('Failed to fetch notes');
    return response.json();
  }
};

// NotesSection component for best month analysis  
const NotesSection = ({ notes }: {
  notes: any[];
}) => {
  if (notes.length === 0) {
    return (
      <div className="text-gray-500 text-center py-8">
        No notes found in your data.
      </div>
    );
  }

  // Group notes by date
  const notesByDate = notes.reduce((acc: any, note: any) => {
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

const BestMonthAnalysis: React.FC = () => {
  const [selectedMetric, setSelectedMetric] = useState('total_advance_applicants');
  const [selectedWeeks, setSelectedWeeks] = useState('all');
  const [showTooltip, setShowTooltip] = useState(false);
  const [viewMode, setViewMode] = useState<'leaderboard' | 'analysis'>('leaderboard');

  const { data, isLoading, error } = useQuery({
    queryKey: ['best-month', selectedMetric, selectedWeeks],
    queryFn: () => analyticsApi.getBestMonth({
      metric: selectedMetric,
      weeks: selectedWeeks
    })
  });

  // Fetch all notes
  const { data: notesData } = useQuery({
    queryKey: ['all-notes'],
    queryFn: () => analyticsApi.getAllNotes()
  });

  const chartData = data?.scores?.map((score: any) => ({
    month: score.month,
    score: score.score,
    value: score.value,
    rank: score.rank
  })) || [];

  const selectedMetricData = METRICS.find(m => m.key === selectedMetric);

  const formatValue = (value: number) => {
    if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
    if (value >= 1000) return (value / 1000).toFixed(1) + 'K';
    return value.toLocaleString();
  };

  const getMedalIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="h-6 w-6 text-yellow-500" />;
      case 2: return <Medal className="h-6 w-6 text-gray-400" />;
      case 3: return <Award className="h-6 w-6 text-orange-400" />;
      default: return <Star className="h-4 w-4 text-gray-300" />;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'from-yellow-50 to-yellow-100 border-yellow-200';
      case 2: return 'from-gray-50 to-gray-100 border-gray-200';
      case 3: return 'from-orange-50 to-orange-100 border-orange-200';
      default: return 'from-gray-50 to-gray-50 border-gray-200';
    }
  };

  const getRecommendations = () => {
    if (!data?.winner) return [];
    
    const winner = data.winner;
    const recommendations = [];
    
    // Performance-based recommendations
    if (winner.score > 0.8) {
      recommendations.push({
        type: 'success',
        title: 'Replicate Success Factors',
        description: `${winner.month} achieved exceptional performance. Analyze and replicate the strategies, campaigns, and conditions that led to this success.`
      });
    }
    
    if (data.scores?.length > 3) {
      const consistentPerformers = data.scores.filter((s: any) => s.score > 0.6).length;
      if (consistentPerformers >= 3) {
        recommendations.push({
          type: 'strategy',
          title: 'Build on Consistent Performance',
          description: `You have ${consistentPerformers} months with strong performance. Focus on maintaining consistency while optimizing peak periods.`
        });
      }
    }

    // Stability-based recommendations
    if (data.explain?.weights?.stability > 0.2) {
      recommendations.push({
        type: 'optimization',
        title: 'Stability-Focused Growth',
        description: 'Your scoring factors in performance stability. Consider implementing more predictable, sustainable growth strategies.'
      });
    }

    return recommendations;
  };

  return (
    <Card title="🏆 Best Month Analysis - Top Performing Periods">
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

          {/* Week Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Include Weeks
            </label>
            <div className="flex flex-wrap gap-1">
              {['all', '1', '2', '3', '4', '5'].map(week => (
                <button
                  key={week}
                  onClick={() => setSelectedWeeks(week)}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                    selectedWeeks === week
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {week === 'all' ? 'All' : `W${week}`}
                </button>
              ))}
            </div>
          </div>

          {/* View Mode */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              View Mode
            </label>
            <div className="flex gap-1">
              <button
                onClick={() => setViewMode('leaderboard')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  viewMode === 'leaderboard'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Leaderboard
              </button>
              <button
                onClick={() => setViewMode('analysis')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  viewMode === 'analysis'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Analysis
              </button>
            </div>
          </div>

          {/* Info */}
          <div className="flex items-end">
            <div className="relative">
              <button
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md px-3 py-2"
              >
                <Info className="h-4 w-4" />
                <span>Scoring Info</span>
              </button>
              {showTooltip && data?.explain && (
                <div className="absolute bottom-full mb-2 right-0 bg-gray-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap z-10">
                  <div>Method: {data.explain.method}</div>
                  <div>Volume: {data.explain.weights.volume * 100}% | Stability: {data.explain.weights.stability * 100}%</div>
                </div>
              )}
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

        {data && data.scores && data.scores.length > 0 && selectedMetricData ? (
          <>
            {/* Winner Spotlight */}
            {data.winner && (
              <div className={`bg-gradient-to-r ${getRankColor(1)} border rounded-xl p-6`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-yellow-500 rounded-full">
                      <Crown className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-yellow-800">
                        🎉 Champion: {data.winner.month}
                      </h3>
                      <p className="text-yellow-700 text-lg">
                        Score: {data.winner.score} | Performance: {formatValue(data.winner.value)} {selectedMetricData.label.toLowerCase()}
                      </p>
                      <p className="text-sm text-yellow-600 mt-1">
                        Outstanding performance with optimal balance of volume and consistency
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-yellow-800">#1</div>
                    <div className="text-sm text-yellow-600">of {data.scores.length} months</div>
                  </div>
                </div>
              </div>
            )}

            {/* Podium View */}
            {viewMode === 'leaderboard' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {data.scores.slice(0, 3).map((score: any, index: number) => (
                  <div 
                    key={score.month}
                    className={`bg-gradient-to-r ${getRankColor(score.rank)} border rounded-lg p-6 ${
                      score.rank === 1 ? 'transform scale-105' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        {getMedalIcon(score.rank)}
                        <div>
                          <div className="text-lg font-bold text-gray-900">#{score.rank}</div>
                          <div className="text-sm text-gray-600">
                            {score.rank === 1 ? 'Champion' : score.rank === 2 ? 'Runner-up' : 'Third Place'}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="text-xl font-bold text-gray-900">{score.month}</h4>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Score</span>
                        <span className="font-medium">{score.score}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Volume</span>
                        <span className="font-medium">{formatValue(score.value)}</span>
                      </div>
                      
                      {/* Progress bar */}
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                        <div 
                          className={`h-2 rounded-full ${
                            score.rank === 1 ? 'bg-yellow-500' :
                            score.rank === 2 ? 'bg-gray-400' : 'bg-orange-400'
                          }`}
                          style={{ width: `${score.score * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Chart View */}
            {viewMode === 'analysis' && (
              <div className="bg-white rounded-lg border p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Performance Score Distribution</h3>
                  <div className="text-sm text-gray-500">
                    {selectedWeeks === 'all' ? 'All weeks' : `Week ${selectedWeeks}`} • {data.scores.length} months
                  </div>
                </div>
                
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="month" 
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        domain={[0, 1]}
                      />
                      <Tooltip 
                        formatter={(value: any, name: string) => [
                          name === 'score' ? `${(value * 100).toFixed(1)}%` : formatValue(value),
                          name === 'score' ? 'Performance Score' : 'Volume'
                        ]}
                        labelFormatter={(label) => `Month: ${label}`}
                      />
                      <Bar 
                        dataKey="score" 
                        fill={selectedMetricData.color}
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Detailed Ranking Table */}
            <div className="bg-white rounded-lg border overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Complete Rankings & Performance Metrics</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rank
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Month
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Performance Score
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Volume
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Achievement
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Performance Level
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.scores.map((score: any, index: number) => {
                      const scorePercentage = score.score * 100;
                      const performanceLevel = scorePercentage >= 80 ? 'Excellent' : 
                                             scorePercentage >= 60 ? 'Good' : 
                                             scorePercentage >= 40 ? 'Average' : 'Needs Improvement';
                      const performanceColor = scorePercentage >= 80 ? 'text-green-800 bg-green-100' : 
                                             scorePercentage >= 60 ? 'text-blue-800 bg-blue-100' : 
                                             scorePercentage >= 40 ? 'text-yellow-800 bg-yellow-100' : 'text-red-800 bg-red-100';
                      
                      return (
                        <tr key={score.month} className={score.rank <= 3 ? 'bg-gray-50' : 'bg-white'}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              {getMedalIcon(score.rank)}
                              <span className="text-lg font-bold text-gray-900">#{score.rank}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {score.month}
                            {score.rank === 1 && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                🏆 Champion
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-gray-900">{scorePercentage.toFixed(1)}%</span>
                              <div className="w-20 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${scorePercentage}%` }}
                                ></div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {formatValue(score.value)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {score.rank === 1 && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                � Best Overall
                              </span>
                            )}
                            {score.rank === 2 && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                🥈 Runner-up
                              </span>
                            )}
                            {score.rank === 3 && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                🥉 Third Place
                              </span>
                            )}
                            {score.rank > 3 && scorePercentage >= 70 && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                ⭐ Strong Performer
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${performanceColor}`}>
                              {performanceLevel}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Strategic Recommendations */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <h4 className="text-lg font-semibold text-blue-900">Strategic Recommendations</h4>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {getRecommendations().map((rec, index) => (
                  <div key={index} className="bg-white rounded-lg p-4 border border-blue-100">
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg ${
                        rec.type === 'success' ? 'bg-green-100 text-green-600' :
                        rec.type === 'strategy' ? 'bg-blue-100 text-blue-600' :
                        'bg-orange-100 text-orange-600'
                      }`}>
                        <Target className="h-4 w-4" />
                      </div>
                      <div>
                        <h5 className="font-medium text-gray-900 mb-1">{rec.title}</h5>
                        <p className="text-sm text-gray-600">{rec.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Scoring Methodology */}
            {data.explain && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
                  <Info className="h-4 w-4" />
                  <span>Scoring Methodology</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                  <div>
                    <p><strong>Method:</strong> {data.explain.method.charAt(0).toUpperCase() + data.explain.method.slice(1)} normalization</p>
                    <p><strong>Factors:</strong> Volume performance + Consistency stability</p>
                  </div>
                  <div>
                    <p><strong>Volume Weight:</strong> {(data.explain.weights.volume * 100).toFixed(0)}% of total score</p>
                    <p><strong>Stability Weight:</strong> {(data.explain.weights.stability * 100).toFixed(0)}% of total score</p>
                  </div>
                  <div>
                    <p><strong>Formula:</strong> {data.explain.notes}</p>
                    <p><strong>Data Points:</strong> {data.scores.length} months analyzed</p>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          !isLoading && (
            <div className="text-center py-12">
              <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Trophy className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Performance Data Available</h3>
              <p className="text-gray-500 mb-4">Import your financial data to identify top performing months and get strategic insights.</p>
              <button className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 transition-colors">
                Go to Data Import
              </button>
            </div>
          )
        )}
      </div>

      {/* Notes Section */}
      <div className="bg-white rounded-lg shadow p-6 mt-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">📝 All Notes</h3>
        <NotesSection 
          notes={notesData?.notes || []} 
        />
      </div>
    </Card>
  );
};

export default BestMonthAnalysis;

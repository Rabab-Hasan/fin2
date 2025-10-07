import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  TrendingUp, 
  AlertTriangle, 
  Clock, 
  Target, 
  Lightbulb,
  Plus,
  Download,
  Copy,
  CheckCircle,
  X,
  Brain,
  Zap,
  BarChart3,
  Users,
  DollarSign,
  Calendar
} from 'lucide-react';
import Card from './Card';

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

const PRIORITY_COLORS = {
  high: 'border-red-200 bg-red-50',
  medium: 'border-yellow-200 bg-yellow-50',
  low: 'border-green-200 bg-green-50'
};

const TYPE_ICONS = {
  opportunity: TrendingUp,
  risk: AlertTriangle,
  timing: Clock,
  channel: Target,
  creative: Lightbulb
};

// Analytics API calls
const analyticsApi = {
  getStrategyAdvisor: async (params: any) => {
    const searchParams = new URLSearchParams();
    if (params.metric) searchParams.append('metric', params.metric);
    if (params.weeks) searchParams.append('weeks', params.weeks);
    if (params.months) searchParams.append('months', params.months);
    
    const response = await fetch(`/api/analytics/strategy-advisor?${searchParams}`);
    if (!response.ok) throw new Error('Failed to fetch strategy advisor data');
    return response.json();
  }
};

// Mock notes API (you would replace this with actual implementation)
const notesApi = {
  create: async (noteData: any) => {
    // Mock implementation - replace with actual API call
    console.log('Creating note:', noteData);
    return { id: Date.now(), ...noteData };
  }
};

const MarketingStrategyAdvisor: React.FC = () => {
  const [selectedMetric, setSelectedMetric] = useState('total_advance_applicants');
  const [selectedWeeks, setSelectedWeeks] = useState('all');
  const [selectedMonths, setSelectedMonths] = useState('all');
  const [checklist, setChecklist] = useState<any[]>([]);
  const [showChecklist, setShowChecklist] = useState(false);
  const [viewMode, setViewMode] = useState<'insights' | 'comparisons'>('insights');

  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['strategy-advisor', selectedMetric, selectedWeeks, selectedMonths],
    queryFn: () => analyticsApi.getStrategyAdvisor({
      metric: selectedMetric,
      weeks: selectedWeeks,
      months: selectedMonths
    })
  });

  const createNoteMutation = useMutation({
    mutationFn: notesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['notes']);
    }
  });

  const handleCreateNote = (insight: any) => {
    const noteData = {
      title: insight.title,
      content: `Evidence: ${JSON.stringify(insight.evidence)}\n\nRecommendation: ${insight.recommendation}`,
      tags: ['advisor', 'auto', insight.type],
      report_date: new Date().toISOString().split('T')[0]
    };

    createNoteMutation.mutate(noteData);
  };

  const handleAddToChecklist = (insight: any) => {
    const taskId = `task-${insight.id}`;
    const existingTask = checklist.find(item => item.id === taskId);
    
    if (!existingTask) {
      const newTask = {
        id: taskId,
        label: `Action: ${insight.title}`,
        details: insight.recommendation,
        priority: insight.priority,
        owner: null,
        due: null,
        completed: false
      };
      setChecklist(prev => [...prev, newTask]);
    }
  };

  const handleRemoveFromChecklist = (taskId: string) => {
    setChecklist(prev => prev.filter(item => item.id !== taskId));
  };

  const handleToggleTaskComplete = (taskId: string) => {
    setChecklist(prev => 
      prev.map(item => 
        item.id === taskId ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const exportChecklistCSV = () => {
    const headers = ['Task', 'Priority', 'Details', 'Owner', 'Due Date', 'Status'];
    const rows = checklist.map(item => [
      item.label,
      item.priority,
      item.details,
      item.owner || 'Unassigned',
      item.due || 'No due date',
      item.completed ? 'Completed' : 'Pending'
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `marketing-strategy-checklist-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const copyChecklistToClipboard = () => {
    const text = checklist
      .map(item => `□ ${item.label} (${item.priority.toUpperCase()})`)
      .join('\n');
    navigator.clipboard.writeText(text);
  };

  const getTypeIcon = (type: string) => {
    const Icon = TYPE_ICONS[type as keyof typeof TYPE_ICONS] || Lightbulb;
    return Icon;
  };

  const selectedMetricData = METRICS.find(m => m.key === selectedMetric);

  // Enhanced insights categorization
  const categorizeInsights = () => {
    if (!data?.insights) return {};
    
    return data.insights.reduce((acc: any, insight: any) => {
      if (!acc[insight.type]) acc[insight.type] = [];
      acc[insight.type].push(insight);
      return acc;
    }, {});
  };

  const getInsightStats = () => {
    if (!data?.insights) return { total: 0, high: 0, medium: 0, low: 0 };
    
    return data.insights.reduce((acc: any, insight: any) => {
      acc.total++;
      acc[insight.priority]++;
      return acc;
    }, { total: 0, high: 0, medium: 0, low: 0 });
  };

  return (
    <div className="space-y-6">
      <Card title="🤖 Marketing Strategy Advisor - AI-Powered Insights">
        <div className="space-y-6">
          {/* Controls Row */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
                Weeks
              </label>
              <select
                value={selectedWeeks}
                onChange={(e) => setSelectedWeeks(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Weeks</option>
                <option value="1">Week 1</option>
                <option value="2">Week 2</option>
                <option value="3">Week 3</option>
                <option value="4">Week 4</option>
                <option value="5">Week 5</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Months
              </label>
              <select
                value={selectedMonths}
                onChange={(e) => setSelectedMonths(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Months</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                View Mode
              </label>
              <div className="flex gap-1">
                <button
                  onClick={() => setViewMode('insights')}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    viewMode === 'insights'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Insights
                </button>
                <button
                  onClick={() => setViewMode('comparisons')}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    viewMode === 'comparisons'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Compare
                </button>
              </div>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => setShowChecklist(!showChecklist)}
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 border border-blue-300 rounded-md px-3 py-2 w-full justify-center"
              >
                <Target className="h-4 w-4" />
                <span>Action Plan ({checklist.length})</span>
              </button>
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
              <p className="text-red-800">Error loading insights: {(error as Error)?.message || 'Unknown error'}</p>
            </div>
          )}

          {/* AI Analysis Status */}
          {data && (
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-500 rounded-lg">
                    <Brain className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-purple-900">AI Analysis Complete</h3>
                    <p className="text-sm text-purple-700">
                      Generated at {new Date(data.generated_at).toLocaleString()} • 
                      Analyzing {selectedMetricData?.label.toLowerCase()} patterns
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-purple-900">{getInsightStats().total}</div>
                  <div className="text-xs text-purple-600">insights found</div>
                </div>
              </div>
            </div>
          )}

          {/* Insights Dashboard */}
          {data && data.insights && data.insights.length > 0 && (
            <>
              {/* Insight Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-red-500 rounded-lg">
                      <Zap className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-red-800">High Priority</p>
                      <p className="text-xl font-bold text-red-900">{getInsightStats().high}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-yellow-500 rounded-lg">
                      <Clock className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-yellow-800">Medium Priority</p>
                      <p className="text-xl font-bold text-yellow-900">{getInsightStats().medium}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-500 rounded-lg">
                      <Target className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-green-800">Low Priority</p>
                      <p className="text-xl font-bold text-green-900">{getInsightStats().low}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-500 rounded-lg">
                      <BarChart3 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-800">Total Insights</p>
                      <p className="text-xl font-bold text-blue-900">{getInsightStats().total}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Insights by Category */}
              {viewMode === 'insights' && (
                <div className="space-y-6">
                  {Object.entries(categorizeInsights()).map(([type, insights]: [string, any]) => (
                    <div key={type} className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${
                          type === 'opportunity' ? 'bg-green-100 text-green-600' :
                          type === 'risk' ? 'bg-red-100 text-red-600' :
                          type === 'timing' ? 'bg-blue-100 text-blue-600' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {React.createElement(getTypeIcon(type), { className: "h-5 w-5" })}
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 capitalize">
                          {type} Insights ({insights.length})
                        </h3>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {insights.map((insight: any, index: number) => {
                          const isInChecklist = checklist.some(item => item.id === `task-${insight.id}`);
                          
                          return (
                            <div 
                              key={insight.id}
                              className={`border rounded-lg p-4 ${PRIORITY_COLORS[insight.priority as keyof typeof PRIORITY_COLORS]} hover:shadow-md transition-shadow`}
                            >
                              <div className="space-y-3">
                                <div className="flex items-start justify-between">
                                  <h4 className="font-medium text-gray-900 flex-1">{insight.title}</h4>
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ml-2 ${
                                    insight.priority === 'high' ? 'bg-red-100 text-red-800' :
                                    insight.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-green-100 text-green-800'
                                  }`}>
                                    {insight.priority.toUpperCase()}
                                  </span>
                                </div>
                                
                                <div className="text-sm text-gray-600">
                                  <strong>🔍 Evidence:</strong> {JSON.stringify(insight.evidence)}
                                </div>
                                
                                <div className="text-sm text-gray-800">
                                  <strong>💡 Strategy:</strong> {insight.recommendation}
                                </div>
                                
                                <div className="flex space-x-2 pt-2">
                                  <button
                                    onClick={() => handleCreateNote(insight)}
                                    disabled={createNoteMutation.isLoading}
                                    className="flex items-center space-x-1 text-xs bg-blue-500 text-white px-3 py-1.5 rounded hover:bg-blue-600 disabled:opacity-50 transition-colors"
                                  >
                                    <Plus className="h-3 w-3" />
                                    <span>Save Note</span>
                                  </button>
                                  
                                  <button
                                    onClick={() => handleAddToChecklist(insight)}
                                    disabled={isInChecklist}
                                    className={`flex items-center space-x-1 text-xs px-3 py-1.5 rounded transition-colors ${
                                      isInChecklist 
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                        : 'bg-green-500 text-white hover:bg-green-600'
                                    }`}
                                  >
                                    {isInChecklist ? <CheckCircle className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                                    <span>{isInChecklist ? 'In Plan' : 'Add to Plan'}</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Comparison View */}
              {viewMode === 'comparisons' && (
                <div className="bg-white rounded-lg border p-6">
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Data-Driven Comparisons</h3>
                    <p className="text-sm text-gray-600">
                      AI analysis comparing {selectedMetricData?.label.toLowerCase()} performance across different time periods and patterns.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Performance Patterns */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900 flex items-center space-x-2">
                        <Calendar className="h-4 w-4" />
                        <span>Temporal Patterns</span>
                      </h4>
                      {data.insights
                        .filter((insight: any) => insight.type === 'timing')
                        .slice(0, 3)
                        .map((insight: any) => (
                          <div key={insight.id} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="text-sm font-medium text-blue-900">{insight.title}</div>
                            <div className="text-xs text-blue-700 mt-1">
                              Evidence: {Object.entries(insight.evidence).map(([key, value]) => 
                                `${key}: ${value}`
                              ).join(', ')}
                            </div>
                          </div>
                        ))
                      }
                    </div>

                    {/* Opportunity Analysis */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900 flex items-center space-x-2">
                        <TrendingUp className="h-4 w-4" />
                        <span>Growth Opportunities</span>
                      </h4>
                      {data.insights
                        .filter((insight: any) => insight.type === 'opportunity')
                        .slice(0, 3)
                        .map((insight: any) => (
                          <div key={insight.id} className="p-3 bg-green-50 rounded-lg border border-green-200">
                            <div className="text-sm font-medium text-green-900">{insight.title}</div>
                            <div className="text-xs text-green-700 mt-1">
                              Evidence: {Object.entries(insight.evidence).map(([key, value]) => 
                                `${key}: ${value}`
                              ).join(', ')}
                            </div>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* No Data */}
          {data && (!data.insights || data.insights.length === 0) && (
            <div className="text-center py-12">
              <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Brain className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Strategic Insights Available</h3>
              <p className="text-gray-500 mb-4">The AI needs more data patterns to generate meaningful marketing insights.</p>
              <button className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 transition-colors">
                Import More Data
              </button>
            </div>
          )}
        </div>
      </Card>

      {/* Action Plan Checklist */}
      {showChecklist && (
        <Card title="🎯 Marketing Action Plan">
          <div className="space-y-4">
            {checklist.length === 0 ? (
              <div className="text-center py-8">
                <div className="bg-gray-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                  <Target className="h-6 w-6 text-gray-400" />
                </div>
                <p className="text-gray-500 text-center">
                  No action items yet. Add insights from above to build your strategic action plan.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <p className="text-sm text-gray-600">
                      {checklist.filter(item => item.completed).length} of {checklist.length} completed
                    </p>
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(checklist.filter(item => item.completed).length / checklist.length) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={copyChecklistToClipboard}
                      className="flex items-center space-x-1 text-sm bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600 transition-colors"
                    >
                      <Copy className="h-3 w-3" />
                      <span>Copy</span>
                    </button>
                    <button
                      onClick={exportChecklistCSV}
                      className="flex items-center space-x-1 text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition-colors"
                    >
                      <Download className="h-3 w-3" />
                      <span>Export</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {checklist.map(item => (
                    <div key={item.id} className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={() => handleToggleTaskComplete(item.id)}
                        className="w-4 h-4 text-blue-600 mt-1"
                      />
                      <div className="flex-1">
                        <div className={`font-medium ${item.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                          {item.label}
                        </div>
                        <div className={`text-sm mt-1 ${item.completed ? 'line-through text-gray-400' : 'text-gray-600'}`}>
                          {item.details}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          item.priority === 'high' ? 'bg-red-100 text-red-800' :
                          item.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {item.priority.toUpperCase()}
                        </span>
                        <button
                          onClick={() => handleRemoveFromChecklist(item.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Quick Actions */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">💼 Quick Actions</h4>
                  <div className="flex space-x-3 text-sm">
                    <button 
                      onClick={() => setChecklist(prev => prev.map(item => ({ ...item, completed: true })))}
                      className="text-blue-700 hover:text-blue-900 underline"
                    >
                      Mark All Complete
                    </button>
                    <button 
                      onClick={() => setChecklist(prev => prev.map(item => ({ ...item, completed: false })))}
                      className="text-blue-700 hover:text-blue-900 underline"
                    >
                      Reset All
                    </button>
                    <button 
                      onClick={() => setChecklist([])}
                      className="text-red-700 hover:text-red-900 underline"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default MarketingStrategyAdvisor;

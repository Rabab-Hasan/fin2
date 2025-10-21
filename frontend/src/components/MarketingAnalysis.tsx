import React, { useState } from 'react';
import { 
  Upload, 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Target, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  FileText,
  Download,
  Loader,
  Eye,
  Zap,
  ArrowUp,
  ArrowDown,
  Calendar,
  Filter
} from 'lucide-react';
import secureApiClient from '../utils/secure-api-client';

interface AnalysisResults {
  summary: {
    totalRecords: number;
    totalCost: number;
    totalInstalls: number;
    totalOnboarding: number;
    avgCPI: number;
    overallConversionRate: number;
    dateRange: {
      start: string;
      end: string;
    };
  };
  cleaning: {
    originalCount: number;
    cleanedCount: number;
    removedCount: number;
  };
  timeAnalysis: {
    daily: Array<{
      date: string;
      total_cost: number;
      total_installs: number;
      total_onboarding: number;
      total_registered: number;
      records: number;
    }>;
    hourly: Array<{
      hour: number;
      total_cost: number;
      total_installs: number;
      total_onboarding: number;
      avg_cpi: number;
      records: number;
    }>;
    hourlyComparison: Array<{
      hour: number;
      dailyBreakdown: Record<string, {
        date: string;
        cost: number;
        installs: number;
        onboarding: number;
        cpi: number;
        conversion_rate: number;
      }>;
      totalCost: number;
      totalInstalls: number;
      totalOnboarding: number;
      avgCPI: number;
      bestDay: {
        date: string;
        cost: number;
        installs: number;
        onboarding: number;
        cpi: number;
        conversion_rate: number;
      } | null;
      worstDay: {
        date: string;
        cost: number;
        installs: number;
        onboarding: number;
        cpi: number;
        conversion_rate: number;
      } | null;
    }>;
  };
  campaignAnalysis: {
    channels: Array<{
      channel: string;
      total_cost: number;
      total_installs: number;
      total_onboarding: number;
      total_registered: number;
      avg_cpi: number;
      conversion_rate: number;
      campaign_count: number;
    }>;
    campaigns: Array<{
      campaign: string;
      channel: string;
      total_cost: number;
      total_installs: number;
      total_onboarding: number;
      avg_cpi: number;
      conversion_rate: number;
    }>;
  };
  userJourney: {
    funnel: Array<{
      step: string;
      count: number;
      percentage: number;
      dropoff: number;
    }>;
    criticalDropoffs: Array<{
      step: string;
      dropoff: number;
      impact: string;
    }>;
    overallConversionRate: number;
  };
  trends: {
    anomalies: Array<{
      type: string;
      metric: string;
      date: string;
      value: number;
      average: number;
      deviation: number;
    }>;
    trends: Array<{
      metric: string;
      direction: string;
      change: number;
      period: string;
    }>;
  };
  insights: Array<{
    type: string;
    title: string;
    description: string;
    priority: string;
    data?: any;
  }>;
  recommendations: Array<{
    type: string;
    title: string;
    description: string;
    impact: string;
    effort: string;
  }>;
}

const MarketingAnalysis: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<AnalysisResults | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResults, setValidationResults] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'summary' | 'channels' | 'campaigns' | 'journey' | 'trends' | 'insights' | 'hourly-comparison'>('upload');
  const [selectedHours, setSelectedHours] = useState<number[]>([]);
  const [showAllHours, setShowAllHours] = useState(true);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      setValidationResults(null);
      setResults(null);
    }
  };

  const validateFile = async () => {
    if (!file) return;

    setIsValidating(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('csvFile', file);

      const data = await secureApiClient.postFormData('/api/marketing-analysis/validate-file', formData);

      if (data.success) {
        setValidationResults(data.validation);
        console.log('✅ File validation completed:', data.validation.isValid ? 'VALID' : 'INVALID');
      } else {
        setError(data.error || 'Validation failed');
      }
    } catch (error) {
      console.error('❌ Validation error:', error);
      setError('Failed to validate file');
    } finally {
      setIsValidating(false);
    }
  };

  const analyzeFile = async () => {
    if (!file) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('csvFile', file);

      console.log('🚀 Starting marketing analysis for:', file.name);

      const data = await secureApiClient.postFormData('/api/marketing-analysis/upload-and-analyze', formData);

      if (data.success) {
        setResults(data.analysis);
        setActiveTab('summary');
        console.log('✅ Analysis completed successfully');
      } else {
        setError(data.error || 'Analysis failed');
      }
    } catch (error) {
      console.error('❌ Analysis error:', error);
      setError('Failed to analyze file');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-700 bg-red-100 border-red-200';
      case 'medium': return 'text-yellow-700 bg-yellow-100 border-yellow-200';
      case 'low': return 'text-green-700 bg-green-100 border-green-200';
      default: return 'text-gray-700 bg-gray-100 border-gray-200';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-purple-700 bg-purple-100';
      case 'medium': return 'text-blue-700 bg-blue-100';
      case 'low': return 'text-gray-700 bg-gray-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
          <BarChart3 className="w-8 h-8 mr-3 text-indigo-600" />
          📊 Marketing Data Analysis
        </h1>
        <p className="text-gray-600">
          Upload CSV files to analyze marketing performance, conversion funnels, and campaign effectiveness
        </p>
      </div>

      {/* Tab Navigation */}
      {results && (
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'upload', label: 'Upload', icon: Upload },
                { id: 'summary', label: 'Summary', icon: BarChart3 },
                { id: 'channels', label: 'Channels', icon: Target },
                { id: 'campaigns', label: 'Campaigns', icon: Zap },
                { id: 'hourly-comparison', label: 'Hour Comparison', icon: Clock },
                { id: 'journey', label: 'User Journey', icon: Users },
                { id: 'trends', label: 'Trends', icon: TrendingUp },
                { id: 'insights', label: 'Insights', icon: Eye }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Upload Tab */}
      {activeTab === 'upload' && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Upload className="w-5 h-5 mr-2" />
            Upload CSV File
          </h2>

          {/* File Upload Area */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-6">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                {file ? file.name : 'Choose CSV file'}
              </p>
              <p className="text-gray-600">
                {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Click to select or drag and drop'}
              </p>
            </label>
          </div>

          {/* Expected Format */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-blue-900 mb-2">Expected CSV Format:</h3>
            <div className="text-blue-800 text-sm space-y-1">
              <p><strong>Required columns:</strong> day, hour, channel, creative_network, network_cost, installs, "started onboarding_events", "registered no account linked_events"</p>
              <p><strong>Optional columns:</strong> waus, "delinked account_events"</p>
              <p><strong>Date format:</strong> MM/DD/YYYY or YYYY-MM-DD</p>
            </div>
          </div>

          {/* Validation Results */}
          {validationResults && (
            <div className={`border rounded-lg p-4 mb-6 ${
              validationResults.isValid 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center mb-3">
                {validationResults.isValid ? (
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                )}
                <h3 className={`font-medium ${
                  validationResults.isValid ? 'text-green-900' : 'text-red-900'
                }`}>
                  File Validation {validationResults.isValid ? 'Passed' : 'Failed'}
                </h3>
              </div>
              
              <div className="text-sm mb-3">
                <p><strong>Rows:</strong> {validationResults.rowCount}</p>
                <p><strong>Columns:</strong> {validationResults.columns?.join(', ')}</p>
              </div>

              {validationResults.issues && validationResults.issues.length > 0 && (
                <div className="text-red-800 text-sm">
                  <strong>Issues:</strong>
                  <ul className="list-disc list-inside mt-1">
                    {validationResults.issues.map((issue: string, index: number) => (
                      <li key={index}>{issue}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <button
              onClick={validateFile}
              disabled={!file || isValidating}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isValidating ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Validating...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Validate File
                </>
              )}
            </button>

            <button
              onClick={analyzeFile}
              disabled={!file || isAnalyzing || (validationResults && !validationResults.isValid)}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAnalyzing ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Analyze Data
                </>
              )}
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                <div>
                  <h3 className="font-medium text-red-900">Error</h3>
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Summary Tab */}
      {activeTab === 'summary' && results && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center">
                <DollarSign className="w-8 h-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Total Cost</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(results.summary.totalCost)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center">
                <Users className="w-8 h-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Total Installs</p>
                  <p className="text-2xl font-bold text-gray-900">{formatNumber(results.summary.totalInstalls)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center">
                <Target className="w-8 h-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Average CPI</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(results.summary.avgCPI)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center">
                <TrendingUp className="w-8 h-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Conversion Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{results.summary.overallConversionRate.toFixed(2)}%</p>
                </div>
              </div>
            </div>
          </div>

          {/* Data Quality */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <CheckCircle className="w-5 h-5 mr-2" />
              Data Quality Report
            </h3>
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{formatNumber(results.cleaning.originalCount)}</p>
                <p className="text-sm text-gray-600">Original Records</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{formatNumber(results.cleaning.cleanedCount)}</p>
                <p className="text-sm text-gray-600">Valid Records</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{formatNumber(results.cleaning.removedCount)}</p>
                <p className="text-sm text-gray-600">Removed Records</p>
              </div>
            </div>
          </div>

          {/* Time Range */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Analysis Period
            </h3>
            <p className="text-gray-700">
              <strong>From:</strong> {new Date(results.summary.dateRange.start).toLocaleDateString()} 
              <strong className="ml-4">To:</strong> {new Date(results.summary.dateRange.end).toLocaleDateString()}
            </p>
          </div>
        </div>
      )}

      {/* Channels Tab */}
      {activeTab === 'channels' && results && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Target className="w-5 h-5 mr-2" />
            Channel Performance Analysis
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Channel</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Installs</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CPI</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Conversion Rate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campaigns</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {results.campaignAnalysis.channels.map((channel, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{channel.channel}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(channel.total_cost)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatNumber(channel.total_installs)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(channel.avg_cpi)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        channel.conversion_rate > 80 ? 'bg-green-100 text-green-800' :
                        channel.conversion_rate > 50 ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-red-100 text-red-800'
                      }`}>
                        {channel.conversion_rate.toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{channel.campaign_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Campaigns Tab */}
      {activeTab === 'campaigns' && results && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Zap className="w-5 h-5 mr-2" />
            Top Performing Campaigns
          </h3>
          <div className="space-y-4">
            {results.campaignAnalysis.campaigns.slice(0, 10).map((campaign, index) => (
              <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-gray-900 text-sm">{campaign.campaign.substring(0, 60)}...</h4>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">{campaign.channel}</span>
                </div>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Cost</p>
                    <p className="font-medium">{formatCurrency(campaign.total_cost)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Installs</p>
                    <p className="font-medium">{formatNumber(campaign.total_installs)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">CPI</p>
                    <p className="font-medium">{formatCurrency(campaign.avg_cpi)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Conversion</p>
                    <p className={`font-medium ${
                      campaign.conversion_rate > 80 ? 'text-green-600' :
                      campaign.conversion_rate > 50 ? 'text-yellow-600' : 
                      'text-red-600'
                    }`}>
                      {campaign.conversion_rate.toFixed(2)}%
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hourly Comparison Tab */}
      {activeTab === 'hourly-comparison' && results && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Hour-by-Hour Daily Comparison
            </h3>
            <p className="text-gray-600 mb-4">
              Compare performance across different days for each hour to identify daily patterns and optimize timing.
            </p>

            {/* Hour Filter Controls */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900 flex items-center">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter Hours
                </h4>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => {
                      setShowAllHours(true);
                      setSelectedHours([]);
                    }}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                      showAllHours 
                        ? 'bg-indigo-600 text-white' 
                        : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Show All Hours
                  </button>
                  <button
                    onClick={() => {
                      const activeHours = results.timeAnalysis.hourlyComparison
                        ?.filter(h => h.totalInstalls > 0)
                        ?.map(h => h.hour) || [];
                      setSelectedHours(activeHours);
                      setShowAllHours(false);
                    }}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                      !showAllHours && selectedHours.length > 0
                        ? 'bg-green-600 text-white' 
                        : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Active Hours Only
                  </button>
                </div>
              </div>

              {/* Quick Filter Presets */}
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="text-sm text-gray-600 mr-2">Quick filters:</span>
                <button
                  onClick={() => {
                    setSelectedHours([9, 10, 11, 12, 13, 14, 15, 16, 17]);
                    setShowAllHours(false);
                  }}
                  className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs hover:bg-blue-200 transition-colors"
                >
                  Business Hours (9-17)
                </button>
                <button
                  onClick={() => {
                    setSelectedHours([18, 19, 20, 21, 22]);
                    setShowAllHours(false);
                  }}
                  className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs hover:bg-purple-200 transition-colors"
                >
                  Evening (18-22)
                </button>
                <button
                  onClick={() => {
                    setSelectedHours([6, 7, 8, 9]);
                    setShowAllHours(false);
                  }}
                  className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs hover:bg-yellow-200 transition-colors"
                >
                  Morning (6-9)
                </button>
                <button
                  onClick={() => {
                    setSelectedHours([12, 13, 14]);
                    setShowAllHours(false);
                  }}
                  className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs hover:bg-green-200 transition-colors"
                >
                  Lunch (12-14)
                </button>
                <button
                  onClick={() => {
                    setSelectedHours([0, 1, 2, 3, 4, 5, 23]);
                    setShowAllHours(false);
                  }}
                  className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs hover:bg-gray-200 transition-colors"
                >
                  Night (23-5)
                </button>
              </div>

              {/* Hour Selection Grid */}
              <div className="grid grid-cols-12 gap-2 mt-3">
                {Array.from({ length: 24 }, (_, i) => {
                  const hourData = results.timeAnalysis.hourlyComparison?.find(h => h.hour === i);
                  const hasActivity = hourData && hourData.totalInstalls > 0;
                  const isSelected = selectedHours.includes(i);
                  
                  return (
                    <button
                      key={i}
                      onClick={() => {
                        setShowAllHours(false);
                        setSelectedHours(prev => 
                          prev.includes(i) 
                            ? prev.filter(h => h !== i)
                            : [...prev, i].sort((a, b) => a - b)
                        );
                      }}
                      className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                        showAllHours
                          ? hasActivity 
                            ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                            : 'bg-gray-100 text-gray-500 border border-gray-200'
                          : isSelected
                            ? hasActivity
                              ? 'bg-indigo-600 text-white'
                              : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                            : hasActivity
                              ? 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                              : 'bg-gray-100 text-gray-400 border border-gray-200'
                      }`}
                      disabled={!hasActivity && showAllHours}
                    >
                      {i.toString().padStart(2, '0')}:00
                    </button>
                  );
                })}
              </div>

              {/* Filter Summary */}
              <div className="mt-3 flex items-center justify-between text-sm">
                <div className="text-gray-600">
                  {showAllHours 
                    ? `Showing all ${results.timeAnalysis.hourlyComparison?.length || 0} hours`
                    : selectedHours.length > 0
                      ? `Showing ${selectedHours.length} selected hours: ${selectedHours.map(h => h.toString().padStart(2, '0') + ':00').join(', ')}`
                      : 'Select hours to compare'
                  }
                </div>
                <div className="text-gray-500">
                  {results.timeAnalysis.hourlyComparison?.filter(h => h.totalInstalls > 0).length || 0} hours have activity
                </div>
              </div>
            </div>
            
            <div className="space-y-8">
              {results.timeAnalysis.hourlyComparison
                ?.filter(hourData => 
                  showAllHours || selectedHours.includes(hourData.hour)
                )
                ?.map((hourData, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-medium text-gray-900">
                      Hour {hourData.hour}:00
                    </h4>
                    <div className="flex space-x-4 text-sm">
                      <div className="text-center">
                        <p className="text-gray-600">Total Installs</p>
                        <p className="font-bold text-lg">{formatNumber(hourData.totalInstalls)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-600">Avg CPI</p>
                        <p className="font-bold text-lg">{formatCurrency(hourData.avgCPI)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Best/Worst Day Summary */}
                  {hourData.bestDay && hourData.worstDay && (
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <h5 className="font-medium text-green-900 mb-1 flex items-center">
                          <TrendingUp className="w-4 h-4 mr-1" />
                          Best Day
                        </h5>
                        <p className="text-green-800 text-sm">
                          {new Date(hourData.bestDay.date).toLocaleDateString()}: 
                          {' '}{hourData.bestDay.conversion_rate.toFixed(2)}% conversion,
                          {' '}{formatNumber(hourData.bestDay.installs)} installs
                        </p>
                      </div>
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <h5 className="font-medium text-red-900 mb-1 flex items-center">
                          <ArrowDown className="w-4 h-4 mr-1" />
                          Worst Day
                        </h5>
                        <p className="text-red-800 text-sm">
                          {new Date(hourData.worstDay.date).toLocaleDateString()}: 
                          {' '}{hourData.worstDay.conversion_rate.toFixed(2)}% conversion,
                          {' '}{formatNumber(hourData.worstDay.installs)} installs
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Daily Breakdown Table */}
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cost</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Installs</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">CPI</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Conversion</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">vs Avg</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {Object.values(hourData.dailyBreakdown).map((dayData, dayIndex) => {
                          const avgConversion = Object.values(hourData.dailyBreakdown)
                            .reduce((sum, d) => sum + d.conversion_rate, 0) / Object.values(hourData.dailyBreakdown).length;
                          const performanceVsAvg = dayData.conversion_rate - avgConversion;
                          
                          return (
                            <tr key={dayIndex} className={`hover:bg-gray-50 ${
                              dayData.conversion_rate === hourData.bestDay?.conversion_rate ? 'bg-green-25' :
                              dayData.conversion_rate === hourData.worstDay?.conversion_rate ? 'bg-red-25' : ''
                            }`}>
                              <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                                {new Date(dayData.date).toLocaleDateString()}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                {formatCurrency(dayData.cost)}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                {formatNumber(dayData.installs)}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                {dayData.cpi > 0 ? formatCurrency(dayData.cpi) : '-'}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  dayData.conversion_rate > avgConversion * 1.2 ? 'bg-green-100 text-green-800' :
                                  dayData.conversion_rate < avgConversion * 0.8 ? 'bg-red-100 text-red-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {dayData.conversion_rate.toFixed(2)}%
                                </span>
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm">
                                <span className={`flex items-center ${
                                  performanceVsAvg > 0 ? 'text-green-600' : 
                                  performanceVsAvg < 0 ? 'text-red-600' : 'text-gray-600'
                                }`}>
                                  {performanceVsAvg > 0 ? (
                                    <ArrowUp className="w-3 h-3 mr-1" />
                                  ) : performanceVsAvg < 0 ? (
                                    <ArrowDown className="w-3 h-3 mr-1" />
                                  ) : null}
                                  {Math.abs(performanceVsAvg).toFixed(1)}%
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Hour Insights */}
                  <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <h5 className="font-medium text-blue-900 mb-2 flex items-center">
                      <Eye className="w-4 h-4 mr-1" />
                      Hour {hourData.hour} Insights
                    </h5>
                    <div className="text-blue-800 text-sm space-y-1">
                      {hourData.bestDay && hourData.worstDay && (
                        <>
                          <p>
                            • <strong>Best performance:</strong> {new Date(hourData.bestDay.date).toLocaleDateString()} 
                            with {hourData.bestDay.conversion_rate.toFixed(2)}% conversion rate
                          </p>
                          <p>
                            • <strong>Performance range:</strong> {
                              (hourData.bestDay.conversion_rate - hourData.worstDay.conversion_rate).toFixed(2)
                            }% difference between best and worst days
                          </p>
                          {hourData.totalInstalls > 0 && (
                            <p>
                              • <strong>Consistency:</strong> {
                                Object.values(hourData.dailyBreakdown).filter(d => d.installs > 0).length
                              } out of {Object.keys(hourData.dailyBreakdown).length} days had activity
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* User Journey Tab */}
      {activeTab === 'journey' && results && (
        <div className="space-y-6">
          {/* Conversion Funnel */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Conversion Funnel
            </h3>
            <div className="space-y-4">
              {results.userJourney.funnel.map((step, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <div className="w-24 text-sm font-medium text-gray-700">{step.step}</div>
                  <div className="flex-1 bg-gray-200 rounded-full h-8">
                    <div 
                      className="bg-indigo-600 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                      style={{ width: `${step.percentage}%` }}
                    >
                      {step.percentage.toFixed(1)}%
                    </div>
                  </div>
                  <div className="w-24 text-sm text-gray-600">{formatNumber(step.count)}</div>
                  {step.dropoff > 0 && (
                    <div className="w-20 text-sm text-red-600">-{step.dropoff.toFixed(1)}%</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Critical Drop-offs */}
          {results.userJourney.criticalDropoffs.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
                Critical Drop-off Points
              </h3>
              <div className="space-y-3">
                {results.userJourney.criticalDropoffs.map((dropoff, index) => (
                  <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-red-900">{dropoff.step}</span>
                      <span className="text-red-700 font-bold">{dropoff.dropoff.toFixed(1)}% drop-off</span>
                    </div>
                    <p className="text-red-800 text-sm mt-1">High impact optimization opportunity</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Trends Tab */}
      {activeTab === 'trends' && results && (
        <div className="space-y-6">
          {/* Anomalies */}
          {results.trends.anomalies.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-orange-600" />
                Detected Anomalies
              </h3>
              <div className="space-y-3">
                {results.trends.anomalies.map((anomaly, index) => (
                  <div key={index} className={`border rounded-lg p-4 ${
                    anomaly.type === 'spike' ? 'bg-orange-50 border-orange-200' : 'bg-blue-50 border-blue-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {anomaly.type === 'spike' ? (
                          <ArrowUp className="w-4 h-4 text-orange-600 mr-2" />
                        ) : (
                          <ArrowDown className="w-4 h-4 text-blue-600 mr-2" />
                        )}
                        <span className="font-medium">
                          {anomaly.metric.charAt(0).toUpperCase() + anomaly.metric.slice(1)} {anomaly.type}
                        </span>
                      </div>
                      <span className="text-sm text-gray-600">{anomaly.date}</span>
                    </div>
                    <p className="text-sm mt-1">
                      Value: <strong>{anomaly.metric === 'cost' ? formatCurrency(anomaly.value) : formatNumber(anomaly.value)}</strong>
                      {' '}({anomaly.deviation.toFixed(1)}% {anomaly.type === 'spike' ? 'above' : 'below'} average)
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Trends */}
          {results.trends.trends.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
                Overall Trends
              </h3>
              <div className="space-y-3">
                {results.trends.trends.map((trend, index) => (
                  <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {trend.direction === 'increasing' ? (
                          <ArrowUp className="w-4 h-4 text-green-600 mr-2" />
                        ) : (
                          <ArrowDown className="w-4 h-4 text-red-600 mr-2" />
                        )}
                        <span className="font-medium">
                          {trend.metric.charAt(0).toUpperCase() + trend.metric.slice(1)} {trend.direction}
                        </span>
                      </div>
                      <span className={`px-2 py-1 rounded text-sm font-medium ${
                        trend.direction === 'increasing' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {trend.change.toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{trend.period}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Insights Tab */}
      {activeTab === 'insights' && results && (
        <div className="space-y-6">
          {/* Key Insights */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Eye className="w-5 h-5 mr-2" />
              Key Insights
            </h3>
            <div className="space-y-4">
              {results.insights.map((insight, index) => (
                <div key={index} className={`border rounded-lg p-4 ${getPriorityColor(insight.priority)}`}>
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium">{insight.title}</h4>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(insight.priority)}`}>
                      {insight.priority} priority
                    </span>
                  </div>
                  <p className="text-sm">{insight.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Zap className="w-5 h-5 mr-2" />
              Actionable Recommendations
            </h3>
            <div className="space-y-4">
              {results.recommendations.map((recommendation, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{recommendation.title}</h4>
                    <div className="flex space-x-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getImpactColor(recommendation.impact)}`}>
                        {recommendation.impact} impact
                      </span>
                      <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">
                        {recommendation.effort} effort
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700">{recommendation.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketingAnalysis;
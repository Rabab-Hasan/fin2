import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  Database, 
  Target, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  Loader, 
  FileText, 
  BarChart3, 
  Zap,
  Eye,
  Clock,
  DollarSign,
  Globe
} from 'lucide-react';
import { enhancedCampaignAssistantAPI, type EnhancedCampaignAnalysis, type CampaignSetup } from '../utils/enhancedCampaignAssistantAPI';

interface EnhancedCampaignAssistantProps {
  budget?: number;
  duration?: number;
  countries?: string[];
  platforms?: string[];
  objectives?: string[];
  contentTypes?: string[];
  onRecommendationApply?: (type: string, data: any) => void;
}

const EnhancedCampaignAssistant: React.FC<EnhancedCampaignAssistantProps> = ({
  budget = 0,
  duration = 0,
  countries = [],
  platforms = [],
  objectives = [],
  contentTypes = [],
  onRecommendationApply
}) => {
  const [analysis, setAnalysis] = useState<EnhancedCampaignAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'analysis' | 'ask' | 'file-info' | 'suggestions'>('analysis');
  const [customQuestion, setCustomQuestion] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [fileInfo, setFileInfo] = useState<any>(null);
  const [campaignAnalysis, setCampaignAnalysis] = useState<any>(null);

  // Auto-analyze when campaign setup changes
  useEffect(() => {
    if (budget > 0 && duration > 0 && countries.length > 0) {
      analyzeCampaignSetup();
    }
  }, [budget, duration, countries, platforms, objectives, contentTypes]);

  // Load file info on component mount
  useEffect(() => {
    loadFileInfo();
  }, []);

  const analyzeCampaignSetup = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🎯 Analyzing campaign setup with enhanced AI...');

      const campaignSetup: CampaignSetup = {
        budget,
        duration,
        countries,
        platforms,
        objectives,
        contentTypes
      };

      // Validate setup first
      const validation = enhancedCampaignAssistantAPI.validateCampaignSetup(campaignSetup);
      if (!validation.valid) {
        setError(`Invalid campaign setup: ${validation.errors.join(', ')}`);
        return;
      }

      const result = await enhancedCampaignAssistantAPI.analyzeCampaignSetup(campaignSetup);
      
      if (result.success) {
        setAnalysis(result.analysis);
        setCampaignAnalysis(result);
        console.log('✅ Campaign analysis completed with accuracy:', result.analysis.accuracyScore.overall);
      } else {
        setError('Campaign analysis failed');
      }

    } catch (error) {
      console.error('❌ Campaign analysis error:', error);
      setError(error.message || 'Campaign analysis failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomQuestion = async () => {
    if (!customQuestion.trim()) return;

    try {
      setIsAnalyzing(true);
      setError(null);

      console.log('❓ Analyzing custom question:', customQuestion);

      const result = await enhancedCampaignAssistantAPI.analyzeQuestion(customQuestion, {
        budget,
        duration,
        countries,
        platforms,
        objectives,
        contentTypes
      });

      if (result.success) {
        setAnalysis(result.analysis);
        console.log('✅ Question analysis completed with accuracy:', result.analysis.accuracyScore.overall);
      } else {
        setError('Question analysis failed');
      }

    } catch (error) {
      console.error('❌ Question analysis error:', error);
      setError(error.message || 'Question analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const loadFileInfo = async () => {
    try {
      const result = await enhancedCampaignAssistantAPI.getGFHFileInfo();
      setFileInfo(result);
    } catch (error) {
      console.error('❌ File info error:', error);
    }
  };

  const AccuracyScoreBadge: React.FC<{ score: number; size?: 'sm' | 'md' | 'lg' }> = ({ 
    score, 
    size = 'md' 
  }) => {
    const colorClass = enhancedCampaignAssistantAPI.getAccuracyColor(score);
    const sizeClass = size === 'sm' ? 'text-xs px-2 py-1' : size === 'lg' ? 'text-lg px-4 py-2' : 'text-sm px-3 py-1';
    
    return (
      <span className={`inline-flex items-center rounded-full font-medium ${colorClass} ${sizeClass}`}>
        <Target className="w-3 h-3 mr-1" />
        {score}% Accuracy
      </span>
    );
  };

  const DataSourceInfo: React.FC<{ dataSource: EnhancedCampaignAnalysis['dataSource'] }> = ({ 
    dataSource 
  }) => (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
      <h4 className="font-medium text-gray-900 mb-2 flex items-center">
        <Database className="w-4 h-4 mr-2" />
        Data Source Information
      </h4>
      <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
        <div>
          <span className="font-medium">File:</span> {dataSource.fileName}
        </div>
        <div>
          <span className="font-medium">Size:</span> {dataSource.fileSize}
        </div>
        <div>
          <span className="font-medium">Sheets:</span> {dataSource.totalSheets}
        </div>
        <div>
          <span className="font-medium">Modified:</span> {new Date(dataSource.lastModified).toLocaleDateString()}
        </div>
      </div>
    </div>
  );

  const KeyFindingsSection: React.FC<{ findings: EnhancedCampaignAnalysis['keyFindings'] }> = ({ 
    findings 
  }) => (
    <div className="space-y-3">
      <h4 className="font-medium text-gray-900 flex items-center">
        <TrendingUp className="w-4 h-4 mr-2" />
        Key Findings from GFH Data
      </h4>
      {findings.map((finding, index) => (
        <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="font-medium text-blue-900 mb-1">{finding.finding}</div>
          <div className="text-blue-800 text-sm mb-2">{finding.evidence}</div>
          <div className="text-xs text-blue-600 font-medium">
            📊 Source: {finding.dataSource}
          </div>
        </div>
      ))}
    </div>
  );

  const DataAnalysisSection: React.FC<{ dataAnalysis: EnhancedCampaignAnalysis['dataAnalysis'] }> = ({ 
    dataAnalysis 
  }) => (
    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
      <h4 className="font-medium text-purple-900 mb-3 flex items-center">
        <BarChart3 className="w-4 h-4 mr-2" />
        Analysis Coverage
      </h4>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-purple-700 text-sm">Total Records:</span>
            <span className="font-medium text-purple-900">{dataAnalysis.totalRecordsAnalyzed.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-purple-700 text-sm">Relevant Records:</span>
            <span className="font-medium text-purple-900">{dataAnalysis.relevantRecords.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-purple-700 text-sm">Date Range:</span>
            <span className="font-medium text-purple-900 text-xs">{dataAnalysis.dateRange}</span>
          </div>
        </div>
        <div className="space-y-2">
          <div>
            <div className="text-purple-700 text-sm mb-1">Platforms Analyzed:</div>
            <div className="flex flex-wrap gap-1">
              {dataAnalysis.platforms.map(platform => (
                <span key={platform} className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                  {platform}
                </span>
              ))}
            </div>
          </div>
          <div>
            <div className="text-purple-700 text-sm mb-1">Markets Analyzed:</div>
            <div className="flex flex-wrap gap-1">
              {dataAnalysis.markets.map(market => (
                <span key={market} className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                  {market}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (!analysis && !isLoading && (budget === 0 || duration === 0 || countries.length === 0)) {
    return (
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 text-center border border-indigo-200">
        <Brain className="w-8 h-8 text-indigo-600 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-indigo-900 mb-2">
          🤖 Enhanced Campaign Assistant
        </h3>
        <p className="text-indigo-700 mb-4">
          Powered by Ollama Local AI + Complete GFH Dataset Analysis
        </p>
        <p className="text-indigo-600 text-sm">
          Set your campaign budget, duration, and target countries to get AI-powered insights 
          based on comprehensive analysis of the actual GFH Excel file.
        </p>
        
        {/* File Status */}
        {fileInfo && (
          <div className="mt-4 p-3 bg-white rounded-lg border border-indigo-200">
            <div className="flex items-center justify-center text-sm">
              <FileText className="w-4 h-4 mr-2 text-green-600" />
              <span className="text-green-800 font-medium">
                GFH File Status: {fileInfo.fileInfo?.exists ? '✅ Connected' : '❌ Not Found'}
              </span>
            </div>
            {fileInfo.fileInfo?.exists && (
              <div className="mt-1 text-xs text-gray-600">
                {fileInfo.fileInfo.sheetCount} sheets • {fileInfo.fileInfo.sizeFormatted}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Brain className="w-6 h-6 text-white mr-3" />
            <div>
              <h2 className="text-xl font-bold text-white">🤖 Enhanced Campaign Assistant</h2>
              <p className="text-indigo-100 text-sm">Powered by Ollama Local AI + Complete GFH Dataset</p>
            </div>
          </div>
          {analysis && (
            <AccuracyScoreBadge score={analysis.accuracyScore.overall} size="lg" />
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="px-6 py-3 bg-gray-50 border-b">
        <div className="flex space-x-1">
          {[
            { id: 'analysis', label: '🎯 Analysis', icon: Target },
            { id: 'ask', label: '❓ Ask Question', icon: Brain },
            { id: 'file-info', label: '📁 File Info', icon: FileText },
            { id: 'suggestions', label: '💡 Suggestions', icon: Zap }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6 max-h-96 overflow-y-auto">
        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-8">
            <Loader className="w-8 h-8 text-indigo-600 mx-auto mb-3 animate-spin" />
            <p className="text-gray-600 font-medium">Analyzing with Ollama AI...</p>
            <p className="text-gray-500 text-sm mt-1">Reading GFH Excel file and processing with local AI</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
              <div>
                <h4 className="font-medium text-red-900">Analysis Error</h4>
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Analysis Tab */}
        {activeTab === 'analysis' && analysis && (
          <div className="space-y-6">
            {/* Main Analysis */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <Brain className="w-5 h-5 mr-2" />
                AI Analysis Results
                <AccuracyScoreBadge score={analysis.accuracyScore.overall} size="sm" />
              </h3>
              <div className="prose max-w-none text-gray-700 whitespace-pre-wrap">
                {analysis.answer}
              </div>
            </div>

            {/* Key Findings */}
            <KeyFindingsSection findings={analysis.keyFindings} />

            {/* Data Analysis Coverage */}
            <DataAnalysisSection dataAnalysis={analysis.dataAnalysis} />

            {/* Recommendations */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-900 mb-3 flex items-center">
                <CheckCircle className="w-4 h-4 mr-2" />
                AI Recommendations
              </h4>
              <ul className="space-y-2">
                {analysis.recommendations.map((recommendation, index) => (
                  <li key={index} className="flex items-start text-green-800 text-sm">
                    <span className="w-2 h-2 bg-green-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    {recommendation}
                  </li>
                ))}
              </ul>
            </div>

            {/* Accuracy Details */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-yellow-900 mb-2 flex items-center">
                <Target className="w-4 h-4 mr-2" />
                Accuracy Score Breakdown
              </h4>
              <p className="text-yellow-800 text-sm mb-3">{analysis.accuracyScore.explanation}</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-xs">
                  <span className="text-yellow-700">Data Coverage:</span>
                  <span className="font-medium ml-2">{analysis.accuracyScore.factors.dataCoverage}%</span>
                </div>
                <div className="text-xs">
                  <span className="text-yellow-700">Data Quality:</span>
                  <span className="font-medium ml-2">{analysis.accuracyScore.factors.dataQuality}/10</span>
                </div>
                <div className="text-xs">
                  <span className="text-yellow-700">Relevance:</span>
                  <span className="font-medium ml-2">{analysis.accuracyScore.factors.relevanceScore}/10</span>
                </div>
                <div className="text-xs">
                  <span className="text-yellow-700">Confidence:</span>
                  <span className="font-medium ml-2">{analysis.accuracyScore.factors.confidence}/10</span>
                </div>
              </div>
            </div>

            {/* Data Source */}
            <DataSourceInfo dataSource={analysis.dataSource} />
          </div>
        )}

        {/* Ask Question Tab */}
        {activeTab === 'ask' && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-3 flex items-center">
                <Brain className="w-4 h-4 mr-2" />
                Ask Any Question About GFH Data
              </h3>
              <div className="space-y-3">
                <textarea
                  value={customQuestion}
                  onChange={(e) => setCustomQuestion(e.target.value)}
                  placeholder="e.g., Which platform has the best performance in Saudi Arabia? What's the optimal budget allocation?"
                  className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={3}
                />
                <button
                  onClick={handleCustomQuestion}
                  disabled={isAnalyzing || !customQuestion.trim()}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing with AI...
                    </>
                  ) : (
                    <>
                      <Brain className="w-4 h-4 mr-2" />
                      Analyze with Ollama AI
                    </>
                  )}
                </button>
              </div>
            </div>

            {analysis && (
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">Latest Analysis Result</h4>
                  <AccuracyScoreBadge score={analysis.accuracyScore.overall} size="sm" />
                </div>
                <p className="text-gray-700 text-sm">{analysis.answer.substring(0, 200)}...</p>
              </div>
            )}
          </div>
        )}

        {/* File Info Tab */}
        {activeTab === 'file-info' && (
          <div className="space-y-4">
            {fileInfo ? (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-medium text-green-900 mb-3 flex items-center">
                    <FileText className="w-4 h-4 mr-2" />
                    GFH Excel File Status
                  </h3>
                  {fileInfo.fileInfo?.exists ? (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-green-700">Status:</span>
                        <span className="font-medium text-green-900">✅ Connected & Readable</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-700">File Size:</span>
                        <span className="font-medium text-green-900">{fileInfo.fileInfo.sizeFormatted}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-700">Sheets:</span>
                        <span className="font-medium text-green-900">{fileInfo.fileInfo.sheetCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-700">Last Modified:</span>
                        <span className="font-medium text-green-900">{new Date(fileInfo.fileInfo.modified).toLocaleString()}</span>
                      </div>
                      <div className="mt-3">
                        <span className="text-green-700">Sheets Available:</span>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {fileInfo.fileInfo.sheets?.map((sheet: string) => (
                            <span key={sheet} className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                              {sheet}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-red-800">
                      ❌ GFH Excel file not found or not readable
                      <p className="text-sm mt-1">{fileInfo.fileInfo?.error}</p>
                    </div>
                  )}
                </div>

                {analysis && (
                  <DataSourceInfo dataSource={analysis.dataSource} />
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <Loader className="w-6 h-6 text-gray-400 mx-auto mb-2 animate-spin" />
                <p className="text-gray-600">Loading file information...</p>
              </div>
            )}
          </div>
        )}

        {/* Suggestions Tab */}
        {activeTab === 'suggestions' && (
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-medium text-yellow-900 mb-3 flex items-center">
                <Zap className="w-4 h-4 mr-2" />
                Suggested Questions for GFH Analysis
              </h3>
              <div className="space-y-2">
                {enhancedCampaignAssistantAPI.getSuggestedQuestions().map((question, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setCustomQuestion(question);
                      setActiveTab('ask');
                    }}
                    className="w-full text-left p-3 bg-white border border-yellow-200 rounded-lg hover:border-yellow-300 hover:bg-yellow-25 transition-colors"
                  >
                    <div className="flex items-start">
                      <span className="text-yellow-600 mr-2 text-sm">Q{index + 1}:</span>
                      <span className="text-yellow-900 text-sm">{question}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-3 bg-gray-50 border-t">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center">
            <Brain className="w-3 h-3 mr-1" />
            Enhanced AI Analysis • Real GFH File Data
            {analysis && (
              <>
                • {analysis.dataAnalysis.totalRecordsAnalyzed.toLocaleString()} records analyzed
                • <AccuracyScoreBadge score={analysis.accuracyScore.overall} size="sm" />
              </>
            )}
          </div>
          <div className="flex items-center">
            <span className={`w-2 h-2 rounded-full mr-1 ${
              fileInfo?.fileInfo?.exists ? 'bg-green-500' : 'bg-red-500'
            }`}></span>
            {fileInfo?.fileInfo?.exists ? 'GFH File Connected' : 'GFH File Missing'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedCampaignAssistant;
import React, { useState, useEffect } from 'react';
import { Brain, TrendingUp, Target, Clock, DollarSign, Map, Lightbulb, BarChart3, AlertCircle, CheckCircle, Zap, Eye, Loader } from 'lucide-react';
import CampaignAssistant, { 
  type CampaignAssistantRecommendations,
  type TimingRecommendation,
  type ContentRecommendation,
  type MarketInsight,
  type PlatformRecommendation 
} from '../utils/campaignAssistant';
import GFHDataAnalyzer, { type DynamicInsight } from '../utils/gfhDataAnalyzer';
import { askGFH, enhancedGFH, type EnhancedGFHResponse } from '../utils/enhancedGFHQueryInterface';
import { campaignAssistantAPI, type OllamaInsight, type OllamaAnalysisResponse, type GFHQuestionResponse } from '../utils/campaignAssistantAPI';

interface CampaignAssistantProps {
  budget: number;
  duration: number;
  countries: string[];
  platforms: string[];
  objectives?: string[];
  contentSelected?: string[];
  onRecommendationApply?: (type: string, data: any) => void;
}

const CampaignAssistantComponent: React.FC<CampaignAssistantProps> = ({
  budget,
  duration,
  countries,
  platforms,
  objectives = [],
  contentSelected = [],
  onRecommendationApply
}) => {
  const [recommendations, setRecommendations] = useState<CampaignAssistantRecommendations | null>(null);
  const [dynamicInsights, setDynamicInsights] = useState<DynamicInsight[]>([]);
  const [enhancedInsights, setEnhancedInsights] = useState<EnhancedGFHResponse[]>([]);
  
  // Ollama AI states
  const [ollamaInsights, setOllamaInsights] = useState<OllamaInsight[]>([]);
  const [ollamaForecasts, setOllamaForecasts] = useState<any>(null);
  const [ollamaRecommendations, setOllamaRecommendations] = useState<string[]>([]);
  const [ollamaDataSource, setOllamaDataSource] = useState<any>(null);
  const [ollamaStatus, setOllamaStatus] = useState<'loading' | 'success' | 'error' | 'inactive'>('inactive');
  
  const [activeTab, setActiveTab] = useState<'ollama' | 'insights' | 'timing' | 'content' | 'markets' | 'platforms' | 'strategy' | 'vector-search'>('ollama');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<GFHQuestionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Handle Ollama GFH questions
  const handleOllamaSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const result = await campaignAssistantAPI.askGFHQuestion(searchQuery);
      setSearchResults(result);
    } catch (error) {
      console.error('Ollama search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Generate recommendations when inputs change
  useEffect(() => {
    if (budget > 0 && duration > 0 && countries.length > 0) {
      setIsLoading(true);
      setOllamaStatus('loading');
      
      // Get Ollama AI analysis (primary feature)
      const getOllamaAnalysis = async () => {
        try {
          console.log('🤖 Getting Ollama campaign analysis...');
          const ollamaResponse = await campaignAssistantAPI.analyzeCampaign({
            budget,
            duration,
            countries,
            platforms,
            objectives: objectives || [],
            contentTypes: contentSelected || []
          });
          
          if (ollamaResponse.success) {
            console.log('✅ Ollama analysis successful');
            setOllamaInsights(ollamaResponse.analysis.insights);
            setOllamaForecasts(ollamaResponse.analysis.forecasts);
            setOllamaRecommendations(ollamaResponse.analysis.recommendations);
            setOllamaDataSource(ollamaResponse.dataSource);
            setOllamaStatus('success');
          } else {
            console.log('⚠️ Ollama analysis failed, showing fallback');
            setOllamaInsights(ollamaResponse.analysis.insights);
            setOllamaForecasts(ollamaResponse.analysis.forecasts);
            setOllamaRecommendations(ollamaResponse.analysis.recommendations);
            setOllamaDataSource(ollamaResponse.dataSource);
            setOllamaStatus('error');
          }
        } catch (error) {
          console.error('❌ Ollama analysis error:', error);
          setOllamaStatus('error');
          setOllamaInsights([{
            type: 'system',
            priority: 'high',
            title: 'Connection Error',
            message: 'Could not connect to Campaign Assistant AI. Please check backend server and Ollama service.',
            recommendation: 'Ensure backend is running and Ollama is installed with mistral model.',
            gfhEvidence: 'Connection failed'
          }]);
        }
      };
      
      // Get legacy recommendations as backup
      const getLegacyRecommendations = async () => {
        try {
          // Generate static recommendations
          const newRecommendations = CampaignAssistant.getCampaignRecommendations(
            budget, 
            duration, 
            countries, 
            platforms, 
            objectives
          );
          setRecommendations(newRecommendations);

          // Generate dynamic insights from GFH data
          const newDynamicInsights = GFHDataAnalyzer.analyzeUserCampaign(
            budget,
            duration,
            countries,
            platforms,
            objectives,
            contentSelected
          );
          setDynamicInsights(newDynamicInsights);
          
          // Generate enhanced insights using vector database
          const enhancedResults: EnhancedGFHResponse[] = [];
          
          const campaignAnalysis = await enhancedGFH.analyzeCampaignPlan({
            budget,
            duration,
            markets: countries,
            platforms,
            objectives,
            contentTypes: contentSelected ? Object.keys(contentSelected).filter(k => (contentSelected as any)[k]) : []
          });
          enhancedResults.push(campaignAnalysis);
          
          for (const country of countries.slice(0, 2)) {
            for (const platform of platforms.slice(0, 2)) {
              const forecast = await enhancedGFH.forecastCampaignPerformance(platform, country, budget / countries.length, duration);
              enhancedResults.push(forecast);
            }
          }
          
          setEnhancedInsights(enhancedResults);
        } catch (error) {
          console.error('Error generating legacy insights:', error);
        }
      };

      // Run both analyses
      Promise.all([
        getOllamaAnalysis(),
        getLegacyRecommendations()
      ]).finally(() => {
        setIsLoading(false);
      });
    }
  }, [budget, duration, countries, platforms, objectives, contentSelected]);

  const TabButton: React.FC<{ 
    tab: string; 
    icon: React.ReactElement; 
    label: string; 
    count?: number 
  }> = ({ tab, icon, label, count }) => (
    <button
      onClick={() => setActiveTab(tab as any)}
      className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${
        activeTab === tab 
          ? 'bg-blue-600 text-white shadow-md' 
          : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
      }`}
    >
      {icon}
      <span className="ml-2">{label}</span>
      {count && (
        <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
          activeTab === tab ? 'bg-blue-500' : 'bg-gray-200 text-gray-600'
        }`}>
          {count}
        </span>
      )}
    </button>
  );

  const PerformanceIndicator: React.FC<{ 
    level: 'low' | 'medium' | 'high' | 'excellent' | 'peak';
    showText?: boolean;
  }> = ({ level, showText = true }) => {
    const colors = {
      low: 'bg-red-100 text-red-700 border-red-200',
      medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      high: 'bg-green-100 text-green-700 border-green-200',
      excellent: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      peak: 'bg-purple-100 text-purple-700 border-purple-200'
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded border ${colors[level]}`}>
        {level === 'low' && <AlertCircle className="w-3 h-3 mr-1" />}
        {(level === 'medium' || level === 'high') && <TrendingUp className="w-3 h-3 mr-1" />}
        {level === 'excellent' && <CheckCircle className="w-3 h-3 mr-1" />}
        {level === 'peak' && <Zap className="w-3 h-3 mr-1" />}
        {showText && level.charAt(0).toUpperCase() + level.slice(1)}
      </span>
    );
  };

  const TimingRecommendations: React.FC<{ recommendations: TimingRecommendation[] }> = ({ recommendations }) => (
    <div className="space-y-4">
      <div className="flex items-center mb-4">
        <Clock className="w-5 h-5 text-blue-600 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900">Optimal Campaign Timing</h3>
        <div className="ml-auto text-sm text-gray-500">Based on GFH historical data</div>
      </div>

      {recommendations.map((rec, index) => (
        <div key={index} className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-blue-900">{rec.phase}</h4>
            <PerformanceIndicator level={rec.expectedPerformance.efficiency} />
          </div>
          
          <p className="text-blue-800 text-sm mb-3">{rec.recommendation}</p>
          
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div className="bg-white rounded p-2 text-center">
              <div className="text-xs text-gray-500">CPM</div>
              <div className="font-semibold text-blue-700">${rec.expectedPerformance.cpm.toFixed(2)}</div>
            </div>
            <div className="bg-white rounded p-2 text-center">
              <div className="text-xs text-gray-500">CPC</div>
              <div className="font-semibold text-blue-700">${rec.expectedPerformance.cpc.toFixed(3)}</div>
            </div>
            <div className="bg-white rounded p-2 text-center">
              <div className="text-xs text-gray-500">CTR</div>
              <div className="font-semibold text-blue-700">{rec.expectedPerformance.ctr.toFixed(2)}%</div>
            </div>
          </div>
          
          <div className="text-xs text-blue-600 italic">{rec.rationale}</div>
        </div>
      ))}
    </div>
  );

  const ContentRecommendations: React.FC<{ recommendations: ContentRecommendation[] }> = ({ recommendations }) => (
    <div className="space-y-4">
      <div className="flex items-center mb-4">
        <Target className="w-5 h-5 text-green-600 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900">Content Type Recommendations</h3>
        <div className="ml-auto text-sm text-gray-500">Ranked by performance potential</div>
      </div>

      <div className="grid gap-3">
        {recommendations.slice(0, 6).map((rec, index) => (
          <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900 text-sm">{rec.contentType}</h4>
              <PerformanceIndicator level={rec.performance} />
            </div>
            
            <div className="flex items-center mb-2">
              <div className="text-xs text-gray-500 mr-2">Best for:</div>
              <div className="flex flex-wrap gap-1">
                {rec.bestPlatforms.map(platform => (
                  <span key={platform} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                    {platform}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs text-gray-500">Timing: <span className="text-gray-700">{rec.timing}</span></div>
              <div className="text-xs text-green-600 font-medium">
                +{((rec.engagementBoost - 1) * 100).toFixed(0)}% engagement
              </div>
            </div>
            
            <p className="text-xs text-gray-600">{rec.reasoning}</p>
            
            {contentSelected.includes(rec.contentType) && (
              <div className="mt-2 flex items-center text-xs text-green-600">
                <CheckCircle className="w-3 h-3 mr-1" />
                Already selected
              </div>
            )}
            
            {!contentSelected.includes(rec.contentType) && onRecommendationApply && (
              <button
                onClick={() => onRecommendationApply('content', rec.contentType)}
                className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                + Add to campaign
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const MarketInsights: React.FC<{ insights: MarketInsight[] }> = ({ insights }) => (
    <div className="space-y-4">
      <div className="flex items-center mb-4">
        <Map className="w-5 h-5 text-purple-600 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900">Market Performance Insights</h3>
        <div className="ml-auto text-sm text-gray-500">Based on GFH campaign data</div>
      </div>

      <div className="grid gap-4">
        {insights.map((insight, index) => (
          <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900">{insight.market}</h4>
              <div className="flex items-center space-x-2">
                <PerformanceIndicator level={insight.performance} showText={false} />
                <span className="text-sm text-gray-600">{insight.performance}</span>
              </div>
            </div>
            
            <div className="mb-3">
              <div className="text-xs text-gray-500 mb-1">Recommended Budget Share</div>
              <div className="flex items-center">
                <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full" 
                    style={{ width: `${Math.min(insight.recommendedBudgetShare, 100)}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-purple-600">{insight.recommendedBudgetShare}%</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-green-600 font-medium mb-1">Strengths</div>
                <ul className="text-xs text-gray-600 space-y-0.5">
                  {insight.strengths.map((strength, i) => (
                    <li key={i} className="flex items-start">
                      <CheckCircle className="w-3 h-3 text-green-500 mr-1 mt-0.5 flex-shrink-0" />
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <div className="text-xs text-orange-600 font-medium mb-1">Considerations</div>
                <ul className="text-xs text-gray-600 space-y-0.5">
                  {insight.considerations.map((consideration, i) => (
                    <li key={i} className="flex items-start">
                      <AlertCircle className="w-3 h-3 text-orange-500 mr-1 mt-0.5 flex-shrink-0" />
                      {consideration}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const PlatformRecommendations: React.FC<{ recommendations: PlatformRecommendation[] }> = ({ recommendations }) => (
    <div className="space-y-4">
      <div className="flex items-center mb-4">
        <BarChart3 className="w-5 h-5 text-indigo-600 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900">Platform Recommendations</h3>
        <div className="ml-auto text-sm text-gray-500">Ordered by suitability</div>
      </div>

      <div className="grid gap-4">
        {recommendations.map((rec, index) => (
          <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900">{rec.platform}</h4>
              <div className="flex items-center space-x-2">
                <PerformanceIndicator level={rec.suitability} showText={false} />
                <span className="text-sm font-medium text-indigo-600">{rec.budgetRecommendation}% budget</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <div className="text-xs text-green-600 font-medium mb-1">Strengths</div>
                <ul className="text-xs text-gray-600 space-y-0.5">
                  {rec.strengths.slice(0, 3).map((strength, i) => (
                    <li key={i} className="flex items-start">
                      <CheckCircle className="w-3 h-3 text-green-500 mr-1 mt-0.5 flex-shrink-0" />
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <div className="text-xs text-orange-600 font-medium mb-1">Best for</div>
                <div className="flex flex-wrap gap-1">
                  {rec.bestObjectives.map(objective => (
                    <span key={objective} className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded">
                      {objective}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {rec.weaknesses.length > 0 && (
              <div className="mb-3">
                <div className="text-xs text-red-600 font-medium mb-1">Considerations</div>
                <ul className="text-xs text-gray-600 space-y-0.5">
                  {rec.weaknesses.slice(0, 2).map((weakness, i) => (
                    <li key={i} className="flex items-start">
                      <AlertCircle className="w-3 h-3 text-red-500 mr-1 mt-0.5 flex-shrink-0" />
                      {weakness}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <p className="text-xs text-gray-600 italic">{rec.reasoning}</p>
            
            {platforms.includes(rec.platform) && (
              <div className="mt-2 flex items-center text-xs text-green-600">
                <CheckCircle className="w-3 h-3 mr-1" />
                Already selected
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  // Vector Search Tab Component
  const VectorSearchTab: React.FC = () => (
    <div className="space-y-6">
      {/* Search Interface */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
          <Brain className="w-4 h-4 mr-2" />
          Ask ANY Question About GFH Campaign Data
        </h3>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="e.g., Which platform performs best in Saudi Arabia? What's the average CPC for Meta campaigns?"
            className="flex-1 px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onKeyPress={(e) => e.key === 'Enter' && handleOllamaSearch()}
          />
          <button
            onClick={handleOllamaSearch}
            disabled={isSearching || !searchQuery.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {isSearching ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Searching...
              </>
            ) : (
              <>
                <Brain className="w-4 h-4" />
                Search All Data
              </>
            )}
          </button>
        </div>
        <div className="text-xs text-blue-700">
          <p><strong>Examples:</strong> "Instagram timing in Oman", "Best performing markets", "Cost comparison across platforms", "Campaign recommendations for $10k budget"</p>
        </div>
      </div>

      {/* Search Results */}
      {searchResults && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 flex items-center">
              <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
              Analysis Results
            </h3>
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
              {searchResults.success ? '✅ AI Analysis' : '⚠️ Fallback Response'}
            </span>
          </div>
          
          <div className="prose max-w-none">
            <div className="whitespace-pre-wrap text-sm text-gray-700">
              {searchResults.response.answer}
            </div>
          </div>

          {searchResults.response.insights.length > 0 && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <h4 className="font-medium text-yellow-800 mb-2">Key Insights:</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                {searchResults.response.insights.map((insight, i) => (
                  <li key={i}>• {insight}</li>
                ))}
              </ul>
            </div>
          )}

          {searchResults.response.recommendations.length > 0 && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
              <h4 className="font-medium text-green-800 mb-2">Recommendations:</h4>
              <ul className="text-sm text-green-700 space-y-1">
                {searchResults.response.recommendations.map((rec, i) => (
                  <li key={i}>• {rec}</li>
                ))}
              </ul>
            </div>
          )}

          {searchResults.dataSource && (
            <div className="mt-3 text-xs text-gray-500 flex items-center">
              <BarChart3 className="w-3 h-3 mr-1" />
              Data source: {searchResults.dataSource}
            </div>
          )}
        </div>
      )}

      {/* Enhanced Insights from Campaign Setup */}
      {enhancedInsights.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900 border-b pb-2">
            Auto-Generated Campaign Analysis
          </h3>
          {enhancedInsights.map((insight, index) => (
            <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  Analysis #{index + 1}
                </span>
                <span className="text-xs text-gray-500">
                  {insight.confidence.toFixed(0)}% confidence
                </span>
              </div>
              <div className="text-sm text-gray-700 whitespace-pre-wrap">
                {insight.answer.substring(0, 300)}
                {insight.answer.length > 300 && '...'}
              </div>
            </div>
          ))}
        </div>
      )}

      {enhancedInsights.length === 0 && !searchResults && (
        <div className="text-center py-8 text-gray-500">
          <Brain className="w-8 h-8 mx-auto mb-3 opacity-50" />
          <p>Ask any question about GFH campaign performance data.</p>
          <p className="text-xs mt-1">The vector database will search through ALL campaigns, platforms, and markets.</p>
        </div>
      )}
    </div>
  );

  const DynamicInsights: React.FC<{ insights: DynamicInsight[] }> = ({ insights }) => (
    <div className="space-y-4">
      <div className="flex items-center mb-4">
        <Brain className="w-5 h-5 text-indigo-600 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900">GFH Data Analysis</h3>
        <div className="ml-auto text-sm text-gray-500">Real-time insights from actual performance data</div>
      </div>

      {insights.length === 0 ? (
        <div className="text-center py-8">
          <Brain className="w-8 h-8 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">Complete your campaign setup to get personalized insights from GFH historical data.</p>
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800 font-medium">🔍 Try asking specific questions like:</p>
            <ul className="text-xs text-blue-700 mt-2 space-y-1">
              <li>• "What's the best time to post Instagram videos in Oman?"</li>
              <li>• "How did Meta perform in Saudi Arabia?"</li>
              <li>• "Which market has the best cost efficiency?"</li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {insights.map((insight, index) => {
            const priorityColors = {
              high: 'from-red-50 to-pink-50 border-red-200 text-red-800',
              medium: 'from-yellow-50 to-orange-50 border-yellow-200 text-yellow-800',
              low: 'from-blue-50 to-indigo-50 border-blue-200 text-blue-800'
            };
            
            const priorityIcons = {
              high: <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />,
              medium: <TrendingUp className="w-4 h-4 mr-2 flex-shrink-0" />,
              low: <Lightbulb className="w-4 h-4 mr-2 flex-shrink-0" />
            };

            return (
              <div key={index} className={`bg-gradient-to-r border rounded-lg p-4 ${priorityColors[insight.priority]}`}>
                <div className="flex items-start mb-2">
                  {priorityIcons[insight.priority]}
                  <div className="flex-1">
                    <div className="flex items-center mb-1">
                      <span className="text-xs font-semibold uppercase tracking-wide mr-2">
                        {insight.type} • {insight.priority} priority
                      </span>
                    </div>
                    <p className="text-sm font-medium mb-2">{insight.message}</p>
                    <p className="text-xs opacity-90">{insight.recommendation}</p>
                    
                    {insight.data && typeof insight.data === 'object' && (
                      <div className="mt-2 p-2 bg-white bg-opacity-50 rounded text-xs">
                        <strong>Data:</strong> {JSON.stringify(insight.data, null, 0).substring(0, 100)}...
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const OverallStrategy: React.FC<{ strategy: string[] }> = ({ strategy }) => (
    <div className="space-y-4">
      <div className="flex items-center mb-4">
        <Lightbulb className="w-5 h-5 text-yellow-600 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900">Strategic Recommendations</h3>
        <div className="ml-auto text-sm text-gray-500">AI-powered insights</div>
      </div>

      <div className="space-y-3">
        {strategy.map((recommendation, index) => (
          <div key={index} className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <Lightbulb className="w-4 h-4 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
              <p className="text-yellow-800 text-sm">{recommendation}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (!recommendations || (budget === 0 && duration === 0 && countries.length === 0)) {
    return (
      <div className="bg-gray-50 rounded-xl p-6 text-center">
        <Brain className="w-8 h-8 text-gray-400 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Campaign Assistant</h3>
        <p className="text-gray-600 text-sm">
          Set your budget, duration, and countries to get AI-powered recommendations based on GFH historical performance data.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-center mb-4">
          <Brain className="w-6 h-6 text-blue-600 animate-pulse mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Analyzing Campaign Data...</h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-gray-100 rounded h-4 animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
        <div className="flex items-center">
          <Brain className="w-6 h-6 text-white mr-3" />
          <div>
            <h2 className="text-xl font-bold text-white">AI Campaign Assistant</h2>
            <p className="text-blue-100 text-sm">Powered by GFH historical performance data</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="px-6 py-4 bg-gray-50 border-b">
        <div className="flex flex-wrap gap-2">
          <TabButton 
            tab="ollama" 
            icon={<Brain className="w-4 h-4" />} 
            label="🤖 Ollama AI" 
            count={ollamaInsights.length}
          />
          <TabButton 
            tab="insights" 
            icon={<TrendingUp className="w-4 h-4" />} 
            label="GFH Insights" 
            count={dynamicInsights.length}
          />
          <TabButton 
            tab="timing" 
            icon={<Clock className="w-4 h-4" />} 
            label="Timing" 
            count={recommendations?.timingRecommendations.length || 0}
          />
          <TabButton 
            tab="content" 
            icon={<Target className="w-4 h-4" />} 
            label="Content" 
            count={recommendations?.contentRecommendations.length || 0}
          />
          <TabButton 
            tab="markets" 
            icon={<Map className="w-4 h-4" />} 
            label="Markets" 
            count={recommendations?.marketInsights.length || 0}
          />
          <TabButton 
            tab="platforms" 
            icon={<BarChart3 className="w-4 h-4" />} 
            label="Platforms" 
            count={recommendations?.platformRecommendations.length || 0}
          />
          <TabButton 
            tab="strategy" 
            icon={<Lightbulb className="w-4 h-4" />} 
            label="Strategy" 
            count={recommendations?.overallStrategy.length || 0}
          />
          <TabButton 
            tab="vector-search" 
            icon={<Eye className="w-4 h-4" />} 
            label="Ask GFH Data" 
            count={enhancedInsights.length}
          />
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-6 py-6 max-h-96 overflow-y-auto">
        {activeTab === 'ollama' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-600" />
                  Ollama AI Campaign Analysis
                </h3>
                <p className="text-sm text-gray-600">AI-powered insights from GFH campaign performance data</p>
              </div>
              <div className="flex items-center gap-2">
                {ollamaStatus === 'loading' && (
                  <Loader className="w-4 h-4 animate-spin text-blue-500" />
                )}
                <span className={`text-xs px-2 py-1 rounded-full ${
                  ollamaStatus === 'success' ? 'bg-green-100 text-green-700' :
                  ollamaStatus === 'error' ? 'bg-yellow-100 text-yellow-700' :
                  ollamaStatus === 'loading' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {ollamaStatus === 'success' ? '✅ AI Connected' :
                   ollamaStatus === 'error' ? '⚠️ Fallback Mode' :
                   ollamaStatus === 'loading' ? '🔄 Analyzing...' :
                   'Ready'}
                </span>
              </div>
            </div>

            {/* Ollama Insights */}
            {ollamaInsights.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-blue-500" />
                  AI Campaign Insights ({ollamaInsights.length})
                </h4>
                <div className="grid gap-4">
                  {ollamaInsights.map((insight, index) => (
                    <div key={index} className={`p-4 rounded-lg border ${
                      insight.priority === 'high' ? 'border-red-200 bg-red-50' :
                      insight.priority === 'medium' ? 'border-yellow-200 bg-yellow-50' :
                      'border-green-200 bg-green-50'
                    }`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`text-xs px-2 py-1 rounded ${
                              insight.priority === 'high' ? 'bg-red-100 text-red-700' :
                              insight.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-green-100 text-green-700'
                            }`}>
                              {insight.type}
                            </span>
                            <span className={`w-2 h-2 rounded-full ${
                              insight.priority === 'high' ? 'bg-red-500' :
                              insight.priority === 'medium' ? 'bg-yellow-500' :
                              'bg-green-500'
                            }`}></span>
                          </div>
                          <h5 className="font-medium text-gray-900 mb-1">{insight.title}</h5>
                          <p className="text-sm text-gray-700 mb-2">{insight.message}</p>
                          {insight.recommendation && (
                            <p className="text-sm font-medium text-gray-800 bg-white p-2 rounded border">
                              💡 {insight.recommendation}
                            </p>
                          )}
                          {insight.gfhEvidence && (
                            <div className="mt-2 text-xs text-gray-500">
                              📈 Evidence: {insight.gfhEvidence}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ollama Forecasts */}
            {ollamaForecasts && (
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  AI Performance Forecasts
                </h4>
                <div className="grid md:grid-cols-2 gap-4">
                  {Object.entries(ollamaForecasts).map(([key, value]) => (
                    <div key={key} className="p-3 bg-gray-50 rounded border">
                      <div className="text-sm font-medium text-gray-900 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </div>
                      <div className="text-lg font-semibold text-gray-800">
                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ollama Recommendations */}
            {ollamaRecommendations.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-yellow-500" />
                  AI Strategic Recommendations ({ollamaRecommendations.length})
                </h4>
                <div className="space-y-2">
                  {ollamaRecommendations.map((rec, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded border border-blue-200">
                      <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Data Source Info */}
            {ollamaDataSource && (
              <div className="p-3 bg-gray-100 rounded border">
                <div className="text-xs text-gray-600">
                  📊 Analysis based on: {ollamaDataSource}
                </div>
              </div>
            )}

            {ollamaInsights.length === 0 && ollamaStatus === 'inactive' && (
              <div className="text-center py-8 text-gray-500">
                <Brain className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Enter campaign parameters to get AI-powered insights</p>
              </div>
            )}
          </div>
        )}
        {activeTab === 'insights' && <DynamicInsights insights={dynamicInsights} />}
        {activeTab === 'timing' && recommendations && <TimingRecommendations recommendations={recommendations.timingRecommendations} />}
        {activeTab === 'content' && recommendations && <ContentRecommendations recommendations={recommendations.contentRecommendations} />}
        {activeTab === 'markets' && recommendations && <MarketInsights insights={recommendations.marketInsights} />}
        {activeTab === 'platforms' && recommendations && <PlatformRecommendations recommendations={recommendations.platformRecommendations} />}
        {activeTab === 'strategy' && recommendations && <OverallStrategy strategy={recommendations.overallStrategy} />}
        {activeTab === 'vector-search' && <VectorSearchTab />}
      </div>

      {/* Footer */}
      <div className="px-6 py-3 bg-gray-50 border-t">
        <div className="flex items-center text-xs text-gray-500">
          <Eye className="w-3 h-3 mr-1" />
          {dynamicInsights.length} real-time insights from GFH data • 
          {recommendations ? (
            recommendations.timingRecommendations.length + 
            recommendations.contentRecommendations.length + 
            recommendations.marketInsights.length + 
            recommendations.platformRecommendations.length
          ) : 0} additional recommendations
        </div>
      </div>
    </div>
  );
};

export default CampaignAssistantComponent;
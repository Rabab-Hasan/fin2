// Campaign Assistant API Client - Connects to Ollama-powered backend
import secureApiClient from './secure-api-client';

interface CampaignSetup {
  budget: number;
  duration: number;
  countries: string[];
  platforms: string[];
  objectives?: string[];
  contentTypes?: string[];
}

interface OllamaInsight {
  type: 'platform' | 'market' | 'timing' | 'budget' | 'performance' | 'system';
  priority: 'high' | 'medium' | 'low';
  title: string;
  message: string;
  recommendation: string;
  gfhEvidence: string;
}

interface OllamaForecasts {
  expectedCTR: number;
  expectedCPC: number;
  expectedCPM: number;
  expectedReach: number;
  expectedImpressions: number;
  confidenceLevel: 'high' | 'medium' | 'low';
}

interface OllamaAnalysisResponse {
  success: boolean;
  analysis: {
    insights: OllamaInsight[];
    forecasts: OllamaForecasts;
    recommendations: string[];
  };
  dataSource: {
    campaignsAnalyzed: number;
    totalGFHCampaigns: number;
    weeklyDataPoints: number;
    markets: string[];
    platforms: string[];
  };
  ollamaPowered: boolean;
  error?: string;
}

interface GFHQuestionResponse {
  success: boolean;
  response: {
    answer: string;
    evidence: Array<{
      campaign: string;
      platform: string;
      market: string;
      metric: string;
      value: string;
    }>;
    insights: string[];
    recommendations: string[];
  };
  dataSource: string;
  campaignsAnalyzed: number;
  ollamaPowered: boolean;
  error?: string;
}

class CampaignAssistantAPI {
  private baseURL = '/api/campaign-assistant';

  /**
   * Get Ollama AI-powered campaign analysis using GFH data
   */
  async analyzeCampaign(setup: CampaignSetup): Promise<OllamaAnalysisResponse> {
    try {
      console.log('🤖 Requesting Ollama campaign analysis:', setup);
      
      const response = await secureApiClient.post(`${this.baseURL}/analyze`, setup);
      
      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Ollama campaign analysis received:', result);
      
      return result;
    } catch (error) {
      console.error('❌ Campaign analysis error:', error);
      
      // Return fallback response when backend is unavailable
      return {
        success: false,
        analysis: {
          insights: [
            {
              type: 'system',
              priority: 'high',
              title: 'Backend Connection Failed',
              message: 'Cannot connect to Campaign Assistant backend. Please ensure the backend server is running on port 2345.',
              recommendation: 'Start the backend server and ensure Ollama is running for AI-powered insights.',
              gfhEvidence: 'Backend connection error'
            }
          ],
          forecasts: {
            expectedCTR: 0.015,
            expectedCPC: 0.20,
            expectedCPM: 3.50,
            expectedReach: setup.budget * 1000,
            expectedImpressions: setup.budget * 5000,
            confidenceLevel: 'low'
          },
          recommendations: [
            'Start backend server: npm start in backend directory',
            'Install Ollama: https://ollama.ai/',
            'Run: ollama serve && ollama pull mistral',
            'Restart application for AI insights'
          ]
        },
        dataSource: {
          campaignsAnalyzed: 0,
          totalGFHCampaigns: 0,
          weeklyDataPoints: 0,
          markets: [],
          platforms: []
        },
        ollamaPowered: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Ask specific questions about GFH campaign data using Ollama
   */
  async askGFHQuestion(question: string): Promise<GFHQuestionResponse> {
    try {
      console.log('❓ Asking Ollama about GFH data:', question);
      
      const response = await secureApiClient.post(`${this.baseURL}/ask`, { question });
      
      if (!response.ok) {
        throw new Error(`Question failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Ollama GFH question answered:', result);
      
      return result;
    } catch (error) {
      console.error('❌ GFH question error:', error);
      
      return {
        success: false,
        response: {
          answer: 'Cannot connect to Campaign Assistant backend. Please ensure the backend server is running and Ollama AI service is available.',
          evidence: [],
          insights: ['Backend connection failed'],
          recommendations: ['Check backend server and Ollama service']
        },
        dataSource: 'Error - Backend unavailable',
        campaignsAnalyzed: 0,
        ollamaPowered: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get recommendations for specific market/platform combinations
   */
  async getMarketPlatformRecommendations(markets: string[], platforms: string[]): Promise<GFHQuestionResponse> {
    const question = `Based on GFH performance data, what are the best recommendations for ${platforms.join(' and ')} campaigns in ${markets.join(' and ')}? Show performance metrics, expected CTR/CPC/CPM, and budget allocation suggestions.`;
    return this.askGFHQuestion(question);
  }

  /**
   * Get timing optimization recommendations from GFH weekly data
   */
  async getTimingRecommendations(duration: number, budget: number): Promise<GFHQuestionResponse> {
    const question = `Based on GFH weekly performance data, what is the optimal timing for a ${duration}-day campaign with $${budget} budget? Show best performing weeks, seasonal patterns, and timing strategy.`;
    return this.askGFHQuestion(question);
  }

  /**
   * Get budget optimization insights from GFH data
   */
  async getBudgetOptimization(budget: number, markets: string[], platforms: string[]): Promise<GFHQuestionResponse> {
    const question = `How should I optimize a $${budget} budget across ${platforms.join(', ')} platforms for ${markets.join(', ')} markets? Use GFH performance data to show expected results and budget distribution.`;
    return this.askGFHQuestion(question);
  }

  /**
   * Compare platform performance using GFH data
   */
  async comparePlatformPerformance(platforms: string[], market?: string): Promise<GFHQuestionResponse> {
    const marketFilter = market ? ` in ${market}` : ' across all markets';
    const question = `Compare ${platforms.join(', ')} platform performance${marketFilter} using GFH data. Show CTR, CPC, CPM comparisons and which platform is most cost-effective.`;
    return this.askGFHQuestion(question);
  }
}

// Export singleton instance
export const campaignAssistantAPI = new CampaignAssistantAPI();

// Export types for component usage
export type {
  CampaignSetup,
  OllamaInsight,
  OllamaForecasts,
  OllamaAnalysisResponse,
  GFHQuestionResponse
};
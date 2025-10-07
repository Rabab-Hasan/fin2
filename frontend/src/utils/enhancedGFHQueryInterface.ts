// Enhanced GFH Query Interface with Vector Database Integration
import GFHSemanticQueryEngine, { type SemanticQueryResponse } from './gfhSemanticQueryEngine';

export interface EnhancedGFHResponse {
  answer: string;
  confidence: number;
  dataSource: 'vector_database';
  campaignsAnalyzed: number;
  insights: string[];
  recommendations: string[];
  rawData: any;
}

class EnhancedGFHQueryInterface {
  private queryEngine = GFHSemanticQueryEngine;

  // Main query method that searches through ALL GFH data
  async askAnyQuestion(question: string): Promise<EnhancedGFHResponse> {
    const response: SemanticQueryResponse = await this.queryEngine.query(question);
    
    return {
      answer: response.answer,
      confidence: response.confidence,
      dataSource: 'vector_database',
      campaignsAnalyzed: response.sources.length,
      insights: response.insights,
      recommendations: response.recommendations,
      rawData: response.data
    };
  }

  // Specific optimized queries for common questions
  async getInstagramTimingInOman(): Promise<EnhancedGFHResponse> {
    return await this.askAnyQuestion(
      "What's the best time to post Instagram videos in Oman? Show me Meta platform performance in Oman market with timing recommendations and CTR data."
    );
  }

  async getBestPerformingPlatform(): Promise<EnhancedGFHResponse> {
    return await this.askAnyQuestion(
      "Which platform has the best performance across all markets? Compare Meta, Google UAC, Twitter, LinkedIn, and In-Mobi CTR and CPC performance."
    );
  }

  async getMarketComparison(): Promise<EnhancedGFHResponse> {
    return await this.askAnyQuestion(
      "Compare performance across all GCC markets. Show CTR, CPC, and spend data for Oman, Saudi Arabia, UAE, Kuwait, Qatar, and Bahrain."
    );
  }

  async getCostEfficiencyAnalysis(): Promise<EnhancedGFHResponse> {
    return await this.askAnyQuestion(
      "Which campaigns have the best cost efficiency? Show CPC, spend, and cost per acquisition data across all platforms and markets."
    );
  }

  async getCampaignRecommendations(budget: number, market: string, platform: string): Promise<EnhancedGFHResponse> {
    return await this.askAnyQuestion(
      `Based on GFH data, what are the best campaign recommendations for ${platform} in ${market} with a $${budget} budget? Show similar campaigns, expected CTR, CPC, and performance benchmarks.`
    );
  }

  async getSeasonalInsights(): Promise<EnhancedGFHResponse> {
    return await this.askAnyQuestion(
      "What are the seasonal performance trends in the GFH campaigns? Show performance by campaign timing, duration, and seasonal patterns in 2025."
    );
  }

  async getBudgetOptimization(targetMarket: string, targetBudget: number): Promise<EnhancedGFHResponse> {
    return await this.askAnyQuestion(
      `How should I optimize a $${targetBudget} budget for ${targetMarket}? Show platform allocation recommendations, expected reach, CTR, and CPC based on GFH historical performance.`
    );
  }

  async getContentPerformanceInsights(): Promise<EnhancedGFHResponse> {
    return await this.askAnyQuestion(
      "Which content types and objectives perform best across different platforms? Analyze awareness, CTAP, app installs, and traffic campaigns from GFH data."
    );
  }

  // Dynamic campaign analysis using vector search
  async analyzeCampaignPlan(campaignData: {
    budget: number;
    duration: number;
    markets: string[];
    platforms: string[];
    objectives: string[];
    contentTypes: string[];
  }): Promise<EnhancedGFHResponse> {
    const query = `
      Analyze campaign plan with ${campaignData.budget} budget for ${campaignData.duration} days 
      in ${campaignData.markets.join(', ')} using ${campaignData.platforms.join(', ')} platforms 
      with ${campaignData.objectives.join(', ')} objectives and ${campaignData.contentTypes.join(', ')} content.
      
      Based on GFH historical data, provide:
      - Expected CTR and CPC benchmarks
      - Similar campaign performance comparisons
      - Budget allocation recommendations per platform
      - Timeline and optimization suggestions
      - Risk assessment and success probability
    `;
    
    return await this.askAnyQuestion(query);
  }

  // Real-time competitive analysis
  async getCompetitiveAnalysis(platform: string, market: string): Promise<EnhancedGFHResponse> {
    return await this.askAnyQuestion(
      `Provide competitive analysis for ${platform} in ${market}. Show benchmark performance data, market position, cost trends, and optimization opportunities based on all available GFH campaign data.`
    );
  }

  // Advanced performance forecasting
  async forecastCampaignPerformance(
    platform: string, 
    market: string, 
    budget: number, 
    duration: number
  ): Promise<EnhancedGFHResponse> {
    return await this.askAnyQuestion(
      `Forecast campaign performance for ${platform} in ${market} with $${budget} budget over ${duration} days. 
      Based on GFH historical data, predict expected impressions, clicks, CTR, CPC, reach, and total cost. 
      Include confidence intervals and risk factors.`
    );
  }
}

// Export singleton instance
const enhancedGFH = new EnhancedGFHQueryInterface();

export { enhancedGFH };

// Legacy compatibility exports with enhanced functionality
export const askGFH = {
  // Original methods now powered by vector database
  instagramTimingOman: async (): Promise<string> => {
    const result = await enhancedGFH.getInstagramTimingInOman();
    return result.answer;
  },
  
  platformTiming: async (platform: string, market: string): Promise<string> => {
    const result = await enhancedGFH.askAnyQuestion(
      `What's the best timing and performance data for ${platform} campaigns in ${market}? Show CTR, CPC, reach, and timing recommendations from GFH data.`
    );
    return result.answer;
  },
  
  contentRecommendations: async (platform: string, market: string): Promise<string> => {
    const result = await enhancedGFH.getContentPerformanceInsights();
    return result.answer;
  },
  
  marketComparison: async (): Promise<string> => {
    const result = await enhancedGFH.getMarketComparison();
    return result.answer;
  },

  // New enhanced methods
  askAnyQuestion: async (question: string): Promise<string> => {
    const result = await enhancedGFH.askAnyQuestion(question);
    return result.answer;
  },

  getDetailedAnalysis: async (question: string): Promise<EnhancedGFHResponse> => {
    return await enhancedGFH.askAnyQuestion(question);
  },

  analyzeCampaign: async (campaignData: any): Promise<EnhancedGFHResponse> => {
    return await enhancedGFH.analyzeCampaignPlan(campaignData);
  },

  forecastPerformance: async (platform: string, market: string, budget: number, duration: number): Promise<EnhancedGFHResponse> => {
    return await enhancedGFH.forecastCampaignPerformance(platform, market, budget, duration);
  }
};

export default enhancedGFH;
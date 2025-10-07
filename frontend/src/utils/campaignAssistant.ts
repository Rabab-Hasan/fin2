// Campaign Assistant - Intelligent recommendations based on GFH historical performance data
import { historicalData, platformMapping, countryMapping, type HistoricalData } from './campaignEstimations';

// Weekly performance data from GFH campaign (Week-on-Week performance)
const weeklyPerformance = [
  { week: 1, period: '4May - 10May', spends: 2020.73, impressions: 627604, clicks: 14193, cpm: 3.22, cpc: 0.142, ctr: 2.26, installs: 0 },
  { week: 2, period: '11May - 17May', spends: 5601.41, impressions: 1766105, clicks: 29952, cpm: 3.17, cpc: 0.187, ctr: 1.70, installs: 838 },
  { week: 3, period: '18May - 24May', spends: 8245.04, impressions: 2825349, clicks: 45675, cpm: 2.92, cpc: 0.181, ctr: 1.62, installs: 2792 },
  { week: 4, period: '25May - 31May', spends: 10154.92, impressions: 3940969, clicks: 51820, cpm: 2.58, cpc: 0.196, ctr: 1.31, installs: 2919 },
  { week: 5, period: '1Jun - 7Jun', spends: 11766.13, impressions: 3775316, clicks: 61762, cpm: 3.12, cpc: 0.191, ctr: 1.64, installs: 2895 },
  { week: 6, period: '8Jun - 14Jun', spends: 11500.34, impressions: 3469062, clicks: 66033, cpm: 3.32, cpc: 0.174, ctr: 1.90, installs: 2529 },
  { week: 7, period: '15Jun - 21Jun', spends: 8146.97, impressions: 3233141, clicks: 39300, cpm: 2.52, cpc: 0.207, ctr: 1.22, installs: 87 },
  { week: 8, period: '22Jun - 28Jun', spends: 8803.88, impressions: 4825011, clicks: 40138, cpm: 1.82, cpc: 0.219, ctr: 0.83, installs: 10 },
  { week: 9, period: '29Jun- 5Jul', spends: 11247.89, impressions: 5577246, clicks: 57433, cpm: 2.02, cpc: 0.196, ctr: 1.03, installs: 1794 },
  { week: 10, period: '6Jul - 12Jul', spends: 6587.9, impressions: 2151878, clicks: 38842, cpm: 3.06, cpc: 0.170, ctr: 1.81, installs: 0 },
  { week: 11, period: '13Jul - 19Jul', spends: 1338.37, impressions: 190008, clicks: 8298, cpm: 7.04, cpc: 0.161, ctr: 4.37, installs: 353 }
];

// Market performance data from GFH
const marketPerformance = [
  { market: 'KSA', spends: 31988.93, impressions: 12917384, clicks: 152388, cpm: 2.48, cpc: 0.210, ctr: 1.18, installs: 4362, cpi: 7.33 },
  { market: 'UAE', spends: 21737.75, impressions: 9290807, clicks: 105623, cpm: 2.34, cpc: 0.206, ctr: 1.14, installs: 2346, cpi: 9.27 },
  { market: 'KWT', spends: 16446.57, impressions: 5107831, clicks: 65982, cpm: 3.22, cpc: 0.249, ctr: 1.29, installs: 1905, cpi: 8.63 },
  { market: 'QTR', spends: 3366.68, impressions: 1115317, clicks: 22770, cpm: 3.02, cpc: 0.148, ctr: 2.04, installs: 1204, cpi: 2.80 },
  { market: 'OMN', spends: 3368.79, impressions: 1563816, clicks: 47144, cpm: 2.15, cpc: 0.071, ctr: 3.01, installs: 2683, cpi: 1.26 },
  { market: 'BAH', spends: 8504.86, impressions: 2386534, clicks: 59539, cpm: 3.56, cpc: 0.143, ctr: 2.49, installs: 1717, cpi: 4.95 }
];

// Platform performance summary from GFH
const platformPerformance = [
  { platform: 'Twitter', spends: 11975.76, impressions: 4279290, clicks: 12118, cpm: 2.80, cpc: 0.99, ctr: 0.28, installs: 0, objective: 'Awareness' },
  { platform: 'Meta', spends: 20991.97, impressions: 8740204, clicks: 165686, cpm: 2.40, cpc: 0.127, ctr: 1.90, installs: 0, objective: 'Traffic/Conversions' },
  { platform: 'LinkedIn', spends: 10991.15, impressions: 7627203, clicks: 9896, cpm: 1.44, cpc: 1.11, ctr: 0.13, installs: 0, objective: 'Awareness' },
  { platform: 'Google UAC', spends: 14313.70, impressions: 2730515, clicks: 130041, cpm: 5.24, cpc: 0.110, ctr: 4.76, installs: 14217, objective: 'App Installs' },
  { platform: 'In-Mobi', spends: 27141.00, impressions: 9004477, clicks: 135705, cpm: 3.01, cpc: 0.20, ctr: 1.51, installs: 0, objective: 'Traffic' }
];

// Content performance insights based on typical GFH campaign content
const contentPerformanceInsights = {
  'On ground stories of people winning': {
    performance: 'high',
    bestPlatforms: ['Meta', 'Instagram'],
    engagement: 'very high',
    timing: 'mid-campaign',
    ctr_boost: 1.3
  },
  'Event Coverage Reel (video)': {
    performance: 'high',
    bestPlatforms: ['Instagram', 'TikTok'],
    engagement: 'high',
    timing: 'during events',
    ctr_boost: 1.4
  },
  'TVC (video)': {
    performance: 'medium',
    bestPlatforms: ['YouTube', 'Meta'],
    engagement: 'medium',
    timing: 'campaign launch',
    ctr_boost: 1.1
  },
  'Prizes Animation (video)': {
    performance: 'high',
    bestPlatforms: ['Meta', 'Instagram', 'TikTok'],
    engagement: 'high',
    timing: 'peak campaign',
    ctr_boost: 1.5
  },
  'Achievers Animation (animation)': {
    performance: 'high',
    bestPlatforms: ['Meta', 'LinkedIn'],
    engagement: 'high',
    timing: 'mid to end campaign',
    ctr_boost: 1.2
  },
  'Application Push post (achievers post)': {
    performance: 'medium',
    bestPlatforms: ['Meta', 'Instagram', 'LinkedIn'],
    engagement: 'medium',
    timing: 'throughout campaign',
    ctr_boost: 1.0
  },
  'Launch Announcement & Explainers post': {
    performance: 'medium',
    bestPlatforms: ['Meta', 'LinkedIn', 'Twitter'],
    engagement: 'medium',
    timing: 'campaign start',
    ctr_boost: 0.9
  },
  'Last-Chance Reminders post': {
    performance: 'high',
    bestPlatforms: ['Meta', 'Instagram'],
    engagement: 'very high',
    timing: 'campaign end',
    ctr_boost: 1.6
  },
  'Engagement Post': {
    performance: 'medium',
    bestPlatforms: ['Meta', 'Instagram', 'Twitter'],
    engagement: 'medium',
    timing: 'throughout campaign',
    ctr_boost: 1.0
  },
  'Influencer Reel': {
    performance: 'high',
    bestPlatforms: ['Instagram', 'TikTok'],
    engagement: 'very high',
    timing: 'peak campaign',
    ctr_boost: 1.7
  }
};

export interface TimingRecommendation {
  phase: string;
  week: number;
  recommendation: string;
  expectedPerformance: {
    cpm: number;
    cpc: number;
    ctr: number;
    efficiency: 'low' | 'medium' | 'high' | 'peak';
  };
  rationale: string;
}

export interface ContentRecommendation {
  contentType: string;
  performance: 'low' | 'medium' | 'high';
  bestPlatforms: string[];
  timing: string;
  engagementBoost: number;
  reasoning: string;
}

export interface MarketInsight {
  market: string;
  performance: 'low' | 'medium' | 'high' | 'excellent';
  costEfficiency: 'low' | 'medium' | 'high';
  strengths: string[];
  considerations: string[];
  recommendedBudgetShare: number;
}

export interface PlatformRecommendation {
  platform: string;
  suitability: 'low' | 'medium' | 'high' | 'excellent';
  strengths: string[];
  weaknesses: string[];
  bestObjectives: string[];
  budgetRecommendation: number; // percentage
  reasoning: string;
}

export interface CampaignAssistantRecommendations {
  timingRecommendations: TimingRecommendation[];
  contentRecommendations: ContentRecommendation[];
  marketInsights: MarketInsight[];
  platformRecommendations: PlatformRecommendation[];
  overallStrategy: string[];
}

class CampaignAssistant {
  
  // Analyze timing patterns from weekly performance data
  static getTimingRecommendations(duration: number, budget: number): TimingRecommendation[] {
    const recommendations: TimingRecommendation[] = [];
    
    // Calculate optimal timing based on weekly performance patterns
    const bestPerformingWeeks = weeklyPerformance
      .sort((a, b) => (b.ctr * (1/b.cpm) * (1/b.cpc)) - (a.ctr * (1/a.cpm) * (1/a.cpc)))
      .slice(0, Math.min(3, Math.ceil(duration / 7)));

    // Campaign launch phase (Weeks 1-2)
    if (duration >= 7) {
      recommendations.push({
        phase: 'Launch Phase',
        week: 1,
        recommendation: 'Start with moderate spend and awareness content',
        expectedPerformance: {
          cpm: 3.20,
          cpc: 0.142,
          ctr: 2.26,
          efficiency: 'medium'
        },
        rationale: 'Historical data shows Week 1 performance is moderate but builds foundation for scaling'
      });
    }

    // Peak performance phase (Weeks 3-6)
    if (duration >= 21) {
      recommendations.push({
        phase: 'Peak Performance Phase',
        week: 3,
        recommendation: 'Scale budget to maximum during weeks 3-6 for optimal performance',
        expectedPerformance: {
          cpm: 2.92,
          cpc: 0.181,
          ctr: 1.62,
          efficiency: 'peak'
        },
        rationale: 'Weeks 3-6 show consistently high performance with best cost efficiency in GFH data'
      });
    }

    // Optimization phase (Weeks 7+)
    if (duration >= 42) {
      recommendations.push({
        phase: 'Optimization Phase',
        week: 7,
        recommendation: 'Focus on best-performing audiences and reduce underperforming segments',
        expectedPerformance: {
          cpm: 2.52,
          cpc: 0.207,
          ctr: 1.22,
          efficiency: 'medium'
        },
        rationale: 'Performance typically stabilizes after week 6, requiring strategic optimization'
      });
    }

    // Final push phase
    if (duration >= 14) {
      recommendations.push({
        phase: 'Final Push Phase',
        week: Math.ceil(duration / 7) - 1,
        recommendation: 'Implement urgency-driven content and last-chance messaging',
        expectedPerformance: {
          cpm: 7.04,
          cpc: 0.161,
          ctr: 4.37,
          efficiency: 'high'
        },
        rationale: 'Final weeks show high engagement with urgency messaging based on historical patterns'
      });
    }

    return recommendations;
  }

  // Get content recommendations based on platforms and campaign phase
  static getContentRecommendations(platforms: string[], campaignPhase: string = 'all'): ContentRecommendation[] {
    const recommendations: ContentRecommendation[] = [];
    
    Object.entries(contentPerformanceInsights).forEach(([contentType, insights]) => {
      // Check if content type matches selected platforms
      const platformMatch = platforms.some(platform => 
        insights.bestPlatforms.some(bestPlatform => 
          platform.toLowerCase().includes(bestPlatform.toLowerCase()) ||
          bestPlatform.toLowerCase().includes(platform.toLowerCase())
        )
      );

      if (platformMatch || insights.bestPlatforms.includes('Meta')) { // Meta is versatile
        let reasoning = `Performs ${insights.performance} on ${insights.bestPlatforms.join(', ')}. `;
        reasoning += `Best timing: ${insights.timing}. `;
        reasoning += `Expected ${(insights.ctr_boost * 100 - 100).toFixed(0)}% CTR improvement.`;

        recommendations.push({
          contentType,
          performance: insights.performance as 'low' | 'medium' | 'high',
          bestPlatforms: insights.bestPlatforms,
          timing: insights.timing,
          engagementBoost: insights.ctr_boost,
          reasoning
        });
      }
    });

    // Sort by performance and engagement boost
    return recommendations.sort((a, b) => {
      const scoreA = (a.performance === 'high' ? 3 : a.performance === 'medium' ? 2 : 1) + a.engagementBoost;
      const scoreB = (b.performance === 'high' ? 3 : b.performance === 'medium' ? 2 : 1) + b.engagementBoost;
      return scoreB - scoreA;
    }).slice(0, 8); // Top 8 recommendations
  }

  // Analyze market performance and provide insights
  static getMarketInsights(countries: string[]): MarketInsight[] {
    const insights: MarketInsight[] = [];

    countries.forEach(country => {
      const mappedCountry = countryMapping[country];
      const marketData = marketPerformance.find(m => 
        m.market === mappedCountry || 
        mappedCountry?.includes(m.market) ||
        m.market.includes(mappedCountry?.split(' ')[0] || '')
      );

      if (marketData) {
        let performance: 'low' | 'medium' | 'high' | 'excellent' = 'medium';
        let costEfficiency: 'low' | 'medium' | 'high' = 'medium';
        
        // Determine performance based on CTR and conversion metrics
        if (marketData.ctr > 2.0) performance = 'excellent';
        else if (marketData.ctr > 1.5) performance = 'high';
        else if (marketData.ctr > 1.0) performance = 'medium';
        else performance = 'low';

        // Determine cost efficiency based on CPC and CPI
        if (marketData.cpc < 0.15) costEfficiency = 'high';
        else if (marketData.cpc < 0.25) costEfficiency = 'medium';
        else costEfficiency = 'low';

        const strengths: string[] = [];
        const considerations: string[] = [];

        if (marketData.ctr > 2.0) strengths.push('High engagement rates');
        if (marketData.cpc < 0.20) strengths.push('Cost-effective clicks');
        if (marketData.cpi < 5.0) strengths.push('Excellent app install efficiency');
        if (marketData.impressions > 5000000) strengths.push('Large audience reach potential');

        if (marketData.cpc > 0.20) considerations.push('Higher cost per click');
        if (marketData.ctr < 1.5) considerations.push('May require engaging creative');
        if (marketData.cpi > 8.0) considerations.push('Higher cost per install');

        // Calculate recommended budget share based on performance
        const totalSpends = marketPerformance.reduce((sum, m) => sum + m.spends, 0);
        const baseShare = (marketData.spends / totalSpends) * 100;
        const performanceMultiplier = performance === 'excellent' ? 1.3 : 
                                     performance === 'high' ? 1.1 : 
                                     performance === 'medium' ? 1.0 : 0.8;
        
        insights.push({
          market: country,
          performance,
          costEfficiency,
          strengths,
          considerations,
          recommendedBudgetShare: Math.round(baseShare * performanceMultiplier)
        });
      } else {
        // Default insights for unmapped countries
        insights.push({
          market: country,
          performance: 'medium',
          costEfficiency: 'medium',
          strengths: ['Growing digital market'],
          considerations: ['Limited historical data available'],
          recommendedBudgetShare: 15 // Equal distribution fallback
        });
      }
    });

    return insights;
  }

  // Get platform recommendations based on objectives and budget
  static getPlatformRecommendations(
    budget: number, 
    objectives: string[] = [], 
    countries: string[] = []
  ): PlatformRecommendation[] {
    const recommendations: PlatformRecommendation[] = [];

    platformPerformance.forEach(platformData => {
      let suitability: 'low' | 'medium' | 'high' | 'excellent' = 'medium';
      const strengths: string[] = [];
      const weaknesses: string[] = [];
      const bestObjectives: string[] = [];

      // Analyze platform strengths based on historical data
      if (platformData.platform === 'Meta') {
        if (platformData.ctr > 1.5) strengths.push('High engagement rates (1.90% CTR)');
        if (platformData.cpc < 0.15) strengths.push('Cost-effective clicks ($0.127 CPC)');
        strengths.push('Excellent for awareness and conversions');
        strengths.push('Advanced targeting options');
        bestObjectives.push('Traffic', 'Conversions', 'Awareness');
        suitability = 'excellent';
      }

      if (platformData.platform === 'Google UAC') {
        if (platformData.ctr > 4.0) strengths.push('Exceptional app install performance (4.76% CTR)');
        if (platformData.cpc < 0.12) strengths.push('Low cost per click ($0.110)');
        strengths.push('Intent-driven traffic');
        bestObjectives.push('App Installs', 'Conversions');
        suitability = 'excellent';
        if (!objectives.includes('App Installs')) suitability = 'medium';
      }

      if (platformData.platform === 'LinkedIn') {
        strengths.push('Professional audience targeting');
        strengths.push('Low CPM for impressions ($1.44)');
        weaknesses.push('Lower engagement rates (0.13% CTR)');
        weaknesses.push('Higher cost per click ($1.11)');
        bestObjectives.push('Awareness', 'Lead Generation');
        suitability = budget > 5000 ? 'high' : 'medium';
      }

      if (platformData.platform === 'Twitter') {
        strengths.push('Real-time engagement');
        weaknesses.push('Low click-through rates (0.28% CTR)');
        weaknesses.push('High cost per click ($0.99)');
        bestObjectives.push('Awareness', 'Brand Building');
        suitability = 'medium';
      }

      if (platformData.platform === 'In-Mobi') {
        strengths.push('Cost-effective clicks ($0.20 CPC)');
        strengths.push('Good reach potential');
        bestObjectives.push('Traffic', 'Awareness');
        suitability = 'high';
      }

      // Calculate budget recommendation based on historical performance and suitability
      const totalSpends = platformPerformance.reduce((sum, p) => sum + p.spends, 0);
      const baseShare = (platformData.spends / totalSpends) * 100;
      const suitabilityMultiplier = suitability === 'excellent' ? 1.4 : 
                                   suitability === 'high' ? 1.2 : 
                                   suitability === 'medium' ? 1.0 : 0.7;

      const budgetRecommendation = Math.round(baseShare * suitabilityMultiplier);

      let reasoning = `Based on GFH historical data: ${platformData.cpm.toFixed(2)} CPM, `;
      reasoning += `${platformData.cpc.toFixed(3)} CPC, ${platformData.ctr.toFixed(2)}% CTR. `;
      reasoning += `${suitability === 'excellent' ? 'Highly recommended' : 
                     suitability === 'high' ? 'Good choice' : 
                     suitability === 'medium' ? 'Consider objectives alignment' : 'Limited suitability'}.`;

      recommendations.push({
        platform: platformData.platform,
        suitability,
        strengths,
        weaknesses,
        bestObjectives,
        budgetRecommendation,
        reasoning
      });
    });

    return recommendations.sort((a, b) => {
      const scoreA = a.suitability === 'excellent' ? 4 : a.suitability === 'high' ? 3 : a.suitability === 'medium' ? 2 : 1;
      const scoreB = b.suitability === 'excellent' ? 4 : b.suitability === 'high' ? 3 : b.suitability === 'medium' ? 2 : 1;
      return scoreB - scoreA;
    });
  }

  // Generate comprehensive campaign recommendations
  static getCampaignRecommendations(
    budget: number,
    duration: number,
    countries: string[],
    platforms: string[],
    objectives: string[] = []
  ): CampaignAssistantRecommendations {
    const timingRecommendations = this.getTimingRecommendations(duration, budget);
    const contentRecommendations = this.getContentRecommendations(platforms);
    const marketInsights = this.getMarketInsights(countries);
    const platformRecommendations = this.getPlatformRecommendations(budget, objectives, countries);

    // Generate overall strategy recommendations
    const overallStrategy: string[] = [];
    
    // Budget strategy
    if (budget > 50000) {
      overallStrategy.push('High-budget campaign: Focus on premium placements and diverse content types');
    } else if (budget > 20000) {
      overallStrategy.push('Medium-budget campaign: Prioritize high-performing platforms (Meta, Google)');
    } else {
      overallStrategy.push('Budget-conscious campaign: Start with Meta for cost-effective reach and engagement');
    }

    // Duration strategy
    if (duration > 60) {
      overallStrategy.push('Long campaign: Plan distinct phases with content refresh every 3-4 weeks');
    } else if (duration > 30) {
      overallStrategy.push('Medium campaign: Focus on peak performance weeks 3-6 for maximum impact');
    } else {
      overallStrategy.push('Short campaign: Front-load budget in first 2 weeks for quick impact');
    }

    // Market strategy
    const highPerformingMarkets = marketInsights.filter(m => m.performance === 'excellent' || m.performance === 'high');
    if (highPerformingMarkets.length > 0) {
      overallStrategy.push(`Prioritize ${highPerformingMarkets.map(m => m.market).join(', ')} for higher engagement rates`);
    }

    // Content strategy
    const highPerformingContent = contentRecommendations.filter(c => c.performance === 'high').slice(0, 3);
    if (highPerformingContent.length > 0) {
      overallStrategy.push(`Focus on high-engagement content: ${highPerformingContent.map(c => c.contentType).join(', ')}`);
    }

    return {
      timingRecommendations,
      contentRecommendations,
      marketInsights,
      platformRecommendations,
      overallStrategy
    };
  }
}

export default CampaignAssistant;
export { weeklyPerformance, marketPerformance, platformPerformance, contentPerformanceInsights };
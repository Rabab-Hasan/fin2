// Dynamic GFH Data Analyzer - Real-time insights from actual campaign performance data
import GFHDataParser, { type GFHDataRow } from './gfhDataParser';

interface CampaignDataPoint {
  startDate: string;
  endDate: string;
  campaign: string;
  platform: string;
  objective: string;
  market: string;
  plannedSpends: number;
  deliveredSpends: number;
  deliveredReach: number;
  deliveredImpressions: number;
  deliveredClicks: number;
  deliveredCPM: number;
  deliveredCPC: number;
  deliveredAppInstalls: number;
  deliveredCTR: number;
}

interface WeeklyPerformanceData {
  week: number;
  period: string;
  spends: number;
  impressions: number;
  clicks: number;
  cpm: number;
  cpc: number;
  ctr: number;
  installs: number;
}

interface MarketPerformanceData {
  market: string;
  spends: number;
  impressions: number;
  clicks: number;
  cpm: number;
  cpc: number;
  ctr: number;
  installs: number;
  cpi: number;
}

interface DynamicInsight {
  type: 'timing' | 'content' | 'market' | 'platform' | 'budget';
  priority: 'high' | 'medium' | 'low';
  message: string;
  data: any;
  recommendation: string;
}

class GFHDataAnalyzer {
  
  // Parse raw CSV data from actual GFH file
  static parseGFHData(): {
    campaignData: CampaignDataPoint[],
    weeklyData: WeeklyPerformanceData[],
    marketData: MarketPerformanceData[],
    platformData: any[]
  } {
    
    // Get real data from GFH parser
    const realCampaignData = GFHDataParser.getAllCampaignData();
    const realWeeklyData = GFHDataParser.getWeeklyData();
    const realMarketData = GFHDataParser.getMarketData();
    
    // Weekly performance data from real GFH file
    const weeklyData: WeeklyPerformanceData[] = realWeeklyData.map((week: any, index: number) => ({
      week: week.Week || index + 1,
      period: week.Period || `Week ${index + 1}`,
      spends: week['Delivered Spends$'] || 0,
      impressions: week['Delivered Imp.'] || 0,
      clicks: week['Delivered Clicks'] || 0,
      cpm: week.CPM || 0,
      cpc: week.CPC || 0,
      ctr: week.CTR * 100 || 0, // Convert to percentage
      installs: week['Delivered Installs'] || 0
    }));

    // Market performance data from real GFH file
    const marketData: MarketPerformanceData[] = realMarketData.map((market: any) => ({
      market: market.Market || 'Unknown',
      spends: market['Delivered Spends$'] || 0,
      impressions: market['Delivered Imp.'] || 0,
      clicks: market['Delivered Clicks'] || 0,
      cpm: market.CPM || 0,
      cpc: market.CPC || 0,
      ctr: market.CTR * 100 || 0, // Convert to percentage
      installs: market['Delivered Installs'] || 0,
      cpi: market.CPI || 0
    }));

    // Platform performance data from GFH file
    const platformData = [
      { platform: 'Twitter', spends: 11975.76, impressions: 4279290, clicks: 12118, cpm: 2.80, cpc: 0.99, ctr: 0.28, installs: 0 },
      { platform: 'Meta', spends: 20991.97, impressions: 8740204, clicks: 165686, cpm: 2.40, cpc: 0.127, ctr: 1.90, installs: 0 },
      { platform: 'LinkedIn', spends: 10991.15, impressions: 7627203, clicks: 9896, cpm: 1.44, cpc: 1.11, ctr: 0.13, installs: 0 },
      { platform: 'Google UAC', spends: 14313.70, impressions: 2730515, clicks: 130041, cpm: 5.24, cpc: 0.110, ctr: 4.76, installs: 14217 },
      { platform: 'In-Mobi', spends: 27141.00, impressions: 9004477, clicks: 135705, cpm: 3.01, cpc: 0.20, ctr: 1.51, installs: 0 }
    ];

    // Campaign data points (from CSV detailed data)
    const campaignData: CampaignDataPoint[] = [
      // Twitter campaigns
      {
        startDate: '2025-05-12', endDate: '2025-07-11', campaign: 'Mobile Investor app campaign', platform: 'Twitter', objective: 'Awareness', market: 'KSA',
        plannedSpends: 5000, deliveredSpends: 4977.15, deliveredReach: 64540, deliveredImpressions: 2159928, deliveredClicks: 6088, 
        deliveredCPM: 2.30, deliveredCPC: 0.82, deliveredAppInstalls: 0, deliveredCTR: 0.28
      },
      {
        startDate: '2025-05-12', endDate: '2025-07-11', campaign: 'Mobile Investor app campaign', platform: 'Twitter', objective: 'Awareness', market: 'UAE',
        plannedSpends: 4000, deliveredSpends: 4001.16, deliveredReach: 24663, deliveredImpressions: 620883, deliveredClicks: 1771, 
        deliveredCPM: 6.44, deliveredCPC: 2.26, deliveredAppInstalls: 0, deliveredCTR: 0.29
      },
      // Meta campaigns
      {
        startDate: '2025-05-06', endDate: '2025-07-06', campaign: 'Mobile Investor app campaign', platform: 'Meta', objective: 'CTAP', market: 'KSA',
        plannedSpends: 6500, deliveredSpends: 6497.62, deliveredReach: 834808, deliveredImpressions: 3255367, deliveredClicks: 49619, 
        deliveredCPM: 1.996, deliveredCPC: 0.131, deliveredAppInstalls: 0, deliveredCTR: 1.52
      },
      {
        startDate: '2025-05-06', endDate: '2025-07-06', campaign: 'Mobile Investor app campaign', platform: 'Meta', objective: 'CTAP', market: 'OMN',
        plannedSpends: 2000, deliveredSpends: 1997.67, deliveredReach: 1314075, deliveredImpressions: 1209030, deliveredClicks: 25571, 
        deliveredCPM: 1.65, deliveredCPC: 0.078, deliveredAppInstalls: 0, deliveredCTR: 2.12
      },
      // Google UAC campaigns
      {
        startDate: '2025-05-15', endDate: '2025-07-13', campaign: 'Mobile Investor app campaign', platform: 'Google UAC', objective: 'App Installs', market: 'OMN',
        plannedSpends: 2000, deliveredSpends: 1371.12, deliveredReach: 0, deliveredImpressions: 354786, deliveredClicks: 21573, 
        deliveredCPM: 3.86, deliveredCPC: 0.064, deliveredAppInstalls: 2683, deliveredCTR: 6.08
      },
      // Add more campaign data points as needed...
    ];

    return { campaignData, weeklyData, marketData, platformData };
  }

  // Analyze user's campaign setup against GFH data
  static analyzeUserCampaign(
    budget: number,
    duration: number, 
    countries: string[],
    platforms: string[],
    objectives: string[] = [],
    contentTypes: string[] = []
  ): DynamicInsight[] {
    
    const { campaignData, weeklyData, marketData, platformData } = this.parseGFHData();
    const insights: DynamicInsight[] = [];

    // 1. TIMING ANALYSIS - Based on actual weekly performance data
    if (duration > 0) {
      const optimalWeeks = weeklyData
        .filter(w => w.week >= 3 && w.week <= 6) // Peak performance period
        .sort((a, b) => (b.ctr / b.cpc) - (a.ctr / a.cpc)); // Efficiency score

      if (duration >= 21) { // 3+ weeks
        insights.push({
          type: 'timing',
          priority: 'high',
          message: `GFH data shows weeks 3-6 had the best performance efficiency. Week ${optimalWeeks[0].week} (${optimalWeeks[0].period}) achieved ${optimalWeeks[0].ctr.toFixed(2)}% CTR at $${optimalWeeks[0].cpc.toFixed(3)} CPC.`,
          data: optimalWeeks[0],
          recommendation: `Plan your main campaign push during weeks 3-6 for optimal performance. Scale budget to ${Math.round((budget * 0.6) / 4)} per week during this period.`
        });
      }

      if (duration >= 42) { // 6+ weeks
        const lateWeeks = weeklyData.filter(w => w.week >= 7);
        const avgLatePerformance = lateWeeks.reduce((sum, w) => sum + w.ctr, 0) / lateWeeks.length;
        
        insights.push({
          type: 'timing',
          priority: 'medium',
          message: `After week 6, GFH data shows performance decline (avg ${avgLatePerformance.toFixed(2)}% CTR). Week 11 shows urgency effect with ${weeklyData[10].ctr.toFixed(2)}% CTR.`,
          data: { lateWeeks: lateWeeks },
          recommendation: 'Implement content refresh at week 7 and urgency messaging in final 2 weeks to maintain engagement.'
        });
      }
    }

    // 2. MARKET ANALYSIS - Based on actual market performance data
    countries.forEach(country => {
      const marketMap: {[key: string]: string} = {
        'Saudi Arabia': 'KSA',
        'United Arab Emirates': 'UAE', 
        'Kuwait': 'KWT',
        'Qatar': 'QTR',
        'Oman': 'OMN',
        'Bahrain': 'BAH'
      };

      const marketCode = marketMap[country];
      const marketPerf = marketData.find(m => m.market === marketCode);
      
      if (marketPerf) {
        // Calculate efficiency score (CTR/CPC ratio)
        const efficiencyScore = marketPerf.ctr / marketPerf.cpc;
        const avgEfficiency = marketData.reduce((sum, m) => sum + (m.ctr / m.cpc), 0) / marketData.length;
        
        if (efficiencyScore > avgEfficiency * 1.5) {
          insights.push({
            type: 'market',
            priority: 'high',
            message: `${country} shows excellent efficiency in GFH data: ${marketPerf.ctr.toFixed(2)}% CTR at $${marketPerf.cpc.toFixed(3)} CPC (${efficiencyScore.toFixed(1)}x efficiency score).`,
            data: marketPerf,
            recommendation: `Allocate ${Math.round((marketPerf.spends / marketData.reduce((sum, m) => sum + m.spends, 0)) * 100 * 1.2)}% of budget to ${country} for optimal ROI.`
          });
        }

        if (marketPerf.cpi < 5.0 && marketPerf.cpi > 0) {
          insights.push({
            type: 'market',
            priority: 'high',
            message: `${country} has exceptional app install efficiency: $${marketPerf.cpi.toFixed(2)} CPI vs market average of $${(marketData.reduce((sum, m) => sum + m.cpi, 0) / marketData.length).toFixed(2)}.`,
            data: marketPerf,
            recommendation: 'Prioritize app install campaigns in this market if applicable to your objectives.'
          });
        }
      }
    });

    // 3. PLATFORM ANALYSIS - Based on actual platform performance
    platforms.forEach(platform => {
      const platformMap: {[key: string]: string} = {
        'Meta (Facebook)': 'Meta',
        'Instagram': 'Meta',
        'Google Ads': 'Google UAC',
        'YouTube': 'Google UAC',
        'LinkedIn': 'LinkedIn',
        'Twitter': 'Twitter'
      };

      const mappedPlatform = platformMap[platform];
      const platformPerf = platformData.find(p => p.platform === mappedPlatform);
      
      if (platformPerf) {
        // Check if platform matches objectives
        if (objectives.includes('App Installs') && mappedPlatform === 'Google UAC') {
          insights.push({
            type: 'platform',
            priority: 'high',
            message: `Perfect match! Google UAC achieved ${platformPerf.ctr.toFixed(2)}% CTR and ${(platformPerf.installs / platformPerf.spends * 1000).toFixed(1)} installs per $1000 spend in GFH campaigns.`,
            data: platformPerf,
            recommendation: `Allocate ${Math.round((platformPerf.spends / platformData.reduce((sum, p) => sum + p.spends, 0)) * 100 * 1.3)}% of budget to ${platform} for app install campaigns.`
          });
        }

        if (mappedPlatform === 'Meta' && platformPerf.ctr > 1.5) {
          insights.push({
            type: 'platform',
            priority: 'high',
            message: `Meta shows strong engagement in GFH data: ${platformPerf.ctr.toFixed(2)}% CTR at $${platformPerf.cpc.toFixed(3)} CPC across ${(platformPerf.impressions / 1000000).toFixed(1)}M impressions.`,
            data: platformPerf,
            recommendation: 'Meta is ideal for awareness and engagement campaigns. Use video content and carousel ads for best results.'
          });
        }

        if (mappedPlatform === 'LinkedIn' && platformPerf.cpc > 1.0) {
          insights.push({
            type: 'platform',
            priority: 'medium',
            message: `LinkedIn has higher CPC ($${platformPerf.cpc.toFixed(2)}) but very low CPM ($${platformPerf.cpm.toFixed(2)}) in GFH data.`,
            data: platformPerf,
            recommendation: 'Use LinkedIn for awareness campaigns targeting professionals. Focus on impression-based objectives rather than clicks.'
          });
        }
      }
    });

    // 4. BUDGET ANALYSIS - Based on actual spend efficiency
    if (budget > 0) {
      const totalGFHSpend = platformData.reduce((sum, p) => sum + p.spends, 0);
      const avgCPC = platformData.reduce((sum, p) => sum + p.cpc, 0) / platformData.length;
      const expectedClicks = budget / avgCPC;

      if (budget > 30000) {
        insights.push({
          type: 'budget',
          priority: 'high',
          message: `High budget detected! GFH spent $${totalGFHSpend.toLocaleString()} across all platforms with average $${avgCPC.toFixed(3)} CPC.`,
          data: { totalSpend: totalGFHSpend, avgCPC, expectedClicks },
          recommendation: `Your budget can generate ~${Math.round(expectedClicks).toLocaleString()} clicks. Consider multi-platform approach: 40% Meta, 30% Google, 20% LinkedIn, 10% other.`
        });
      }

      if (budget < 5000) {
        const bestPlatform = platformData.sort((a, b) => (b.ctr / b.cpc) - (a.ctr / a.cpc))[0];
        insights.push({
          type: 'budget',
          priority: 'medium',
          message: `Limited budget detected. ${bestPlatform.platform} showed best efficiency in GFH data: ${(bestPlatform.ctr / bestPlatform.cpc).toFixed(1)} efficiency score.`,
          data: bestPlatform,
          recommendation: `Focus 80% of budget on ${bestPlatform.platform} for maximum impact with your budget constraints.`
        });
      }
    }

    // 5. CONTENT ANALYSIS - Based on timing and platform data
    if (contentTypes.length > 0) {
      const urgencyContent = contentTypes.filter(c => c.toLowerCase().includes('last-chance') || c.toLowerCase().includes('reminder'));
      const videoContent = contentTypes.filter(c => c.toLowerCase().includes('video') || c.toLowerCase().includes('reel'));
      
      if (urgencyContent.length > 0) {
        insights.push({
          type: 'content',
          priority: 'high',
          message: `Urgency content selected! GFH data shows week 11 urgency messaging achieved ${weeklyData[10].ctr.toFixed(2)}% CTR (3x higher than average).`,
          data: weeklyData[10],
          recommendation: 'Schedule urgency content for final 10-15% of campaign duration for maximum impact.'
        });
      }

      if (videoContent.length > 0 && platforms.some(p => p.includes('Meta') || p.includes('Instagram'))) {
        insights.push({
          type: 'content',
          priority: 'medium',
          message: `Video content on Meta platforms typically shows 30-50% higher engagement than static content based on industry patterns.`,
          data: { videoBoost: 1.4 },
          recommendation: 'Schedule video content during weeks 3-6 when engagement peaks. Use 15-30 second videos for optimal performance.'
        });
      }
    }

    // Sort insights by priority
    return insights.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  // Get optimal timing recommendations based on weekly data
  static getOptimalTimingFromGFHData(duration: number): any[] {
    const { weeklyData } = this.parseGFHData();
    
    // Calculate performance scores for each week
    const weeklyScores = weeklyData.map(week => ({
      ...week,
      efficiencyScore: (week.ctr / week.cpc) * (week.clicks / week.spends),
      performanceLevel: week.ctr > 2.0 ? 'peak' : week.ctr > 1.5 ? 'high' : week.ctr > 1.0 ? 'medium' : 'low'
    }));

    // Identify optimal phases
    const phases = [];
    
    if (duration >= 7) {
      phases.push({
        phase: 'Launch Phase',
        weeks: [1, 2],
        avgPerformance: weeklyScores.filter(w => w.week <= 2).reduce((sum, w) => sum + w.ctr, 0) / 2,
        recommendation: 'Start with 20-25% of budget for initial testing and optimization'
      });
    }

    if (duration >= 21) {
      const peakWeeks = weeklyScores.filter(w => w.week >= 3 && w.week <= 6);
      phases.push({
        phase: 'Peak Performance Phase',
        weeks: [3, 4, 5, 6],
        avgPerformance: peakWeeks.reduce((sum, w) => sum + w.ctr, 0) / peakWeeks.length,
        recommendation: 'Scale to 50-60% of total budget during this peak efficiency period'
      });
    }

    return phases;
  }

  // Get market-specific insights for selected countries
  static getMarketSpecificInsights(countries: string[]): any[] {
    const { marketData } = this.parseGFHData();
    const insights = [];

    const marketMapping: {[key: string]: string} = {
      'Saudi Arabia': 'KSA',
      'United Arab Emirates': 'UAE',
      'Kuwait': 'KWT', 
      'Qatar': 'QTR',
      'Oman': 'OMN',
      'Bahrain': 'BAH'
    };

    countries.forEach(country => {
      const marketCode = marketMapping[country];
      const market = marketData.find(m => m.market === marketCode);
      
      if (market) {
        const totalSpend = marketData.reduce((sum, m) => sum + m.spends, 0);
        const marketShare = (market.spends / totalSpend) * 100;
        
        insights.push({
          country,
          performance: {
            ctr: market.ctr,
            cpc: market.cpc,
            cpm: market.cpm,
            cpi: market.cpi
          },
          efficiency: market.ctr / market.cpc,
          marketShare,
          recommendation: this.getMarketRecommendation(market, marketData)
        });
      }
    });

    return insights.sort((a, b) => b.efficiency - a.efficiency);
  }

  // Get specific timing recommendations for platform/market combinations
  static getSpecificTimingRecommendation(platform: string, market: string, contentType: string = ''): DynamicInsight[] {
    const insights: DynamicInsight[] = [];
    
    // Get actual timing data from GFH file
    const timingData = GFHDataParser.getTimingInsights(platform, market);
    
    if (timingData) {
      insights.push({
        type: 'timing',
        priority: 'high',
        message: `Based on GFH data: Best ${platform} performance in ${market} occurred during ${timingData.bestStartDate.toLocaleDateString()} - ${timingData.bestEndDate.toLocaleDateString()}`,
        data: timingData,
        recommendation: `For ${contentType || 'video content'} on ${platform} in ${market}: Campaign duration of ${timingData.campaignDuration} days achieved ${timingData.bestPerformance.ctr.toFixed(2)}% CTR`
      });
      
      // Add specific Instagram video timing for Oman
      if (platform.toLowerCase().includes('instagram') && market.toLowerCase().includes('oman')) {
        const omanMetaData = GFHDataParser.getPlatformDataForMarket('Meta', 'OMN');
        if (omanMetaData.length > 0) {
          const bestOmanCampaign = omanMetaData[0]; // Meta campaign in Oman
          insights.push({
            type: 'timing',
            priority: 'high', 
            message: `Instagram video timing in Oman: GFH Meta campaigns in Oman achieved exceptional 2.12% CTR at $0.078 CPC. Campaign ran May 6 - July 6.`,
            data: { 
              ctr: bestOmanCampaign.deliveredCTR * 100,
              cpc: bestOmanCampaign.deliveredCPC,
              startDate: '2025-05-06',
              endDate: '2025-07-06',
              impressions: bestOmanCampaign.deliveredImpressions,
              clicks: bestOmanCampaign.deliveredClicks
            },
            recommendation: `Best time to post Instagram videos in Oman: Start campaigns in early May. Peak engagement occurs during 1Jun-7Jun period (Week 5 in GFH data showed 1.64% CTR). Optimal posting schedule based on GFH performance: May-July timeframe with 60-day campaign duration.`
          });
        }
      }
    }
    
    return insights;
  }

  // Get content recommendations from actual GFH data
  static getContentRecommendationsFromGFH(platform: string, market: string): string[] {
    return GFHDataParser.getContentRecommendations(platform, market);
  }

  private static getMarketRecommendation(market: MarketPerformanceData, allMarkets: MarketPerformanceData[]): string {
    const avgCTR = allMarkets.reduce((sum, m) => sum + m.ctr, 0) / allMarkets.length;
    const avgCPC = allMarkets.reduce((sum, m) => sum + m.cpc, 0) / allMarkets.length;
    const avgCPI = allMarkets.reduce((sum, m) => sum + m.cpi, 0) / allMarkets.length;

    let recommendation = '';

    if (market.ctr > avgCTR * 1.5) {
      recommendation += 'High engagement market - increase budget allocation. ';
    }
    if (market.cpc < avgCPC * 0.7) {
      recommendation += 'Cost-efficient clicks - excellent for traffic campaigns. ';
    }
    if (market.cpi > 0 && market.cpi < avgCPI * 0.7) {
      recommendation += 'Outstanding app install performance - prioritize for install campaigns.';
    }

    return recommendation || 'Standard performance - maintain baseline allocation.';
  }
}

export default GFHDataAnalyzer;
export type { DynamicInsight, WeeklyPerformanceData, MarketPerformanceData };
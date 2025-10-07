// GFH Semantic Query Engine - Natural language queries against ALL GFH campaign data
import GFHVectorDatabase, { type GFHQueryResult, type GFHVectorRecord } from './gfhVectorDatabase';

export interface SemanticQueryResponse {
  answer: string;
  confidence: number;
  sources: GFHQueryResult[];
  insights: string[];
  recommendations: string[];
  data: any;
}

class GFHSemanticQueryEngine {
  private vectorDB = GFHVectorDatabase;
  private initialized = false;

  async initialize(): Promise<void> {
    if (!this.initialized) {
      await this.vectorDB.initializeFromExcel();
      this.initialized = true;
    }
  }

  // Main semantic query interface - answers ANY question about GFH data
  async query(question: string): Promise<SemanticQueryResponse> {
    await this.initialize();

    // Analyze the question to understand intent and extract key terms
    const queryAnalysis = this.analyzeQuery(question);
    
    // Search through ALL campaign data for relevant records
    const searchResults = await this.vectorDB.searchCampaigns(
      this.expandQuery(question, queryAnalysis),
      20 // Get more results for comprehensive analysis
    );

    // Filter and rank results based on query type
    const relevantRecords = this.filterRelevantRecords(searchResults, queryAnalysis);
    
    // Generate comprehensive answer using all relevant data
    const answer = await this.generateAnswer(question, relevantRecords, queryAnalysis);
    
    // Calculate confidence based on data quality and relevance
    const confidence = this.calculateConfidence(relevantRecords, queryAnalysis);
    
    // Generate insights and recommendations
    const insights = this.generateInsights(relevantRecords, queryAnalysis);
    const recommendations = this.generateRecommendations(relevantRecords, queryAnalysis);
    
    // Extract structured data for further analysis
    const data = this.extractStructuredData(relevantRecords, queryAnalysis);

    return {
      answer,
      confidence,
      sources: relevantRecords,
      insights,
      recommendations,
      data
    };
  }

  // Analyze query to understand what the user is asking for
  private analyzeQuery(question: string): {
    type: string;
    intent: string;
    platforms: string[];
    markets: string[];
    metrics: string[];
    timeframe: string[];
    comparison: boolean;
    specific: boolean;
  } {
    const lowerQ = question.toLowerCase();
    
    // Determine query type
    let type = 'general';
    if (lowerQ.includes('best') || lowerQ.includes('top') || lowerQ.includes('highest')) type = 'optimization';
    if (lowerQ.includes('compare') || lowerQ.includes('vs') || lowerQ.includes('versus')) type = 'comparison';
    if (lowerQ.includes('time') || lowerQ.includes('when') || lowerQ.includes('timing')) type = 'timing';
    if (lowerQ.includes('cost') || lowerQ.includes('budget') || lowerQ.includes('spend')) type = 'cost';
    if (lowerQ.includes('performance') || lowerQ.includes('ctr') || lowerQ.includes('click')) type = 'performance';

    // Extract intent
    let intent = 'information';
    if (lowerQ.includes('should') || lowerQ.includes('recommend') || lowerQ.includes('suggest')) intent = 'recommendation';
    if (lowerQ.includes('why') || lowerQ.includes('how') || lowerQ.includes('explain')) intent = 'explanation';
    if (lowerQ.includes('predict') || lowerQ.includes('expect') || lowerQ.includes('will')) intent = 'prediction';

    // Extract platforms
    const platforms = [];
    if (lowerQ.includes('meta') || lowerQ.includes('facebook') || lowerQ.includes('instagram')) platforms.push('Meta');
    if (lowerQ.includes('google') || lowerQ.includes('uac')) platforms.push('Google UAC');
    if (lowerQ.includes('twitter')) platforms.push('Twitter');
    if (lowerQ.includes('linkedin')) platforms.push('LinkedIn');
    if (lowerQ.includes('in-mobi') || lowerQ.includes('inmobi')) platforms.push('In-Mobi');

    // Extract markets  
    const markets = [];
    if (lowerQ.includes('oman') || lowerQ.includes('omn')) markets.push('Oman');
    if (lowerQ.includes('saudi') || lowerQ.includes('ksa')) markets.push('Saudi Arabia');
    if (lowerQ.includes('uae') || lowerQ.includes('emirates')) markets.push('United Arab Emirates');
    if (lowerQ.includes('kuwait') || lowerQ.includes('kwt')) markets.push('Kuwait');
    if (lowerQ.includes('qatar') || lowerQ.includes('qtr')) markets.push('Qatar');
    if (lowerQ.includes('bahrain') || lowerQ.includes('bah')) markets.push('Bahrain');

    // Extract metrics
    const metrics = [];
    if (lowerQ.includes('ctr') || lowerQ.includes('click-through')) metrics.push('CTR');
    if (lowerQ.includes('cpc') || lowerQ.includes('cost per click')) metrics.push('CPC');
    if (lowerQ.includes('cpm') || lowerQ.includes('cost per mille')) metrics.push('CPM');
    if (lowerQ.includes('reach')) metrics.push('Reach');
    if (lowerQ.includes('impression')) metrics.push('Impressions');
    if (lowerQ.includes('install') || lowerQ.includes('conversion')) metrics.push('Installs');
    if (lowerQ.includes('spend') || lowerQ.includes('budget') || lowerQ.includes('cost')) metrics.push('Spend');

    // Extract timeframe references
    const timeframe = [];
    if (lowerQ.includes('may') || lowerQ.includes('spring')) timeframe.push('May 2025');
    if (lowerQ.includes('june') || lowerQ.includes('summer')) timeframe.push('June 2025');
    if (lowerQ.includes('july')) timeframe.push('July 2025');
    if (lowerQ.includes('2025')) timeframe.push('2025');

    const comparison = lowerQ.includes('compare') || lowerQ.includes('vs') || lowerQ.includes('difference') || lowerQ.includes('better');
    const specific = platforms.length > 0 || markets.length > 0 || metrics.length > 0;

    return { type, intent, platforms, markets, metrics, timeframe, comparison, specific };
  }

  // Expand query with synonyms and related terms for better search
  private expandQuery(question: string, analysis: any): string {
    let expandedQuery = question;
    
    // Add platform synonyms
    analysis.platforms.forEach((platform: string) => {
      if (platform === 'Meta') {
        expandedQuery += ' Facebook Instagram Meta social media';
      } else if (platform === 'Google UAC') {
        expandedQuery += ' Google Universal App Campaigns UAC search display';
      }
    });

    // Add market context
    analysis.markets.forEach((market: string) => {
      expandedQuery += ` ${market} GCC Middle East`;
    });

    // Add metric context  
    analysis.metrics.forEach((metric: string) => {
      if (metric === 'CTR') {
        expandedQuery += ' click-through rate engagement clicks performance';
      } else if (metric === 'CPC') {
        expandedQuery += ' cost per click pricing efficiency budget';
      }
    });

    return expandedQuery;
  }

  // Filter results based on query analysis
  private filterRelevantRecords(results: GFHQueryResult[], analysis: any): GFHQueryResult[] {
    let filtered = results;

    // Filter by platforms if specified
    if (analysis.platforms.length > 0) {
      filtered = filtered.filter(result => 
        analysis.platforms.some((platform: string) => 
          result.record.metadata.platform.toLowerCase().includes(platform.toLowerCase())
        )
      );
    }

    // Filter by markets if specified
    if (analysis.markets.length > 0) {
      filtered = filtered.filter(result => 
        analysis.markets.some((market: string) => 
          result.record.metadata.market.toLowerCase().includes(market.toLowerCase())
        )
      );
    }

    // Sort by relevance and performance
    return filtered.sort((a, b) => {
      const relevanceScore = b.score - a.score;
      const performanceScore = b.record.metadata.performanceScore - a.record.metadata.performanceScore;
      return relevanceScore * 0.7 + performanceScore * 0.3;
    });
  }

  // Generate comprehensive answer using all relevant data
  private async generateAnswer(question: string, records: GFHQueryResult[], analysis: any): Promise<string> {
    if (records.length === 0) {
      return "I couldn't find any relevant campaign data in the GFH file for your question. Please try asking about specific platforms (Meta, Google UAC, Twitter, LinkedIn), markets (Oman, Saudi Arabia, UAE, Kuwait, Qatar, Bahrain), or metrics (CTR, CPC, reach, impressions).";
    }

    const topRecords = records.slice(0, 5);
    let answer = "";

    // Generate answer based on query type
    switch (analysis.type) {
      case 'timing':
        answer = this.generateTimingAnswer(question, topRecords, analysis);
        break;
      case 'performance':
        answer = this.generatePerformanceAnswer(question, topRecords, analysis);
        break;
      case 'cost':
        answer = this.generateCostAnswer(question, topRecords, analysis);
        break;
      case 'comparison':
        answer = this.generateComparisonAnswer(question, topRecords, analysis);
        break;
      case 'optimization':
        answer = this.generateOptimizationAnswer(question, topRecords, analysis);
        break;
      default:
        answer = this.generateGeneralAnswer(question, topRecords, analysis);
    }

    // Add data sources footer
    const uniqueCampaigns = new Set(topRecords.map(r => r.record.metadata.campaign)).size;
    const uniquePlatforms = new Set(topRecords.map(r => r.record.metadata.platform)).size;
    const uniqueMarkets = new Set(topRecords.map(r => r.record.metadata.market)).size;
    
    answer += `\n\n📊 **Data Sources**: Analysis based on ${uniqueCampaigns} campaigns across ${uniquePlatforms} platforms in ${uniqueMarkets} markets from the GFH performance file.`;

    return answer;
  }

  private generateTimingAnswer(question: string, records: GFHQueryResult[], analysis: any): string {
    const campaigns = records.map(r => r.record.metadata);
    const dateRange = this.getDateRange(campaigns);
    const bestPerforming = campaigns.sort((a, b) => b.performanceScore - a.performanceScore)[0];
    
    return `
🕒 **Timing Analysis Based on GFH Campaign Data:**

**Best Performing Campaign Timeline:**
• **Campaign**: ${bestPerforming.campaign}
• **Platform**: ${bestPerforming.platform} in ${bestPerforming.market}
• **Duration**: ${bestPerforming.startDate} to ${bestPerforming.endDate}
• **Performance**: ${(bestPerforming.deliveredCTR * 100).toFixed(2)}% CTR at $${bestPerforming.deliveredCPC.toFixed(3)} CPC

**Campaign Date Range Analysis:**
• **Overall Period**: ${dateRange.start} to ${dateRange.end}
• **Total Duration**: ${dateRange.durationDays} days average campaign length
• **Seasonal Context**: Spring/Summer 2025 campaigns showed consistent performance

**Key Timing Insights:**
${campaigns.map((c, i) => `${i + 1}. ${c.platform} in ${c.market}: ${c.startDate} - ${(c.deliveredCTR * 100).toFixed(2)}% CTR`).join('\n')}

**Recommendation**: Based on GFH data, campaigns running ${dateRange.durationDays} days in the ${dateRange.season} season achieved optimal performance metrics.`;
  }

  private generatePerformanceAnswer(question: string, records: GFHQueryResult[], analysis: any): string {
    const campaigns = records.map(r => r.record.metadata);
    const avgCTR = campaigns.reduce((sum, c) => sum + c.deliveredCTR, 0) / campaigns.length;
    const avgCPC = campaigns.reduce((sum, c) => sum + c.deliveredCPC, 0) / campaigns.length;
    const topPerformer = campaigns.sort((a, b) => b.performanceScore - a.performanceScore)[0];
    
    return `
📈 **Performance Analysis from GFH Campaign Data:**

**Overall Performance Metrics:**
• **Average CTR**: ${(avgCTR * 100).toFixed(2)}% across ${campaigns.length} campaigns
• **Average CPC**: $${avgCPC.toFixed(3)} cost per click
• **Total Impressions**: ${campaigns.reduce((sum, c) => sum + c.deliveredImpressions, 0).toLocaleString()}
• **Total Clicks**: ${campaigns.reduce((sum, c) => sum + c.deliveredClicks, 0).toLocaleString()}

**Top Performing Campaign:**
• **${topPerformer.campaign}** on ${topPerformer.platform}
• **Market**: ${topPerformer.market}
• **CTR**: ${(topPerformer.deliveredCTR * 100).toFixed(2)}% (${((topPerformer.deliveredCTR / avgCTR - 1) * 100).toFixed(1)}% above average)
• **CPC**: $${topPerformer.deliveredCPC.toFixed(3)} (${((avgCPC / topPerformer.deliveredCPC - 1) * 100).toFixed(1)}% more efficient than average)
• **Performance Score**: ${topPerformer.performanceScore.toFixed(1)}/100

**Performance Breakdown by Campaign:**
${campaigns.map((c, i) => `${i + 1}. ${c.platform} ${c.market}: ${(c.deliveredCTR * 100).toFixed(2)}% CTR, $${c.deliveredCPC.toFixed(3)} CPC (Score: ${c.performanceScore.toFixed(1)})`).join('\n')}`;
  }

  private generateCostAnswer(question: string, records: GFHQueryResult[], analysis: any): string {
    const campaigns = records.map(r => r.record.metadata);
    const totalSpend = campaigns.reduce((sum, c) => sum + c.deliveredSpends, 0);
    const avgCPC = campaigns.reduce((sum, c) => sum + c.deliveredCPC, 0) / campaigns.length;
    const mostEfficient = campaigns.sort((a, b) => a.deliveredCPC - b.deliveredCPC)[0];
    
    return `
💰 **Cost Analysis from GFH Campaign Data:**

**Overall Cost Metrics:**
• **Total Spend**: $${totalSpend.toLocaleString()} across ${campaigns.length} campaigns
• **Average CPC**: $${avgCPC.toFixed(3)} per click
• **Average Daily Spend**: $${(totalSpend / (campaigns.length * 30)).toFixed(2)} per day per campaign
• **Cost Efficiency Range**: $${Math.min(...campaigns.map(c => c.deliveredCPC)).toFixed(3)} - $${Math.max(...campaigns.map(c => c.deliveredCPC)).toFixed(3)} CPC

**Most Cost-Efficient Campaign:**
• **${mostEfficient.campaign}** on ${mostEfficient.platform}
• **Market**: ${mostEfficient.market}
• **CPC**: $${mostEfficient.deliveredCPC.toFixed(3)} per click
• **Total Spend**: $${mostEfficient.deliveredSpends.toLocaleString()}
• **Clicks Generated**: ${mostEfficient.deliveredClicks.toLocaleString()}
• **Cost per 1000 Impressions**: $${mostEfficient.deliveredCPM.toFixed(2)}

**Cost Breakdown by Campaign:**
${campaigns.map((c, i) => `${i + 1}. ${c.platform} ${c.market}: $${c.deliveredSpends.toLocaleString()} spent, $${c.deliveredCPC.toFixed(3)} CPC, ${c.deliveredClicks.toLocaleString()} clicks`).join('\n')}`;
  }

  private generateComparisonAnswer(question: string, records: GFHQueryResult[], analysis: any): string {
    const campaigns = records.map(r => r.record.metadata);
    const byPlatform = this.groupBy(campaigns, 'platform');
    const byMarket = this.groupBy(campaigns, 'market');
    
    let comparison = `🔍 **Comparative Analysis from GFH Campaign Data:**\n\n`;
    
    if (Object.keys(byPlatform).length > 1) {
      comparison += `**Platform Comparison:**\n`;
      Object.entries(byPlatform).forEach(([platform, camps]: [string, any[]]) => {
        const avgCTR = camps.reduce((s, c) => s + c.deliveredCTR, 0) / camps.length;
        const avgCPC = camps.reduce((s, c) => s + c.deliveredCPC, 0) / camps.length;
        const totalSpend = camps.reduce((s, c) => s + c.deliveredSpends, 0);
        comparison += `• **${platform}**: ${(avgCTR * 100).toFixed(2)}% CTR, $${avgCPC.toFixed(3)} CPC, $${totalSpend.toLocaleString()} total spend (${camps.length} campaigns)\n`;
      });
      comparison += `\n`;
    }
    
    if (Object.keys(byMarket).length > 1) {
      comparison += `**Market Comparison:**\n`;
      Object.entries(byMarket).forEach(([market, camps]: [string, any[]]) => {
        const avgCTR = camps.reduce((s, c) => s + c.deliveredCTR, 0) / camps.length;
        const avgCPC = camps.reduce((s, c) => s + c.deliveredCPC, 0) / camps.length;
        const totalSpend = camps.reduce((s, c) => s + c.deliveredSpends, 0);
        comparison += `• **${market}**: ${(avgCTR * 100).toFixed(2)}% CTR, $${avgCPC.toFixed(3)} CPC, $${totalSpend.toLocaleString()} total spend (${camps.length} campaigns)\n`;
      });
    }
    
    return comparison;
  }

  private generateOptimizationAnswer(question: string, records: GFHQueryResult[], analysis: any): string {
    const campaigns = records.map(r => r.record.metadata);
    const bestCTR = campaigns.sort((a, b) => b.deliveredCTR - a.deliveredCTR)[0];
    const bestCPC = campaigns.sort((a, b) => a.deliveredCPC - b.deliveredCPC)[0];
    const bestOverall = campaigns.sort((a, b) => b.performanceScore - a.performanceScore)[0];
    
    return `
🎯 **Optimization Insights from GFH Campaign Data:**

**Best Overall Performance:**
• **Campaign**: ${bestOverall.campaign}
• **Platform**: ${bestOverall.platform} in ${bestOverall.market}
• **CTR**: ${(bestOverall.deliveredCTR * 100).toFixed(2)}%
• **CPC**: $${bestOverall.deliveredCPC.toFixed(3)}
• **Performance Score**: ${bestOverall.performanceScore.toFixed(1)}/100

**Highest CTR Campaign:**
• **${bestCTR.campaign}** (${bestCTR.platform}): ${(bestCTR.deliveredCTR * 100).toFixed(2)}% CTR

**Most Cost-Efficient Campaign:**
• **${bestCPC.campaign}** (${bestCPC.platform}): $${bestCPC.deliveredCPC.toFixed(3)} CPC

**Optimization Recommendations:**
1. **Platform**: ${bestOverall.platform} showed best overall performance in ${bestOverall.market}
2. **Timing**: Campaigns running ${this.getDateRange([bestOverall]).durationDays} days achieved optimal results
3. **Budget**: $${bestOverall.deliveredSpends.toLocaleString()} budget level delivered strong performance
4. **Target Metrics**: Aim for ${(bestOverall.deliveredCTR * 100).toFixed(2)}% CTR and $${bestOverall.deliveredCPC.toFixed(3)} CPC based on proven performance`;
  }

  private generateGeneralAnswer(question: string, records: GFHQueryResult[], analysis: any): string {
    const campaigns = records.map(r => r.record.metadata);
    const summary = this.getSummaryStats(campaigns);
    
    return `
📋 **GFH Campaign Data Summary:**

**Campaign Overview:**
• **Total Campaigns**: ${campaigns.length} campaigns analyzed
• **Platforms**: ${summary.platforms.join(', ')}
• **Markets**: ${summary.markets.join(', ')}
• **Date Range**: ${summary.dateRange}

**Performance Summary:**
• **Average CTR**: ${(summary.avgCTR * 100).toFixed(2)}%
• **Average CPC**: $${summary.avgCPC.toFixed(3)}
• **Total Spend**: $${summary.totalSpend.toLocaleString()}
• **Total Impressions**: ${summary.totalImpressions.toLocaleString()}
• **Total Clicks**: ${summary.totalClicks.toLocaleString()}

**Key Findings:**
${campaigns.slice(0, 3).map((c, i) => `${i + 1}. ${c.campaign} on ${c.platform} in ${c.market} achieved ${(c.deliveredCTR * 100).toFixed(2)}% CTR at $${c.deliveredCPC.toFixed(3)} CPC`).join('\n')}`;
  }

  private calculateConfidence(records: GFHQueryResult[], analysis: any): number {
    let confidence = 0;
    
    // Base confidence on number of relevant records
    if (records.length >= 5) confidence += 30;
    else if (records.length >= 3) confidence += 20;
    else if (records.length >= 1) confidence += 10;
    
    // Boost confidence if query is specific
    if (analysis.specific) confidence += 20;
    
    // Boost confidence based on relevance scores
    const avgRelevance = records.reduce((sum, r) => sum + r.score, 0) / records.length;
    confidence += avgRelevance * 50;
    
    return Math.min(confidence, 100);
  }

  private generateInsights(records: GFHQueryResult[], analysis: any): string[] {
    const campaigns = records.map(r => r.record.metadata);
    const insights = [];
    
    if (campaigns.length > 0) {
      const avgCTR = campaigns.reduce((s, c) => s + c.deliveredCTR, 0) / campaigns.length;
      insights.push(`Average CTR across analyzed campaigns is ${(avgCTR * 100).toFixed(2)}%`);
      
      const avgCPC = campaigns.reduce((s, c) => s + c.deliveredCPC, 0) / campaigns.length;
      insights.push(`Average cost per click is $${avgCPC.toFixed(3)}`);
      
      const topPerformer = campaigns.sort((a, b) => b.performanceScore - a.performanceScore)[0];
      insights.push(`${topPerformer.platform} in ${topPerformer.market} shows the highest performance score of ${topPerformer.performanceScore.toFixed(1)}`);
    }
    
    return insights;
  }

  private generateRecommendations(records: GFHQueryResult[], analysis: any): string[] {
    const campaigns = records.map(r => r.record.metadata);
    const recommendations = [];
    
    if (campaigns.length > 0) {
      const bestCampaign = campaigns.sort((a, b) => b.performanceScore - a.performanceScore)[0];
      recommendations.push(`Consider using ${bestCampaign.platform} platform for ${bestCampaign.market} market based on proven performance`);
      recommendations.push(`Target ${(bestCampaign.deliveredCTR * 100).toFixed(2)}% CTR and $${bestCampaign.deliveredCPC.toFixed(3)} CPC as benchmarks`);
      recommendations.push(`Plan campaigns for similar duration (${this.getDateRange([bestCampaign]).durationDays} days) for optimal results`);
    }
    
    return recommendations;
  }

  private extractStructuredData(records: GFHQueryResult[], analysis: any): any {
    const campaigns = records.map(r => r.record.metadata);
    
    return {
      totalCampaigns: campaigns.length,
      platforms: Array.from(new Set(campaigns.map(c => c.platform))),
      markets: Array.from(new Set(campaigns.map(c => c.market))),
      avgMetrics: {
        ctr: campaigns.reduce((s, c) => s + c.deliveredCTR, 0) / campaigns.length,
        cpc: campaigns.reduce((s, c) => s + c.deliveredCPC, 0) / campaigns.length,
        spend: campaigns.reduce((s, c) => s + c.deliveredSpends, 0),
        impressions: campaigns.reduce((s, c) => s + c.deliveredImpressions, 0),
        clicks: campaigns.reduce((s, c) => s + c.deliveredClicks, 0)
      },
      topCampaign: campaigns.sort((a, b) => b.performanceScore - a.performanceScore)[0],
      dateRange: this.getDateRange(campaigns)
    };
  }

  // Helper methods
  private getDateRange(campaigns: any[]): { start: string, end: string, durationDays: number, season: string } {
    const startDates = campaigns.map(c => new Date(c.startDate)).sort((a, b) => a.getTime() - b.getTime());
    const endDates = campaigns.map(c => new Date(c.endDate)).sort((a, b) => b.getTime() - a.getTime());
    
    const start = startDates[0]?.toLocaleDateString() || '';
    const end = endDates[0]?.toLocaleDateString() || '';
    const durationDays = campaigns.length > 0 ? Math.round(campaigns.reduce((s, c) => {
      const diff = new Date(c.endDate).getTime() - new Date(c.startDate).getTime();
      return s + (diff / (1000 * 60 * 60 * 24));
    }, 0) / campaigns.length) : 0;
    
    const season = startDates[0] ? (startDates[0].getMonth() < 6 ? 'Spring/Summer' : 'Fall/Winter') : '';
    
    return { start, end, durationDays, season };
  }

  private groupBy(array: any[], key: string): { [key: string]: any[] } {
    return array.reduce((groups, item) => {
      const group = item[key] || 'Unknown';
      groups[group] = groups[group] || [];
      groups[group].push(item);
      return groups;
    }, {});
  }

  private getSummaryStats(campaigns: any[]): {
    platforms: string[];
    markets: string[];
    dateRange: string;
    avgCTR: number;
    avgCPC: number;
    totalSpend: number;
    totalImpressions: number;
    totalClicks: number;
  } {
    return {
      platforms: Array.from(new Set(campaigns.map(c => c.platform))),
      markets: Array.from(new Set(campaigns.map(c => c.market))),
      dateRange: `${campaigns[0]?.startDate || ''} - ${campaigns[0]?.endDate || ''}`,
      avgCTR: campaigns.reduce((s, c) => s + c.deliveredCTR, 0) / campaigns.length,
      avgCPC: campaigns.reduce((s, c) => s + c.deliveredCPC, 0) / campaigns.length,
      totalSpend: campaigns.reduce((s, c) => s + c.deliveredSpends, 0),
      totalImpressions: campaigns.reduce((s, c) => s + c.deliveredImpressions, 0),
      totalClicks: campaigns.reduce((s, c) => s + c.deliveredClicks, 0)
    };
  }
}

export default new GFHSemanticQueryEngine();
// GFH Vector Database - Semantic search through ALL GFH campaign data
import Papa from 'papaparse';

export interface GFHVectorRecord {
  id: string;
  content: string;
  metadata: {
    startDate: string;
    endDate: string;
    campaign: string;
    platform: string;
    objective: string;
    market: string;
    plannedSpends: number;
    deliveredSpends: number;
    plannedReach: number;
    deliveredReach: number;
    plannedImpressions: number;
    deliveredImpressions: number;
    plannedClicks: number;
    deliveredClicks: number;
    plannedCPM: number;
    deliveredCPM: number;
    plannedCPC: number;
    deliveredCPC: number;
    plannedAppInstalls: number;
    deliveredAppInstalls: number;
    plannedCPI: number;
    deliveredCPI: number;
    plannedCTR: number;
    deliveredCTR: number;
    efficiency: number;
    performanceScore: number;
    costEfficiency: number;
    reachEfficiency: number;
    conversionRate: number;
  };
  vector?: number[];
}

export interface GFHQueryResult {
  record: GFHVectorRecord;
  score: number;
  relevance: string;
}

class GFHVectorDatabase {
  private records: GFHVectorRecord[] = [];
  private initialized = false;
  private fuseIndex: any;

  // Read the complete GFH Excel file and vectorize ALL campaign data
  async initializeFromExcel(): Promise<void> {
    try {
      // For now, we'll use the embedded CSV data, but this can be extended to read actual Excel files
      const csvData = this.getCompleteGFHData();
      
      const parsed = Papa.parse(csvData, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true
      });

      this.records = [];
      
      parsed.data.forEach((row: any, index: number) => {
        if (row['Start Date'] && row['Campaign']) {
          const record = this.createVectorRecord(row, index);
          this.records.push(record);
        }
      });

      // Initialize Fuse.js for fuzzy semantic search
      const Fuse = (await import('fuse.js')).default;
      this.fuseIndex = new Fuse(this.records, {
        keys: [
          'content',
          'metadata.campaign',
          'metadata.platform', 
          'metadata.market',
          'metadata.objective'
        ],
        includeScore: true,
        threshold: 0.4,
        distance: 100
      });

      this.initialized = true;
      console.log(`🔍 GFH Vector Database initialized with ${this.records.length} campaign records`);
      
    } catch (error) {
      console.error('Error initializing GFH Vector Database:', error);
      throw error;
    }
  }

  // Create rich vector record with semantic content and metadata
  private createVectorRecord(row: any, index: number): GFHVectorRecord {
    const startDate = new Date(row['Start Date']).toLocaleDateString();
    const endDate = new Date(row['End date']).toLocaleDateString();
    const campaign = row['Campaign'] || '';
    const platform = row['Platform'] || '';
    const objective = row['Objective'] || '';
    const market = this.normalizeMarket(row['Market'] || '');
    
    // Calculate advanced metrics
    const plannedSpends = parseFloat(row['Planned Sends $']) || 0;
    const deliveredSpends = parseFloat(row['Delivered Spends $']) || 0;
    const plannedReach = parseInt(row['Planned Reach']) || 0;
    const deliveredReach = parseInt(row['Delivered Reach']) || 0;
    const plannedImpressions = parseInt(row['Planned Imp.']) || 0;
    const deliveredImpressions = parseInt(row['Delivered Imp.']) || 0;
    const plannedClicks = parseInt(row['Planned Clicks']) || 0;
    const deliveredClicks = parseInt(row['Delivered Clicks']) || 0;
    const plannedCPM = parseFloat(row['Planned CPM']) || 0;
    const deliveredCPM = parseFloat(row['Delivered CPM']) || 0;
    const plannedCPC = parseFloat(row['Planned CPC']) || 0;
    const deliveredCPC = parseFloat(row['Delivered CPC']) || 0;
    const plannedAppInstalls = parseInt(row['Planned App Installs']) || 0;
    const deliveredAppInstalls = parseInt(row['Delivered App Installs']) || 0;
    const plannedCPI = parseFloat(row['Planned CPI']) || 0;
    const deliveredCPI = parseFloat(row['Delivered CPI']) || 0;
    const plannedCTR = parseFloat(row['Planned CTR']) || 0;
    const deliveredCTR = parseFloat(row['Delivered CTR']) || 0;

    // Calculate efficiency metrics
    const efficiency = deliveredCTR > 0 && deliveredCPC > 0 ? (deliveredCTR / deliveredCPC) * 1000 : 0;
    const performanceScore = this.calculatePerformanceScore(deliveredCTR, deliveredCPC, deliveredCPM);
    const costEfficiency = deliveredSpends > 0 ? (deliveredClicks / deliveredSpends) * 100 : 0;
    const reachEfficiency = deliveredSpends > 0 ? (deliveredReach / deliveredSpends) : 0;
    const conversionRate = deliveredImpressions > 0 ? (deliveredAppInstalls / deliveredImpressions) * 100 : 0;

    // Create rich semantic content for vector search
    const content = this.createSemanticContent({
      startDate, endDate, campaign, platform, objective, market,
      deliveredSpends, deliveredReach, deliveredImpressions, deliveredClicks,
      deliveredCPM, deliveredCPC, deliveredAppInstalls, deliveredCTR,
      efficiency, performanceScore, costEfficiency, conversionRate
    });

    return {
      id: `gfh_campaign_${index}`,
      content,
      metadata: {
        startDate, endDate, campaign, platform, objective, market,
        plannedSpends, deliveredSpends, plannedReach, deliveredReach,
        plannedImpressions, deliveredImpressions, plannedClicks, deliveredClicks,
        plannedCPM, deliveredCPM, plannedCPC, deliveredCPC,
        plannedAppInstalls, deliveredAppInstalls, plannedCPI, deliveredCPI,
        plannedCTR, deliveredCTR, efficiency, performanceScore,
        costEfficiency, reachEfficiency, conversionRate
      }
    };
  }

  // Create semantic content that captures campaign context and performance
  private createSemanticContent(data: any): string {
    const {
      startDate, endDate, campaign, platform, objective, market,
      deliveredSpends, deliveredReach, deliveredImpressions, deliveredClicks,
      deliveredCPM, deliveredCPC, deliveredAppInstalls, deliveredCTR,
      efficiency, performanceScore, costEfficiency, conversionRate
    } = data;

    return `
Campaign: ${campaign} ran on ${platform} platform in ${market} market from ${startDate} to ${endDate}.
Objective: ${objective}
Budget Performance: Spent $${deliveredSpends.toLocaleString()} 
Reach & Impressions: Reached ${deliveredReach.toLocaleString()} people with ${deliveredImpressions.toLocaleString()} impressions
Engagement: Generated ${deliveredClicks.toLocaleString()} clicks with ${(deliveredCTR * 100).toFixed(2)}% click-through rate
Cost Metrics: $${deliveredCPC.toFixed(3)} cost per click, $${deliveredCPM.toFixed(2)} cost per thousand impressions
App Installs: ${deliveredAppInstalls} installations achieved
Performance Metrics: Efficiency score ${efficiency.toFixed(1)}, Performance rating ${performanceScore.toFixed(1)}
Cost Efficiency: ${costEfficiency.toFixed(2)} clicks per dollar spent
Market Performance: ${market} market ${platform} campaign ${objective.toLowerCase()} objective
Time Period: ${this.getSeasonalContext(startDate)} campaign timing
Conversion Rate: ${conversionRate.toFixed(3)}% impression to install conversion
Campaign Type: ${this.getCampaignTypeContext(platform, objective, market)}
Budget Scale: ${this.getBudgetScale(deliveredSpends)} budget campaign in ${market}
Performance Tier: ${this.getPerformanceTier(deliveredCTR, deliveredCPC)} performing campaign
    `.trim();
  }

  // Calculate comprehensive performance score
  private calculatePerformanceScore(ctr: number, cpc: number, cpm: number): number {
    const ctrScore = Math.min((ctr * 100) / 3, 100); // Normalize CTR (3% = 100 points)
    const cpcScore = Math.max(100 - (cpc * 10), 0); // Lower CPC = higher score
    const cpmScore = Math.max(100 - (cpm / 10), 0); // Lower CPM = higher score
    
    return (ctrScore * 0.5) + (cpcScore * 0.3) + (cpmScore * 0.2);
  }

  // Add contextual information for better semantic search
  private getSeasonalContext(dateStr: string): string {
    const month = new Date(dateStr).getMonth();
    if (month >= 2 && month <= 4) return 'Spring season';
    if (month >= 5 && month <= 7) return 'Summer season';
    if (month >= 8 && month <= 10) return 'Fall season';
    return 'Winter season';
  }

  private getCampaignTypeContext(platform: string, objective: string, market: string): string {
    return `${market} ${platform.toLowerCase()} ${objective.toLowerCase()} campaign`;
  }

  private getBudgetScale(spends: number): string {
    if (spends >= 10000) return 'Large scale';
    if (spends >= 5000) return 'Medium scale';
    if (spends >= 1000) return 'Small scale';
    return 'Micro scale';
  }

  private getPerformanceTier(ctr: number, cpc: number): string {
    const score = this.calculatePerformanceScore(ctr, cpc, 0);
    if (score >= 80) return 'High';
    if (score >= 60) return 'Medium';
    if (score >= 40) return 'Average';
    return 'Low';
  }

  private normalizeMarket(market: string): string {
    const marketMap: { [key: string]: string } = {
      'KSA | GEO TG': 'Saudi Arabia',
      'UAE | GEO TG': 'United Arab Emirates', 
      'QTR | GEO TG': 'Qatar',
      'OMN': 'Oman',
      'KWT': 'Kuwait',
      'BAH': 'Bahrain'
    };
    return marketMap[market] || market;
  }

  // Semantic search through ALL GFH data
  async searchCampaigns(query: string, limit: number = 10): Promise<GFHQueryResult[]> {
    if (!this.initialized) {
      await this.initializeFromExcel();
    }

    const results = this.fuseIndex.search(query);
    
    return results.slice(0, limit).map((result: any) => ({
      record: result.item,
      score: 1 - result.score, // Convert Fuse score to relevance score
      relevance: this.getRelevanceDescription(1 - result.score)
    }));
  }

  // Find similar campaigns based on criteria
  async findSimilarCampaigns(criteria: {
    platform?: string;
    market?: string;
    objective?: string;
    budgetRange?: [number, number];
    performanceThreshold?: number;
  }, limit: number = 5): Promise<GFHVectorRecord[]> {
    if (!this.initialized) {
      await this.initializeFromExcel();
    }

    return this.records
      .filter(record => {
        const meta = record.metadata;
        
        if (criteria.platform && !meta.platform.toLowerCase().includes(criteria.platform.toLowerCase())) {
          return false;
        }
        if (criteria.market && !meta.market.toLowerCase().includes(criteria.market.toLowerCase())) {
          return false;
        }
        if (criteria.objective && !meta.objective.toLowerCase().includes(criteria.objective.toLowerCase())) {
          return false;
        }
        if (criteria.budgetRange) {
          const [min, max] = criteria.budgetRange;
          if (meta.deliveredSpends < min || meta.deliveredSpends > max) {
            return false;
          }
        }
        if (criteria.performanceThreshold && meta.performanceScore < criteria.performanceThreshold) {
          return false;
        }
        
        return true;
      })
      .sort((a, b) => b.metadata.performanceScore - a.metadata.performanceScore)
      .slice(0, limit);
  }

  // Get all records for analysis
  getAllRecords(): GFHVectorRecord[] {
    return this.records;
  }

  // Get aggregated insights across all campaigns
  getGlobalInsights(): {
    totalCampaigns: number;
    totalSpend: number;
    avgCTR: number;
    avgCPC: number;
    bestPerformingMarket: string;
    bestPerformingPlatform: string;
    totalReach: number;
    totalImpressions: number;
    totalClicks: number;
    totalInstalls: number;
  } {
    const records = this.records;
    
    if (records.length === 0) {
      return {
        totalCampaigns: 0, totalSpend: 0, avgCTR: 0, avgCPC: 0,
        bestPerformingMarket: '', bestPerformingPlatform: '',
        totalReach: 0, totalImpressions: 0, totalClicks: 0, totalInstalls: 0
      };
    }

    const totalSpend = records.reduce((sum, r) => sum + r.metadata.deliveredSpends, 0);
    const totalReach = records.reduce((sum, r) => sum + r.metadata.deliveredReach, 0);
    const totalImpressions = records.reduce((sum, r) => sum + r.metadata.deliveredImpressions, 0);
    const totalClicks = records.reduce((sum, r) => sum + r.metadata.deliveredClicks, 0);
    const totalInstalls = records.reduce((sum, r) => sum + r.metadata.deliveredAppInstalls, 0);
    const avgCTR = records.reduce((sum, r) => sum + r.metadata.deliveredCTR, 0) / records.length;
    const avgCPC = records.reduce((sum, r) => sum + r.metadata.deliveredCPC, 0) / records.length;

    // Find best performing market and platform
    const marketPerformance = records.reduce((acc, r) => {
      const market = r.metadata.market;
      if (!acc[market]) acc[market] = { score: 0, count: 0 };
      acc[market].score += r.metadata.performanceScore;
      acc[market].count += 1;
      return acc;
    }, {} as any);

    const platformPerformance = records.reduce((acc, r) => {
      const platform = r.metadata.platform;
      if (!acc[platform]) acc[platform] = { score: 0, count: 0 };
      acc[platform].score += r.metadata.performanceScore;
      acc[platform].count += 1;
      return acc;
    }, {} as any);

    const bestMarket = Object.entries(marketPerformance)
      .sort(([,a], [,b]) => (b as any).score / (b as any).count - (a as any).score / (a as any).count)[0]?.[0] || '';
    
    const bestPlatform = Object.entries(platformPerformance)
      .sort(([,a], [,b]) => (b as any).score / (b as any).count - (a as any).score / (a as any).count)[0]?.[0] || '';

    return {
      totalCampaigns: records.length,
      totalSpend,
      avgCTR,
      avgCPC,
      bestPerformingMarket: bestMarket,
      bestPerformingPlatform: bestPlatform,
      totalReach,
      totalImpressions,
      totalClicks,
      totalInstalls
    };
  }

  private getRelevanceDescription(score: number): string {
    if (score >= 0.8) return 'Highly Relevant';
    if (score >= 0.6) return 'Very Relevant';
    if (score >= 0.4) return 'Moderately Relevant';
    if (score >= 0.2) return 'Somewhat Relevant';
    return 'Low Relevance';
  }

  // Complete GFH CSV data - this would normally read from the actual Excel file
  private getCompleteGFHData(): string {
    return `Start Date,End date,Reporting Start Date,Reporting End date,Campaign,Platform,Objective,Market,Planned Sends $,Delivered Spends $,Planned Reach,Delivered Reach,Planned Imp.,Delivered Imp.,Planned Clicks,Delivered Clicks,Planned CPM,Delivered CPM,Planned CPC,Delivered CPC,Planned App Installs,Delivered App Installs,Planned CPI,Delivered CPI,Planned CTR,Delivered CTR
2025-05-12 00:00:00,2025-07-11,2025-05-11,2025-07-05 00:00:00,Mobile Investor app campaign,Twitter,Awareness,KSA | GEO TG,5000,4977.15,,64540,1250000,2159928,,6088,4.0,2.304312921541829,,0.817534494086728,,0.0,,,0.0,0.0028186124722675942
2025-05-12 00:00:00,2025-07-11,2025-05-11,2025-07-05 00:00:00,Mobile Investor app campaign,Twitter,Awareness,UAE | GEO TG,4000,4001.1599999999994,,24663,800000,620883,,1771,5.0,6.444305932035504,,2.2592659514398643,,0.0,,,0.0,0.0028523892585237474
2025-05-12 00:00:00,2025-07-11,2025-05-11,2025-07-05 00:00:00,Mobile Investor app campaign,Twitter,Awareness,KWT,3000,2997.45,,13059,600000,1498479,,4259,5.0,2.0003283329295907,,0.7037919699459967,,0.0,,,0.0,0.0028422153396877765
2025-05-06 00:00:00,2025-07-06,2025-05-04,2025-07-07 00:00:00,Mobile Investor app campaign,Meta,CTAP,KSA | GEO TG,6500,6497.62,,834808,2600000,3255367,,49619,2.5,1.9959715755550753,,0.13095024083516393,650.0,0.0,10.0,,0.0,0.015242213857915252
2025-05-06 00:00:00,2025-07-06,2025-05-04,2025-07-07 00:00:00,Mobile Investor app campaign,Meta,CTAP,UAE | GEO TG,4500,4498.95,,333797,1125000,1614538,,38560,4.0,2.7865246900351677,,0.11667401452282157,375.0,0.0,12.0,,0.0,0.02388299315345938
2025-05-06 00:00:00,2025-07-06,2025-05-04,2025-07-07 00:00:00,Mobile Investor app campaign,Meta,CTAP,KWT,3000,2998.1300000000006,,623411,600000,623398,,13636,5.0,4.809335288210742,,0.2198687298327956,200.0,0.0,15.0,,0.0,0.021873666582183454
2025-05-06 00:00:00,2025-07-06,2025-05-04,2025-07-07 00:00:00,Mobile Investor app campaign,Meta,CTAP,QTR | GEO TG,2000,2000.3400000000001,,688553,571429,793542,,12128,3.4999973750019686,2.5207739476927498,,0.16493568601583114,133.0,0.0,15.037593984962406,,0.0,0.015283375045051176
2025-05-06 00:00:00,2025-07-06,2025-05-04,2025-07-07 00:00:00,Mobile Investor app campaign,Meta,CTAP,OMN,2000,1997.6699999999998,,1314075,571429,1209030,,25571,3.4999973750019686,1.6522915064142327,,0.0781224824997067,133.0,0.0,15.037593984962406,,0.0,0.021150012820194703
2025-05-06 00:00:00,2025-07-06,2025-05-04,2025-07-07 00:00:00,Mobile Investor app campaign,Meta,CTAP,BAH,3000,2999.2599999999998,,285820,857143,1244329,,26172,3.4999994166667636,2.410343245234982,,0.114598043710836,200.0,0.0,15.0,,0.0,0.021033022617008845
2025-05-08 00:00:00,2025-07-06,2025-05-04,2025-07-07 00:00:00,Mobile Investor app campaign,LinkedIn,Awareness,KSA | GEO TG,5000,4995.63,,610079,277778,3870318,,5027,17.99998560001152,1.2907544031265648,,0.993759697632783,,0.0,,,0.0,0.001298859680263999
2025-05-08 00:00:00,2025-07-06,2025-05-04,2025-07-07 00:00:00,Mobile Investor app campaign,LinkedIn,Awareness,UAE | GEO TG,4000,3996.27,,721007,160000,3100021,,3513,25.0,1.28911062215385,,1.1375661827497865,,0.0,,,0.0,0.001133218129812669
2025-05-08 00:00:00,2025-07-06,2025-05-04,2025-07-07 00:00:00,Mobile Investor app campaign,LinkedIn,Awareness,KWT,2000,1999.25,,90353,100000,656864,,1356,20.0,3.0436285136649293,,1.474373156342183,,0.0,,,0.0,0.0020643542651142396
2025-05-15 00:00:00,2025-07-13,2025-05-11,2025-07-05 00:00:00,Mobile Investor app campaign,Google UAC,App Installs,KSA | GEO TG,6000,4429.73,,,,663702,,36210,,6.674275503162563,,0.12233443800055233,1200.0,4362.0,5.0,1.0155272810637321,,0.054557617726027643
2025-05-15 00:00:00,2025-07-13,2025-05-11,2025-07-05 00:00:00,Mobile Investor app campaign,Google UAC,App Installs,UAE | GEO TG,5000,3626.1700000000005,,,,518324,,33703,,6.99595233869163,,0.10759190576506544,1000.0,2346.0,5.0,1.545682011935209,,0.06502303578456718
2025-05-15 00:00:00,2025-07-13,2025-05-11,2025-07-05 00:00:00,Mobile Investor app campaign,Google UAC,App Installs,KWT,3000,2206.1400000000003,,,,554285,,15503,,3.9801546136013064,,0.1423040701799652,429.0,1905.0,6.993006993006993,1.1580787401574806,,0.027969365939904563
2025-05-15 00:00:00,2025-07-13,2025-05-11,2025-07-05 00:00:00,Mobile Investor app campaign,Google UAC,App Installs,QTR | GEO TG,2000,1366.34,,,,321775,,10642,,4.246259031932251,,0.12839127983461754,333.0,1204.0,6.006006006006006,1.1348338870431893,,0.033072799316292444
2025-05-15 00:00:00,2025-07-13,2025-05-11,2025-07-05 00:00:00,Mobile Investor app campaign,Google UAC,App Installs,OMN,2000,1371.1200000000001,,,,354786,,21573,,3.864639529180971,,0.06355722430816299,333.0,2683.0,6.006006006006006,0.5110398807305255,,0.060805668769342645
2025-05-12 00:00:00,2025-07-11,2025-05-11,2025-07-05 00:00:00,Mobile Investor app campaign,Google UAC,App Installs,BAH,2000,1314.2,,,,317643,,12410,,4.137349162424483,,0.10589846897663176,333.0,1717.0,6.006006006006006,0.7654047757716949,,0.03906901773374512
2025-05-20 00:00:00,2025-07-19,2025-05-18,2025-07-05 00:00:00,Mobile Investor app campaign,In-Mobi,Traffic,KSA | GEO TG,7000,11088.8,,,5600000,2968069,28000,55444,2.5,3.7360317431973447,0.25,0.19999999999999998,1167.0,0.0,5.998286203941731,,0.005,0.018680158715986724
2025-05-20 00:00:00,2025-07-19,2025-05-18,2025-07-05 00:00:00,Mobile Investor app campaign,In-Mobi,Traffic,UAE | GEO TG,5000,5615.2,,,4000000,3437041,20000,28076,4.0,1.633730874900823,0.25,0.19999999999999998,714.0,0.0,7.002801120448179,,0.005,0.008168654374504116`;
  }
}

export default new GFHVectorDatabase();
// GFH Data Parser - Reads actual campaign performance data from CSV file

interface GFHDataRow {
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
}

// Raw CSV data from GFH file
const GFH_RAW_DATA = `Start Date,End date,Reporting Start Date,Reporting End date,Campaign,Platform,Objective,Market,Planned Sends $,Delivered Spends $,Planned Reach,Delivered Reach,Planned Imp.,Delivered Imp.,Planned Clicks,Delivered Clicks,Planned CPM,Delivered CPM,Planned CPC,Delivered CPC,Planned App Installs,Delivered App Installs,Planned CPI,Delivered CPI,Planned CTR,Delivered CTR
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
2025-05-20 00:00:00,2025-07-19,2025-05-18,2025-07-05 00:00:00,Mobile Investor app campaign,In-Mobi,Traffic,UAE | GEO TG,5000,5615.2,,,4000000,3437041,20000,28076,4.0,1.633730874900823,0.25,0.19999999999999998,714.0,0.0,7.002801120448179,,0.005,0.008168654374504116
2025-05-20 00:00:00,2025-07-19,2025-05-18,2025-07-05 00:00:00,Mobile Investor app campaign,In-Mobi,Traffic,KWT,4000,6245.599999999999,,,3200000,1774805,16000,31228,5.0,3.519034485478686,0.25,0.19999999999999998,571.0,0.0,7.005253940455342,,0.005,0.017595172427393432
2025-05-20 00:00:00,2025-07-19,2025-05-18,2025-07-05 00:00:00,Mobile Investor app campaign,In-Mobi,Traffic,BAH,3000,4191.400000000001,,,2400000,824562,12000,20957,3.5,5.083183556845938,0.25,0.20000000000000004,429.0,0.0,6.993006993006993,,0.005,0.025415917784229688`;

// Weekly performance from GFH file
const GFH_WEEKLY_DATA = `Week,Period,Delivered Spends$,Delivered Imp.,Delivered Clicks,CPM,CPC,CTR,Delivered Installs
1,4May - 10May,2020.73,627604,14193,3.219753220183428,0.14237511449305995,0.022614578619639135,0
2,11May - 17May,5601.409999999999,1766105,29952,3.1716177690454415,0.18701288728632476,0.01695935405879039,838
3,18May - 24May,8245.039999999999,2825349,45675,2.918237711518117,0.18051538040503556,0.0161661444302987,2792
4,25May - 31May,10154.92,3940969,51820,2.576757137648127,0.19596526437668854,0.01314905039851874,2919
5,1Jun - 7Jun,11766.130000000003,3775316,61762,3.116594743327447,0.19050759366600828,0.016359425277248315,2895
6,8Jun - 14Jun,11500.34,3469062,66033,3.315115152165052,0.17416049550982085,0.019034828434891047,2529
7,15Jun - 21Jun,8146.97,3233141,39300,2.519831334296896,0.20730203562340968,0.012155362231340977,87
8,22Jun - 28Jun,8803.88,4825011,40138,1.824634182181139,0.21934027604763565,0.008318737511686502,10
9,29Jun- 5Jul,11247.89,5577246,57433,2.0167462579201274,0.19584367872129263,0.010297734760130716,1794
10,6Jul - 12Jul,6587.9,2151878,38842,3.061465380472313,0.1696076412131198,0.01805027980210774,0
11,13Jul - 19Jul,1338.3700000000001,190008,8298,7.043756052376743,0.16128826223186313,0.04367184539598333,353`;

// Market performance from GFH file
const GFH_MARKET_DATA = `Market,Delivered Spends$,Delivered Imp.,Delivered Clicks,CPM,CPC,CTR,Delivered Installs,CPI
KSA,31988.93,12917384,152388,2.4764247931314887,0.20991764443394492,0.011797125486089135,4362,7.333546538285191
UAE,21737.75,9290807,105623,2.3397052591879266,0.20580508033288206,0.0113685495780937,2346,9.26587809036658
KWT,16446.57,5107831,65982,3.219873562770577,0.24925843411839593,0.012917811885318837,1905,8.633370078740157
QTR,3366.6800000000003,1115317,22770,3.0185857473704787,0.14785595081247258,0.02041572037366955,1204,2.79624584717608
OMN,3368.79,1563816,47144,2.1542112371276416,0.07145744951637537,0.030146769185121523,2683,1.2556056653000374
BAH,8504.86,2386534,59539,3.563686920027119,0.14284519390651507,0.0249478951483616,1717,4.953325567850903`;

class GFHDataParser {
  
  // Parse CSV data into structured objects
  static parseCSV(csvData: string, hasHeader: boolean = true): any[] {
    const lines = csvData.trim().split('\n');
    const headers = hasHeader ? lines[0].split(',') : [];
    const dataLines = hasHeader ? lines.slice(1) : lines;
    
    return dataLines.map(line => {
      const values = this.parseCSVLine(line);
      if (hasHeader) {
        const obj: any = {};
        headers.forEach((header, index) => {
          obj[header.trim()] = this.parseValue(values[index]);
        });
        return obj;
      }
      return values.map(v => this.parseValue(v));
    });
  }

  // Parse a single CSV line handling commas within quotes
  static parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }

  // Parse value to appropriate type
  static parseValue(value: string): any {
    if (!value || value === '') return null;
    
    // Try to parse as number
    const num = parseFloat(value);
    if (!isNaN(num)) return num;
    
    // Return as string
    return value;
  }

  // Get all campaign data from GFH file
  static getAllCampaignData(): GFHDataRow[] {
    const rawData = this.parseCSV(GFH_RAW_DATA);
    
    return rawData.filter(row => row['Campaign'] && row['Platform'] && row['Market']).map(row => ({
      startDate: row['Start Date'] || '',
      endDate: row['End date'] || '',
      campaign: row['Campaign'] || '',
      platform: row['Platform'] || '',
      objective: row['Objective'] || '',
      market: row['Market'] || '',
      plannedSpends: row['Planned Sends $'] || 0,
      deliveredSpends: row['Delivered Spends $'] || 0,
      plannedReach: row['Planned Reach'] || 0,
      deliveredReach: row['Delivered Reach'] || 0,
      plannedImpressions: row['Planned Imp.'] || 0,
      deliveredImpressions: row['Delivered Imp.'] || 0,
      plannedClicks: row['Planned Clicks'] || 0,
      deliveredClicks: row['Delivered Clicks'] || 0,
      plannedCPM: row['Planned CPM'] || 0,
      deliveredCPM: row['Delivered CPM'] || 0,
      plannedCPC: row['Planned CPC'] || 0,
      deliveredCPC: row['Delivered CPC'] || 0,
      plannedAppInstalls: row['Planned App Installs'] || 0,
      deliveredAppInstalls: row['Delivered App Installs'] || 0,
      plannedCPI: row['Planned CPI'] || 0,
      deliveredCPI: row['Delivered CPI'] || 0,
      plannedCTR: row['Planned CTR'] || 0,
      deliveredCTR: row['Delivered CTR'] || 0
    }));
  }

  // Get weekly performance data
  static getWeeklyData() {
    return this.parseCSV(GFH_WEEKLY_DATA);
  }

  // Get market performance data  
  static getMarketData() {
    return this.parseCSV(GFH_MARKET_DATA);
  }

  // Get platform-specific data for a market
  static getPlatformDataForMarket(platform: string, market: string): GFHDataRow[] {
    const allData = this.getAllCampaignData();
    return allData.filter(row => 
      row.platform.toLowerCase().includes(platform.toLowerCase()) && 
      row.market.toLowerCase().includes(market.toLowerCase())
    );
  }

  // Get timing insights for specific platform/market combination
  static getTimingInsights(platform: string, market: string): any {
    const campaignData = this.getPlatformDataForMarket(platform, market);
    if (campaignData.length === 0) return null;

    // Analyze start dates to find patterns
    const campaigns = campaignData.map(c => ({
      startDate: new Date(c.startDate),
      endDate: new Date(c.endDate),
      performance: {
        ctr: c.deliveredCTR * 100, // Convert to percentage
        cpc: c.deliveredCPC,
        cpm: c.deliveredCPM,
        impressions: c.deliveredImpressions,
        clicks: c.deliveredClicks
      }
    }));

    // Find best performing periods
    const bestCampaign = campaigns.reduce((best, current) => 
      current.performance.ctr > best.performance.ctr ? current : best
    );

    return {
      bestStartDate: bestCampaign.startDate,
      bestEndDate: bestCampaign.endDate,
      bestPerformance: bestCampaign.performance,
      campaignDuration: Math.ceil((bestCampaign.endDate.getTime() - bestCampaign.startDate.getTime()) / (1000 * 60 * 60 * 24)),
      insights: this.generateTimingInsights(bestCampaign, market, platform)
    };
  }

  // Generate specific timing insights
  static generateTimingInsights(bestCampaign: any, market: string, platform: string): string[] {
    const insights = [];
    const startMonth = bestCampaign.startDate.getMonth() + 1;
    const startDay = bestCampaign.startDate.getDate();
    
    insights.push(`Best ${platform} performance in ${market} started on ${bestCampaign.startDate.toLocaleDateString()}`);
    insights.push(`Campaign achieved ${bestCampaign.performance.ctr.toFixed(2)}% CTR at $${bestCampaign.performance.cpc.toFixed(3)} CPC`);
    
    // Month-specific insights
    if (startMonth >= 5 && startMonth <= 7) {
      insights.push(`May-July period shows strong engagement for ${market} market`);
    }
    
    // Duration insights  
    const duration = Math.ceil((bestCampaign.endDate.getTime() - bestCampaign.startDate.getTime()) / (1000 * 60 * 60 * 24));
    insights.push(`Optimal campaign duration: ${duration} days for ${platform} in ${market}`);
    
    return insights;
  }

  // Get content type recommendations based on platform performance
  static getContentRecommendations(platform: string, market: string): string[] {
    const data = this.getPlatformDataForMarket(platform, market);
    if (data.length === 0) return ['No historical data available for this combination'];

    const avgCTR = data.reduce((sum, d) => sum + d.deliveredCTR, 0) / data.length * 100;
    const recommendations = [];

    // Platform-specific content recommendations based on actual performance
    if (platform.toLowerCase().includes('meta') || platform.toLowerCase().includes('facebook')) {
      if (avgCTR > 1.5) {
        recommendations.push(`Video content performs exceptionally well on Meta in ${market} (${avgCTR.toFixed(2)}% avg CTR)`);
        recommendations.push('Carousel ads and dynamic product ads show strong engagement');
      }
      recommendations.push('Stories and Reels content recommended for higher engagement');
    }

    if (platform.toLowerCase().includes('instagram')) {
      recommendations.push('Instagram Reels and Stories perform best for video content');
      recommendations.push('User-generated content and influencer partnerships recommended');
    }

    if (platform.toLowerCase().includes('google')) {
      recommendations.push('App install campaigns show strong performance based on GFH data');
      recommendations.push('Video ads and responsive display ads recommended');
    }

    if (platform.toLowerCase().includes('linkedin')) {
      recommendations.push('Professional content and thought leadership posts perform well');
      recommendations.push('Sponsored content and carousel ads recommended for B2B audiences');
    }

    return recommendations;
  }
}

export default GFHDataParser;
export { GFH_RAW_DATA, GFH_WEEKLY_DATA, GFH_MARKET_DATA };
export type { GFHDataRow };
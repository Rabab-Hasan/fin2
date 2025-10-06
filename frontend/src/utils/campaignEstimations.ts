// Campaign Performance Data Parser and Calculator
// This utility reads historical campaign data and provides estimation functions

interface HistoricalData {
  platform: string;
  market: string;
  objective: string;
  deliveredSpends: number;
  deliveredImpressions: number;
  deliveredClicks: number;
  deliveredCPM: number;
  deliveredCPC: number;
  deliveredCTR: number;
  deliveredReach: number;
}

// Platform mapping from frontend names to data names
const platformMapping: { [key: string]: string } = {
  'Meta (Facebook)': 'Meta',
  'Instagram': 'Meta', // Instagram is part of Meta
  'Google Ads': 'Google UAC',
  'TikTok': 'TikTok',
  'LinkedIn': 'LinkedIn',
  'Twitter': 'Twitter',
  'YouTube': 'Google UAC', // YouTube is part of Google
  'Snapchat': 'Snapchat',
  'Pinterest': 'Pinterest'
};

// Country mapping from frontend names to data market names
const countryMapping: { [key: string]: string } = {
  'Bahrain': 'BAH',
  'Saudi Arabia': 'KSA | GEO TG',
  'United Arab Emirates': 'UAE | GEO TG',
  'Oman': 'OMN',
  'Qatar': 'QTR | GEO TG',
  'Kuwait': 'KWT',
  'United Kingdom': 'UK',
  'Jordan': 'JOR',
  'Lebanon': 'LBN',
  'Egypt': 'EGP',
  'Morocco': 'MAR'
};

// Historical campaign performance data (from GFH file)
const historicalData: HistoricalData[] = [
  // Twitter Data
  {
    platform: 'Twitter',
    market: 'KSA | GEO TG',
    objective: 'Awareness',
    deliveredSpends: 4977.15,
    deliveredImpressions: 2159928,
    deliveredClicks: 6088,
    deliveredCPM: 2.30,
    deliveredCPC: 0.82,
    deliveredCTR: 0.28,
    deliveredReach: 64540
  },
  {
    platform: 'Twitter',
    market: 'UAE | GEO TG',
    objective: 'Awareness',
    deliveredSpends: 4001.16,
    deliveredImpressions: 620883,
    deliveredClicks: 1771,
    deliveredCPM: 6.44,
    deliveredCPC: 2.26,
    deliveredCTR: 0.29,
    deliveredReach: 24663
  },
  {
    platform: 'Twitter',
    market: 'KWT',
    objective: 'Awareness',
    deliveredSpends: 2997.45,
    deliveredImpressions: 1498479,
    deliveredClicks: 4259,
    deliveredCPM: 2.00,
    deliveredCPC: 0.70,
    deliveredCTR: 0.28,
    deliveredReach: 13059
  },
  // Meta Data
  {
    platform: 'Meta',
    market: 'KSA | GEO TG',
    objective: 'CTAP',
    deliveredSpends: 6497.62,
    deliveredImpressions: 3255367,
    deliveredClicks: 49619,
    deliveredCPM: 1.996,
    deliveredCPC: 0.131,
    deliveredCTR: 1.52,
    deliveredReach: 834808
  },
  {
    platform: 'Meta',
    market: 'UAE | GEO TG',
    objective: 'CTAP',
    deliveredSpends: 4498.95,
    deliveredImpressions: 1614538,
    deliveredClicks: 38560,
    deliveredCPM: 2.79,
    deliveredCPC: 0.117,
    deliveredCTR: 2.39,
    deliveredReach: 333797
  },
  {
    platform: 'Meta',
    market: 'KWT',
    objective: 'CTAP',
    deliveredSpends: 2998.13,
    deliveredImpressions: 623398,
    deliveredClicks: 13636,
    deliveredCPM: 4.81,
    deliveredCPC: 0.220,
    deliveredCTR: 2.19,
    deliveredReach: 623411
  },
  {
    platform: 'Meta',
    market: 'QTR | GEO TG',
    objective: 'CTAP',
    deliveredSpends: 2000.34,
    deliveredImpressions: 793542,
    deliveredClicks: 12128,
    deliveredCPM: 2.52,
    deliveredCPC: 0.165,
    deliveredCTR: 1.53,
    deliveredReach: 688553
  },
  {
    platform: 'Meta',
    market: 'OMN',
    objective: 'CTAP',
    deliveredSpends: 1997.67,
    deliveredImpressions: 1209030,
    deliveredClicks: 25571,
    deliveredCPM: 1.65,
    deliveredCPC: 0.078,
    deliveredCTR: 2.12,
    deliveredReach: 1314075
  },
  {
    platform: 'Meta',
    market: 'BAH',
    objective: 'CTAP',
    deliveredSpends: 2999.26,
    deliveredImpressions: 1244329,
    deliveredClicks: 26172,
    deliveredCPM: 2.41,
    deliveredCPC: 0.115,
    deliveredCTR: 2.10,
    deliveredReach: 285820
  },
  // LinkedIn Data
  {
    platform: 'LinkedIn',
    market: 'KSA | GEO TG',
    objective: 'Awareness',
    deliveredSpends: 4995.63,
    deliveredImpressions: 3870318,
    deliveredClicks: 5027,
    deliveredCPM: 1.29,
    deliveredCPC: 0.99,
    deliveredCTR: 0.13,
    deliveredReach: 610079
  },
  {
    platform: 'LinkedIn',
    market: 'UAE | GEO TG',
    objective: 'Awareness',
    deliveredSpends: 3996.27,
    deliveredImpressions: 3100021,
    deliveredClicks: 3513,
    deliveredCPM: 1.29,
    deliveredCPC: 1.14,
    deliveredCTR: 0.11,
    deliveredReach: 721007
  },
  {
    platform: 'LinkedIn',
    market: 'KWT',
    objective: 'Awareness',
    deliveredSpends: 1999.25,
    deliveredImpressions: 656864,
    deliveredClicks: 1356,
    deliveredCPM: 3.04,
    deliveredCPC: 1.47,
    deliveredCTR: 0.21,
    deliveredReach: 90353
  },
  // Google UAC Data
  {
    platform: 'Google UAC',
    market: 'KSA | GEO TG',
    objective: 'App Installs',
    deliveredSpends: 4429.73,
    deliveredImpressions: 663702,
    deliveredClicks: 36210,
    deliveredCPM: 6.67,
    deliveredCPC: 0.122,
    deliveredCTR: 5.46,
    deliveredReach: 0
  },
  {
    platform: 'Google UAC',
    market: 'UAE | GEO TG',
    objective: 'App Installs',
    deliveredSpends: 3626.17,
    deliveredImpressions: 518324,
    deliveredClicks: 33703,
    deliveredCPM: 7.00,
    deliveredCPC: 0.108,
    deliveredCTR: 6.50,
    deliveredReach: 0
  },
  {
    platform: 'Google UAC',
    market: 'KWT',
    objective: 'App Installs',
    deliveredSpends: 2206.14,
    deliveredImpressions: 554285,
    deliveredClicks: 15503,
    deliveredCPM: 3.98,
    deliveredCPC: 0.142,
    deliveredCTR: 2.80,
    deliveredReach: 0
  },
  {
    platform: 'Google UAC',
    market: 'QTR | GEO TG',
    objective: 'App Installs',
    deliveredSpends: 1366.34,
    deliveredImpressions: 321775,
    deliveredClicks: 10642,
    deliveredCPM: 4.25,
    deliveredCPC: 0.128,
    deliveredCTR: 3.31,
    deliveredReach: 0
  },
  {
    platform: 'Google UAC',
    market: 'OMN',
    objective: 'App Installs',
    deliveredSpends: 1371.12,
    deliveredImpressions: 354786,
    deliveredClicks: 21573,
    deliveredCPM: 3.86,
    deliveredCPC: 0.064,
    deliveredCTR: 6.08,
    deliveredReach: 0
  }
];

interface EstimationResult {
  estimatedImpressions: number;
  estimatedClicks: number;
  estimatedConversions: number;
  estimatedReach: number;
  costPerClick: number;
  costPerConversion: number;
  averageCPM: number;
  averageCPC: number;
  averageCTR: number;
  confidence: 'high' | 'medium' | 'low';
  insights: string[];
  recommendations: string[];
  dataPoints: number;
}

interface Platform {
  name: string;
  budget: number;
  campaignTypes: { [key: string]: number };
}

export const calculateDataDrivenEstimates = (
  budget: number,
  platforms: Platform[],
  countries: string[],
  duration: number,
  contentCount: number = 0
): EstimationResult => {
  let totalEstimatedImpressions = 0;
  let totalEstimatedClicks = 0;
  let totalEstimatedReach = 0;
  let weightedCPM = 0;
  let weightedCPC = 0;
  let weightedCTR = 0;
  let totalWeight = 0;
  let validDataPoints = 0;

  const insights: string[] = [];
  const recommendations: string[] = [];

  // Process each platform-country combination
  platforms.forEach(platform => {
    const mappedPlatform = platformMapping[platform.name];
    if (!mappedPlatform) return;

    const platformBudget = (budget * platform.budget) / 100;
    
    countries.forEach(country => {
      const mappedCountry = countryMapping[country];
      if (!mappedCountry) return;

      // Find matching historical data
      const matchingData = historicalData.filter(data => 
        data.platform === mappedPlatform && 
        data.market === mappedCountry
      );

      if (matchingData.length > 0) {
        validDataPoints++;
        
        // Calculate averages from matching data
        const avgCPM = matchingData.reduce((sum, data) => sum + data.deliveredCPM, 0) / matchingData.length;
        const avgCPC = matchingData.reduce((sum, data) => sum + data.deliveredCPC, 0) / matchingData.length;
        const avgCTR = matchingData.reduce((sum, data) => sum + data.deliveredCTR, 0) / matchingData.length;
        
        // Distribute platform budget across countries
        const countryPlatformBudget = platformBudget / countries.length;
        
        // Apply the formulas you specified:
        // Estimated Impressions = (Budget / CPM) * 1000
        const impressions = (countryPlatformBudget / avgCPM) * 1000;
        
        // Estimated Clicks = Budget / CPC
        const clicks = countryPlatformBudget / avgCPC;
        
        // Estimated Reach (based on historical ratio)
        const avgReachToImpressions = matchingData.reduce((sum, data) => 
          data.deliveredReach > 0 ? sum + (data.deliveredReach / data.deliveredImpressions) : sum, 0
        ) / matchingData.filter(data => data.deliveredReach > 0).length || 0.3; // fallback 30%
        
        const reach = impressions * avgReachToImpressions;

        // Add to totals
        totalEstimatedImpressions += impressions;
        totalEstimatedClicks += clicks;
        totalEstimatedReach += reach;
        
        // Weighted averages
        weightedCPM += avgCPM * countryPlatformBudget;
        weightedCPC += avgCPC * countryPlatformBudget;
        weightedCTR += avgCTR * countryPlatformBudget;
        totalWeight += countryPlatformBudget;

        // Generate platform-specific insights
        if (platform.name.includes('Meta')) {
          if (avgCTR > 2.0) {
            insights.push(`Meta campaigns in ${country} show high engagement (${avgCTR.toFixed(2)}% CTR)`);
          }
          if (avgCPC < 0.15) {
            insights.push(`Meta offers cost-effective clicks in ${country} (~$${avgCPC.toFixed(3)} CPC)`);
          }
        }
        
        if (platform.name.includes('Google')) {
          if (avgCTR > 4.0) {
            insights.push(`Google campaigns in ${country} show excellent intent-driven performance`);
          }
          recommendations.push(`Focus on app install campaigns for Google in ${country}`);
        }
        
        if (platform.name === 'LinkedIn') {
          if (avgCPC > 1.0) {
            insights.push(`LinkedIn has higher CPC in ${country} but targets professional audience`);
          }
        }

      }
    });
  });

  // Calculate final averages
  if (totalWeight > 0) {
    weightedCPM /= totalWeight;
    weightedCPC /= totalWeight;
    weightedCTR /= totalWeight;
  }

  // Calculate final CTR from our estimates
  const calculatedCTR = totalEstimatedImpressions > 0 ? 
    (totalEstimatedClicks / totalEstimatedImpressions) * 100 : 0;

  // Estimate conversions (using 5% conversion rate, but varies by platform)
  let conversionRate = 0.05; // Base 5%
  
  if (platforms.some(p => p.name.includes('Google'))) {
    conversionRate = 0.08; // Higher for Google due to intent
  }
  if (platforms.some(p => p.name.includes('Meta'))) {
    conversionRate = 0.06; // Slightly higher for Meta
  }

  const totalEstimatedConversions = totalEstimatedClicks * conversionRate;

  // Generate additional insights based on data
  const dailyBudget = budget / duration;
  
  if (dailyBudget > 500) {
    insights.push("High daily budget enables aggressive market penetration");
    recommendations.push("Monitor performance closely and optimize for best-performing ad sets");
  }
  
  if (validDataPoints >= 5) {
    insights.push("Strong historical data available for accurate predictions");
  } else if (validDataPoints >= 2) {
    insights.push("Moderate historical data - predictions based on available metrics");
  } else {
    insights.push("Limited historical data - estimates include industry benchmarks");
    recommendations.push("Consider running test campaigns to gather more data");
  }

  // GCC market insights
  const gccCountries = ['Bahrain', 'Saudi Arabia', 'United Arab Emirates', 'Oman', 'Qatar', 'Kuwait'];
  const hasGCC = countries.some(country => gccCountries.includes(country));
  
  if (hasGCC) {
    insights.push("GCC markets typically show higher engagement and conversion rates");
    recommendations.push("Leverage premium content for affluent GCC audiences");
  }

  if (contentCount > 8) {
    insights.push("Diverse content portfolio will improve audience engagement");
    recommendations.push("A/B test different content types to identify top performers");
  }

  // Determine confidence level
  let confidence: 'high' | 'medium' | 'low' = 'low';
  if (validDataPoints >= 4 && budget >= 1000 && duration >= 7) {
    confidence = 'high';
  } else if (validDataPoints >= 2 && budget >= 500) {
    confidence = 'medium';
  }

  // Fallback calculations if no historical data
  if (validDataPoints === 0) {
    // Use industry averages
    const fallbackCPM = 5.0;
    const fallbackCPC = 0.50;
    
    totalEstimatedImpressions = (budget / fallbackCPM) * 1000;
    totalEstimatedClicks = budget / fallbackCPC;
    totalEstimatedReach = totalEstimatedImpressions * 0.3; // 30% reach
    
    weightedCPM = fallbackCPM;
    weightedCPC = fallbackCPC;
    weightedCTR = 2.0;
    
    recommendations.push("Consider running initial test campaigns to establish baseline metrics");
    insights.push("Estimates based on industry averages - actual performance may vary");
  }

  return {
    estimatedImpressions: Math.round(totalEstimatedImpressions),
    estimatedClicks: Math.round(totalEstimatedClicks),
    estimatedConversions: Math.round(totalEstimatedConversions),
    estimatedReach: Math.round(totalEstimatedReach),
    costPerClick: Math.round((budget / totalEstimatedClicks) * 100) / 100 || 0,
    costPerConversion: Math.round((budget / totalEstimatedConversions) * 100) / 100 || 0,
    averageCPM: Math.round(weightedCPM * 100) / 100,
    averageCPC: Math.round(weightedCPC * 100) / 100,
    averageCTR: Math.round(weightedCTR * 100) / 100,
    confidence,
    insights,
    recommendations,
    dataPoints: validDataPoints
  };
};

// Export historical data for reference
export { historicalData, platformMapping, countryMapping };
export type { HistoricalData, EstimationResult, Platform };
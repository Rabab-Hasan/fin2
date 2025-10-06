const express = require('express');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const router = express.Router();

// Map frontend platform names to data platform names
const platformMapping = {
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

// Map frontend country names to data market names
const countryMapping = {
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

// Cache for performance data
let performanceDataCache = null;
let lastCacheTime = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Function to load performance data from CSV
const loadPerformanceData = () => {
  return new Promise((resolve, reject) => {
    const csvFilePath = path.join(__dirname, '../../campaign_performance_data.csv');
    
    if (!fs.existsSync(csvFilePath)) {
      reject(new Error('Campaign performance data file not found'));
      return;
    }

    const data = [];
    
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (row) => {
        // Skip total rows and invalid entries
        if (row['Start Date'] === 'Total' || !row.Platform || !row.Market) {
          return;
        }

        // Clean and parse numeric values
        const cleanNumeric = (value) => {
          if (!value || value === '' || isNaN(parseFloat(value))) return 0;
          return parseFloat(value);
        };

        const parsedRow = {
          startDate: row['Start Date'],
          endDate: row['End date'],
          campaign: row.Campaign,
          platform: row.Platform,
          objective: row.Objective,
          market: row.Market,
          plannedSpends: cleanNumeric(row['Planned Sends $']),
          deliveredSpends: cleanNumeric(row['Delivered Spends $']),
          plannedReach: cleanNumeric(row['Planned Reach']),
          deliveredReach: cleanNumeric(row['Delivered Reach']),
          plannedImpressions: cleanNumeric(row['Planned Imp.']),
          deliveredImpressions: cleanNumeric(row['Delivered Imp.']),
          plannedClicks: cleanNumeric(row['Planned Clicks']),
          deliveredClicks: cleanNumeric(row['Delivered Clicks']),
          plannedCPM: cleanNumeric(row['Planned CPM']),
          deliveredCPM: cleanNumeric(row['Delivered CPM']),
          plannedCPC: cleanNumeric(row['Planned CPC']),
          deliveredCPC: cleanNumeric(row['Delivered CPC']),
          plannedAppInstalls: cleanNumeric(row['Planned App Installs']),
          deliveredAppInstalls: cleanNumeric(row['Delivered App Installs']),
          plannedCPI: cleanNumeric(row['Planned CPI']),
          deliveredCPI: cleanNumeric(row['Delivered CPI']),
          plannedCTR: cleanNumeric(row['Planned CTR']),
          deliveredCTR: cleanNumeric(row['Delivered CTR'])
        };

        data.push(parsedRow);
      })
      .on('end', () => {
        resolve(data);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
};

// Function to get performance data (with caching)
const getPerformanceData = async () => {
  const now = Date.now();
  
  if (performanceDataCache && lastCacheTime && (now - lastCacheTime) < CACHE_DURATION) {
    return performanceDataCache;
  }
  
  try {
    performanceDataCache = await loadPerformanceData();
    lastCacheTime = now;
    return performanceDataCache;
  } catch (error) {
    console.error('Error loading performance data:', error);
    throw error;
  }
};

// Function to calculate campaign estimates based on historical data
const calculateEstimates = (budget, platforms, countries, duration) => {
  return new Promise(async (resolve, reject) => {
    try {
      const data = await getPerformanceData();
      
      let totalEstimatedImpressions = 0;
      let totalEstimatedClicks = 0;
      let totalEstimatedConversions = 0;
      let averageCPM = 0;
      let averageCPC = 0;
      let averageCTR = 0;
      let validDataPoints = 0;

      // Process each platform
      platforms.forEach(platform => {
        const mappedPlatform = platformMapping[platform.name];
        if (!mappedPlatform) return;

        const platformBudget = (budget * platform.budget) / 100;
        
        // Process each country for this platform
        countries.forEach(country => {
          const mappedCountry = countryMapping[country];
          if (!mappedCountry) return;

          // Find matching data points
          const matchingData = data.filter(row => 
            row.platform === mappedPlatform && 
            row.market === mappedCountry &&
            row.deliveredCPM > 0 && 
            row.deliveredCPC > 0
          );

          if (matchingData.length > 0) {
            // Calculate averages for this platform-country combination
            const avgCPM = matchingData.reduce((sum, row) => sum + row.deliveredCPM, 0) / matchingData.length;
            const avgCPC = matchingData.reduce((sum, row) => sum + row.deliveredCPC, 0) / matchingData.length;
            const avgCTR = matchingData.reduce((sum, row) => sum + row.deliveredCTR, 0) / matchingData.length;

            // Calculate estimates using the provided formulas
            const countryPlatformBudget = platformBudget / countries.length; // Distribute budget evenly across countries
            
            // Estimated Impressions = (Budget / CPM) * 1000
            const estimatedImpressions = (countryPlatformBudget / avgCPM) * 1000;
            
            // Estimated Clicks = Budget / CPC
            const estimatedClicks = countryPlatformBudget / avgCPC;
            
            // Add to totals
            totalEstimatedImpressions += estimatedImpressions;
            totalEstimatedClicks += estimatedClicks;
            
            // Weighted averages
            averageCPM += avgCPM;
            averageCPC += avgCPC;
            averageCTR += avgCTR;
            validDataPoints++;
          }
        });
      });

      if (validDataPoints > 0) {
        averageCPM /= validDataPoints;
        averageCPC /= validDataPoints;
        averageCTR /= validDataPoints;
        
        // Calculate conversions (assuming 5% conversion rate - can be made configurable)
        const conversionRate = 0.05;
        totalEstimatedConversions = totalEstimatedClicks * conversionRate;
        
        // Calculate final CTR = (Clicks / Impressions) * 100
        const finalCTR = totalEstimatedImpressions > 0 ? (totalEstimatedClicks / totalEstimatedImpressions) * 100 : 0;

        resolve({
          estimatedImpressions: Math.round(totalEstimatedImpressions),
          estimatedClicks: Math.round(totalEstimatedClicks),
          estimatedConversions: Math.round(totalEstimatedConversions),
          averageCPM: Math.round(averageCPM * 100) / 100,
          averageCPC: Math.round(averageCPC * 100) / 100,
          averageCTR: Math.round(averageCTR * 10000) / 100, // Convert to percentage
          calculatedCTR: Math.round(finalCTR * 100) / 100,
          costPerClick: totalEstimatedClicks > 0 ? Math.round((budget / totalEstimatedClicks) * 100) / 100 : 0,
          costPerConversion: totalEstimatedConversions > 0 ? Math.round((budget / totalEstimatedConversions) * 100) / 100 : 0,
          dataPoints: validDataPoints,
          confidence: validDataPoints >= 3 ? 'high' : validDataPoints >= 1 ? 'medium' : 'low'
        });
      } else {
        // Fallback to basic estimates if no historical data
        resolve({
          estimatedImpressions: Math.round(budget * 1000), // Basic fallback
          estimatedClicks: Math.round(budget * 50), // Basic fallback
          estimatedConversions: Math.round(budget * 2.5), // Basic fallback
          averageCPM: 5.0,
          averageCPC: 0.20,
          averageCTR: 2.0,
          calculatedCTR: 5.0,
          costPerClick: 0.20,
          costPerConversion: 10.0,
          dataPoints: 0,
          confidence: 'low'
        });
      }
    } catch (error) {
      reject(error);
    }
  });
};

// GET /api/campaign-performance/estimates
router.post('/estimates', async (req, res) => {
  try {
    const { budget, platforms, countries, duration } = req.body;

    if (!budget || !platforms || !countries || !duration) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: budget, platforms, countries, duration'
      });
    }

    const estimates = await calculateEstimates(budget, platforms, countries, duration);
    
    res.json({
      success: true,
      data: estimates
    });
  } catch (error) {
    console.error('Error calculating estimates:', error);
    res.status(500).json({
      success: false,
      message: 'Error calculating campaign estimates',
      error: error.message
    });
  }
});

// GET /api/campaign-performance/data
router.get('/data', async (req, res) => {
  try {
    const { platform, country } = req.query;
    const data = await getPerformanceData();
    
    let filteredData = data;
    
    if (platform) {
      const mappedPlatform = platformMapping[platform];
      if (mappedPlatform) {
        filteredData = filteredData.filter(row => row.platform === mappedPlatform);
      }
    }
    
    if (country) {
      const mappedCountry = countryMapping[country];
      if (mappedCountry) {
        filteredData = filteredData.filter(row => row.market === mappedCountry);
      }
    }
    
    res.json({
      success: true,
      data: filteredData,
      total: filteredData.length
    });
  } catch (error) {
    console.error('Error fetching performance data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching performance data',
      error: error.message
    });
  }
});

// GET /api/campaign-performance/platforms
router.get('/platforms', async (req, res) => {
  try {
    const data = await getPerformanceData();
    const platforms = [...new Set(data.map(row => row.platform))].filter(Boolean);
    
    res.json({
      success: true,
      data: platforms
    });
  } catch (error) {
    console.error('Error fetching platforms:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching platforms',
      error: error.message
    });
  }
});

// GET /api/campaign-performance/countries
router.get('/countries', async (req, res) => {
  try {
    const data = await getPerformanceData();
    const markets = [...new Set(data.map(row => row.market))].filter(Boolean);
    
    res.json({
      success: true,
      data: markets
    });
  } catch (error) {
    console.error('Error fetching countries:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching countries',
      error: error.message
    });
  }
});

module.exports = router;
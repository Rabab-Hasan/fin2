const fs = require('fs').promises;
const path = require('path');
const csv = require('csv-parse');
const moment = require('moment');

class MarketingAnalyzer {
  constructor() {
    this.data = [];
    this.rawData = [];
    this.analysisResults = null;
    this.insights = [];
  }

  /**
   * Parse CSV file and load data
   */
  async loadCSVFile(filePath) {
    try {
      console.log('📊 Loading CSV file:', filePath);
      const fileContent = await fs.readFile(filePath, 'utf-8');
      
      return new Promise((resolve, reject) => {
        const records = [];
        const parser = csv.parse({
          columns: true,
          skip_empty_lines: true,
          trim: true
        });

        parser.on('readable', function() {
          let record;
          while (record = parser.read()) {
            records.push(record);
          }
        });

        parser.on('error', (err) => {
          console.error('❌ CSV parsing error:', err);
          reject(err);
        });

        parser.on('end', () => {
          console.log('✅ CSV file loaded successfully:', records.length, 'records');
          this.rawData = records;
          resolve(records);
        });

        parser.write(fileContent);
        parser.end();
      });
    } catch (error) {
      console.error('❌ Error loading CSV file:', error);
      throw error;
    }
  }

  /**
   * Clean and preprocess the data
   */
  async cleanData() {
    console.log('🧹 Starting data cleaning...');
    
    const cleanedData = this.rawData.map(record => {
      // First normalize the record with proper column mapping
      const normalizedRecord = {};
      
      // Handle the actual column names from your CSV
      Object.keys(record).forEach(key => {
        const trimmedKey = key.trim();
        switch (trimmedKey) {
          case 'day':
            normalizedRecord.day = record[key];
            break;
          case 'hour':
            normalizedRecord.hour = record[key];
            break;
          case 'channel':
            normalizedRecord.channel = record[key];
            break;
          case 'creative_network':
            normalizedRecord.creative_network = record[key];
            break;
          case 'network_cost':
            normalizedRecord.network_cost = record[key];
            break;
          case 'installs':
            normalizedRecord.installs = record[key];
            break;
          case 'started onboarding_events':
          case 'onboarding_events':
            normalizedRecord.onboarding_events = record[key];
            break;
          case 'registered no account linked_events':
          case 'linked_events':
            normalizedRecord.linked_events = record[key];
            break;
          case 'registered':
            normalizedRecord.registered = record[key];
            break;
          case 'waus':
            normalizedRecord.waus = record[key];
            break;
          case 'delinked account_events':
          case 'delinked':
            normalizedRecord.delinked = record[key];
            break;
          default:
            // Keep other columns as-is
            normalizedRecord[trimmedKey] = record[key];
        }
      });

      const cleaned = { ...normalizedRecord };
      
      // Define numeric fields that should be converted to numbers
      const numericFields = [
        'network_cost', 'installs', 'onboarding_events', 
        'registered', 'linked_events', 'waus', 'delinked'
      ];
      
      // Convert numeric fields with strict validation and precision
      numericFields.forEach(field => {
        if (cleaned[field] !== undefined && cleaned[field] !== null && cleaned[field] !== '') {
          // Handle string numbers with strict parsing
          let numValue;
          if (typeof cleaned[field] === 'string') {
            // Remove any non-numeric characters except decimal point and minus sign
            const cleanedString = cleaned[field].toString().replace(/[^0-9.-]/g, '');
            numValue = parseFloat(cleanedString);
          } else {
            numValue = parseFloat(cleaned[field]);
          }
          
          // Ensure we have a valid number and apply appropriate precision
          if (isNaN(numValue) || !isFinite(numValue)) {
            cleaned[field] = 0;
          } else if (field === 'network_cost' || field === 'waus') {
            // Keep 2 decimal places for cost and WAUS
            cleaned[field] = Math.round(numValue * 100) / 100;
          } else {
            // Round to whole numbers for counts (installs, events, etc.)
            cleaned[field] = Math.round(numValue);
          }
        } else {
          cleaned[field] = 0;
        }
      });

      // Parse date and hour with better handling
      if (cleaned.day) {
        // Handle different date formats (MM/DD/YYYY or YYYY-MM-DD)
        const dateParsed = moment(cleaned.day, ['MM/DD/YYYY', 'YYYY-MM-DD', 'DD/MM/YYYY']);
        cleaned.parsed_date = dateParsed.isValid() ? dateParsed.format('YYYY-MM-DD') : null;
        
        // Handle hour - could be timestamp or just hour number
        if (cleaned.hour) {
          if (typeof cleaned.hour === 'string' && cleaned.hour.includes('T')) {
            // ISO timestamp format like "2025-10-01T00:00:00"
            cleaned.parsed_hour = moment(cleaned.hour).hour();
          } else {
            // Just hour number
            cleaned.parsed_hour = parseInt(cleaned.hour) || 0;
          }
        } else {
          cleaned.parsed_hour = 0;
        }
      }

      // Clean channel name
      if (cleaned.channel) {
        cleaned.channel = cleaned.channel.trim();
      }

      // Handle creative_network - keep for analysis but flag for potential removal
      if (cleaned.creative_network) {
        cleaned.campaign_name = cleaned.creative_network.trim();
      }

      return cleaned;
    }).filter(record => {
      // Filter out records with critical missing data
      return record.channel && record.parsed_date;
    });

    this.data = cleanedData;
    console.log('✅ Data cleaning completed:', cleanedData.length, 'valid records');
    
    // Log sample of cleaned data for verification
    if (cleanedData.length > 0) {
      console.log('🔍 Sample cleaned record:');
      const sample = cleanedData[0];
      console.log(`   - Date: ${sample.parsed_date}, Hour: ${sample.parsed_hour}`);
      console.log(`   - Channel: ${sample.channel}, Campaign: ${sample.creative_network}`);
      console.log(`   - Cost: $${sample.network_cost}, Installs: ${sample.installs}`);
      console.log(`   - Onboarding: ${sample.onboarding_events}, Registered: ${sample.registered}`);
      console.log(`   - Linked Events: ${sample.linked_events}, WAUS: ${sample.waus}`);
    }
    
    return {
      originalCount: this.rawData.length,
      cleanedCount: cleanedData.length,
      removedCount: this.rawData.length - cleanedData.length
    };
  }

  /**
   * Calculate key performance metrics
   */
  calculateMetrics() {
    console.log('📈 Calculating performance metrics...');
    
    const metrics = this.data.map(record => {
      const metrics = { ...record };

      // Install Conversion Rate = Installs / Onboarding Events (with precision)
      if (record.onboarding_events && record.onboarding_events > 0) {
        metrics.install_conversion_rate = Math.round((record.installs / record.onboarding_events) * 10000) / 100; // 2 decimal precision
      } else {
        metrics.install_conversion_rate = 0;
      }

      // Cost per Install (CPI) with precision
      if (record.installs && record.installs > 0) {
        metrics.cpi = Math.round((record.network_cost / record.installs) * 100) / 100; // 2 decimal precision
      } else {
        metrics.cpi = record.network_cost > 0 ? 999999 : 0; // Use large number instead of Infinity for JSON compatibility
      }

      // Registration Conversion Rate with precision
      if (record.onboarding_events && record.onboarding_events > 0 && record.registered !== undefined) {
        metrics.registration_conversion_rate = Math.round((record.registered / record.onboarding_events) * 10000) / 100;
      } else {
        metrics.registration_conversion_rate = 0;
      }

      // Account Linking Rate with precision
      if (record.registered && record.registered > 0 && record.linked_events !== undefined) {
        metrics.account_linking_rate = Math.round((record.linked_events / record.registered) * 10000) / 100;
      } else {
        metrics.account_linking_rate = 0;
      }

      // ROI indicators
      metrics.total_spend = record.network_cost;
      metrics.total_installs = record.installs;
      
      return metrics;
    });

    this.data = metrics;
    console.log('✅ Metrics calculation completed');
    
    return this.data;
  }

  /**
   * Perform time-based analysis
   */
  performTimeAnalysis() {
    console.log('⏰ Performing time-based analysis...');
    
    // Group by day
    const dailyStats = this.data.reduce((acc, record) => {
      const date = record.parsed_date;
      if (!acc[date]) {
        acc[date] = {
          date,
          total_cost: 0,
          total_installs: 0,
          total_onboarding: 0,
          total_registered: 0,
          records: 0
        };
      }
      
      // Ensure we're adding valid numbers only
      acc[date].total_cost += (record.network_cost || 0);
      acc[date].total_installs += (record.installs || 0);
      acc[date].total_onboarding += (record.onboarding_events || 0);
      acc[date].total_registered += (record.registered || 0);
      acc[date].records += 1;
      
      return acc;
    }, {});

    // Group by hour
    const hourlyStats = this.data.reduce((acc, record) => {
      const hour = record.parsed_hour || 0;
      if (!acc[hour]) {
        acc[hour] = {
          hour,
          total_cost: 0,
          total_installs: 0,
          total_onboarding: 0,
          avg_cpi: 0,
          records: 0
        };
      }
      
      // Ensure we're adding valid numbers only
      acc[hour].total_cost += (record.network_cost || 0);
      acc[hour].total_installs += (record.installs || 0);
      acc[hour].total_onboarding += (record.onboarding_events || 0);
      acc[hour].records += 1;
      
      return acc;
    }, {});

    // Calculate averages for hourly data with precision
    Object.values(hourlyStats).forEach(hourData => {
      // Round all totals to ensure accuracy
      hourData.total_cost = Math.round(hourData.total_cost * 100) / 100;
      hourData.total_installs = Math.round(hourData.total_installs);
      hourData.total_onboarding = Math.round(hourData.total_onboarding);
      
      // Calculate CPI with precision
      hourData.avg_cpi = hourData.total_installs > 0 ? 
        Math.round((hourData.total_cost / hourData.total_installs) * 100) / 100 : 0;
    });

    // Group by hour across days for comparison
    const hourlyByDay = this.data.reduce((acc, record) => {
      const hour = record.parsed_hour || 0;
      const date = record.parsed_date;
      
      if (!acc[hour]) {
        acc[hour] = {
          hour,
          dailyBreakdown: {},
          totalCost: 0,
          totalInstalls: 0,
          totalOnboarding: 0,
          avgCPI: 0,
          bestDay: null,
          worstDay: null
        };
      }
      
      if (!acc[hour].dailyBreakdown[date]) {
        acc[hour].dailyBreakdown[date] = {
          date,
          cost: 0,
          installs: 0,
          onboarding: 0,
          cpi: 0,
          conversion_rate: 0
        };
      }
      
      acc[hour].dailyBreakdown[date].cost += record.network_cost;
      acc[hour].dailyBreakdown[date].installs += record.installs;
      acc[hour].dailyBreakdown[date].onboarding += record.onboarding_events;
      
      acc[hour].totalCost += record.network_cost;
      acc[hour].totalInstalls += record.installs;
      acc[hour].totalOnboarding += record.onboarding_events;
      
      return acc;
    }, {});

    // Calculate metrics for each hour's daily breakdown
    Object.values(hourlyByDay).forEach(hourData => {
      const dailyBreakdownArray = Object.values(hourData.dailyBreakdown);
      
      // Calculate CPI and conversion rates for each day
      dailyBreakdownArray.forEach(dayData => {
        dayData.cpi = dayData.installs > 0 ? dayData.cost / dayData.installs : 0;
        dayData.conversion_rate = dayData.onboarding > 0 ? 
          (dayData.installs / dayData.onboarding) * 100 : 0;
      });
      
      // Find best and worst performing days for this hour
      const validDays = dailyBreakdownArray.filter(d => d.installs > 0);
      if (validDays.length > 0) {
        hourData.bestDay = validDays.reduce((best, current) => 
          current.conversion_rate > best.conversion_rate ? current : best
        );
        hourData.worstDay = validDays.reduce((worst, current) => 
          current.conversion_rate < worst.conversion_rate ? current : worst
        );
      }
      
      // Calculate overall metrics for this hour
      hourData.avgCPI = hourData.totalInstalls > 0 ? 
        hourData.totalCost / hourData.totalInstalls : 0;
      
      // Sort daily breakdown by date
      hourData.dailyBreakdown = Object.fromEntries(
        Object.entries(hourData.dailyBreakdown).sort(([a], [b]) => 
          new Date(a) - new Date(b)
        )
      );
    });

    // Round daily stats for accuracy
    Object.values(dailyStats).forEach(dayData => {
      dayData.total_cost = Math.round(dayData.total_cost * 100) / 100;
      dayData.total_installs = Math.round(dayData.total_installs);
      dayData.total_onboarding = Math.round(dayData.total_onboarding);
      dayData.total_registered = Math.round(dayData.total_registered);
    });

    return {
      daily: Object.values(dailyStats).sort((a, b) => new Date(a.date) - new Date(b.date)),
      hourly: Object.values(hourlyStats).sort((a, b) => a.hour - b.hour),
      hourlyComparison: Object.values(hourlyByDay).sort((a, b) => a.hour - b.hour)
    };
  }

  /**
   * Analyze campaign and channel performance
   */
  analyzeCampaignsAndChannels() {
    console.log('📊 Analyzing campaigns and channels...');
    
    // Channel analysis
    const channelStats = this.data.reduce((acc, record) => {
      const channel = record.channel;
      if (!acc[channel]) {
        acc[channel] = {
          channel,
          total_cost: 0,
          total_installs: 0,
          total_onboarding: 0,
          total_registered: 0,
          campaigns: new Set(),
          avg_cpi: 0,
          conversion_rate: 0
        };
      }
      
      // Ensure we add valid numbers only
      acc[channel].total_cost += (record.network_cost || 0);
      acc[channel].total_installs += (record.installs || 0);
      acc[channel].total_onboarding += (record.onboarding_events || 0);
      acc[channel].total_registered += (record.registered || 0);
      if (record.campaign_name) {
        acc[channel].campaigns.add(record.campaign_name);
      }
      
      return acc;
    }, {});

    // Calculate channel metrics with precision
    Object.values(channelStats).forEach(channelData => {
      // Round totals for accuracy
      channelData.total_cost = Math.round(channelData.total_cost * 100) / 100;
      channelData.total_installs = Math.round(channelData.total_installs);
      channelData.total_onboarding = Math.round(channelData.total_onboarding);
      channelData.total_registered = Math.round(channelData.total_registered);
      
      // Calculate metrics with precision
      channelData.avg_cpi = channelData.total_installs > 0 ? 
        Math.round((channelData.total_cost / channelData.total_installs) * 100) / 100 : 0;
      channelData.conversion_rate = channelData.total_onboarding > 0 ?
        Math.round((channelData.total_installs / channelData.total_onboarding) * 10000) / 100 : 0;
      
      channelData.campaigns = Array.from(channelData.campaigns);
      channelData.campaign_count = channelData.campaigns.length;
    });

    // Campaign analysis (top performing)
    const campaignStats = this.data.reduce((acc, record) => {
      if (!record.campaign_name) return acc;
      
      const campaign = record.campaign_name;
      if (!acc[campaign]) {
        acc[campaign] = {
          campaign,
          channel: record.channel,
          total_cost: 0,
          total_installs: 0,
          total_onboarding: 0,
          avg_cpi: 0,
          conversion_rate: 0
        };
      }
      
      // Ensure we add valid numbers only
      acc[campaign].total_cost += (record.network_cost || 0);
      acc[campaign].total_installs += (record.installs || 0);
      acc[campaign].total_onboarding += (record.onboarding_events || 0);
      
      return acc;
    }, {});

    // Calculate campaign metrics with precision
    Object.values(campaignStats).forEach(campaignData => {
      // Round totals for accuracy
      campaignData.total_cost = Math.round(campaignData.total_cost * 100) / 100;
      campaignData.total_installs = Math.round(campaignData.total_installs);
      campaignData.total_onboarding = Math.round(campaignData.total_onboarding);
      
      // Calculate metrics with precision
      campaignData.avg_cpi = campaignData.total_installs > 0 ? 
        Math.round((campaignData.total_cost / campaignData.total_installs) * 100) / 100 : 0;
      campaignData.conversion_rate = campaignData.total_onboarding > 0 ?
        Math.round((campaignData.total_installs / campaignData.total_onboarding) * 10000) / 100 : 0;
    });

    // Sort and get top performers
    const topChannels = Object.values(channelStats)
      .sort((a, b) => b.total_installs - a.total_installs)
      .slice(0, 10);

    const topCampaigns = Object.values(campaignStats)
      .filter(c => c.total_installs > 0)
      .sort((a, b) => b.conversion_rate - a.conversion_rate)
      .slice(0, 15);

    return {
      channels: topChannels,
      campaigns: topCampaigns,
      allChannels: Object.values(channelStats),
      allCampaigns: Object.values(campaignStats)
    };
  }

  /**
   * Analyze user journey and conversion funnel
   */
  analyzeUserJourney() {
    console.log('🚶 Analyzing user journey...');
    
    const totalOnboarding = this.data.reduce((sum, record) => sum + record.onboarding_events, 0);
    const totalInstalls = this.data.reduce((sum, record) => sum + record.installs, 0);
    const totalRegistered = this.data.reduce((sum, record) => sum + record.registered, 0);
    const totalLinked = this.data.reduce((sum, record) => sum + record.linked_events, 0);
    
    const funnelSteps = [
      {
        step: 'Onboarding Events',
        count: totalOnboarding,
        percentage: 100,
        dropoff: 0
      },
      {
        step: 'Installs',
        count: totalInstalls,
        percentage: totalOnboarding > 0 ? (totalInstalls / totalOnboarding) * 100 : 0,
        dropoff: totalOnboarding > 0 ? ((totalOnboarding - totalInstalls) / totalOnboarding) * 100 : 0
      },
      {
        step: 'Registrations',
        count: totalRegistered,
        percentage: totalOnboarding > 0 ? (totalRegistered / totalOnboarding) * 100 : 0,
        dropoff: totalInstalls > 0 ? ((totalInstalls - totalRegistered) / totalInstalls) * 100 : 0
      },
      {
        step: 'Account Linked',
        count: totalLinked,
        percentage: totalOnboarding > 0 ? (totalLinked / totalOnboarding) * 100 : 0,
        dropoff: totalRegistered > 0 ? ((totalRegistered - totalLinked) / totalRegistered) * 100 : 0
      }
    ];

    // Calculate drop-off points
    const criticalDropoffs = funnelSteps
      .filter(step => step.dropoff > 50)
      .map(step => ({
        step: step.step,
        dropoff: step.dropoff,
        impact: 'high'
      }));

    return {
      funnel: funnelSteps,
      criticalDropoffs,
      overallConversionRate: totalOnboarding > 0 ? (totalLinked / totalOnboarding) * 100 : 0
    };
  }

  /**
   * Identify trends and anomalies
   */
  identifyTrends() {
    console.log('📈 Identifying trends and anomalies...');
    
    const dailyData = this.performTimeAnalysis().daily;
    const anomalies = [];
    const trends = [];

    if (dailyData.length > 1) {
      // Calculate average metrics
      const avgInstalls = dailyData.reduce((sum, day) => sum + day.total_installs, 0) / dailyData.length;
      const avgCost = dailyData.reduce((sum, day) => sum + day.total_cost, 0) / dailyData.length;

      // Identify spikes and drops
      dailyData.forEach((day, index) => {
        // Install spikes (200% above average)
        if (day.total_installs > avgInstalls * 2) {
          anomalies.push({
            type: 'spike',
            metric: 'installs',
            date: day.date,
            value: day.total_installs,
            average: avgInstalls,
            deviation: ((day.total_installs - avgInstalls) / avgInstalls) * 100
          });
        }

        // Install drops (50% below average)
        if (day.total_installs < avgInstalls * 0.5 && avgInstalls > 0) {
          anomalies.push({
            type: 'drop',
            metric: 'installs',
            date: day.date,
            value: day.total_installs,
            average: avgInstalls,
            deviation: ((avgInstalls - day.total_installs) / avgInstalls) * 100
          });
        }

        // Cost spikes
        if (day.total_cost > avgCost * 2) {
          anomalies.push({
            type: 'spike',
            metric: 'cost',
            date: day.date,
            value: day.total_cost,
            average: avgCost,
            deviation: ((day.total_cost - avgCost) / avgCost) * 100
          });
        }
      });

      // Overall trend analysis
      if (dailyData.length >= 3) {
        const firstHalf = dailyData.slice(0, Math.floor(dailyData.length / 2));
        const secondHalf = dailyData.slice(Math.floor(dailyData.length / 2));
        
        const firstHalfAvg = firstHalf.reduce((sum, day) => sum + day.total_installs, 0) / firstHalf.length;
        const secondHalfAvg = secondHalf.reduce((sum, day) => sum + day.total_installs, 0) / secondHalf.length;
        
        const trendChange = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;
        
        if (Math.abs(trendChange) > 20) {
          trends.push({
            metric: 'installs',
            direction: trendChange > 0 ? 'increasing' : 'decreasing',
            change: Math.abs(trendChange),
            period: `${dailyData[0].date} to ${dailyData[dailyData.length - 1].date}`
          });
        }
      }
    }

    return {
      anomalies: anomalies.slice(0, 10), // Top 10 anomalies
      trends
    };
  }

  /**
   * Generate comprehensive insights and recommendations
   */
  generateInsights() {
    console.log('💡 Generating insights and recommendations...');
    
    const channelData = this.analyzeCampaignsAndChannels();
    const timeData = this.performTimeAnalysis();
    const journeyData = this.analyzeUserJourney();
    const trendData = this.identifyTrends();
    
    const insights = [];
    const recommendations = [];

    // Best performing channels
    if (channelData.channels.length > 0) {
      const bestChannel = channelData.channels[0];
      insights.push({
        type: 'best_channel',
        title: 'Top Performing Channel',
        description: `${bestChannel.channel} is your best performing channel with ${bestChannel.total_installs} total installs and ${bestChannel.conversion_rate.toFixed(2)}% conversion rate.`,
        data: bestChannel,
        priority: 'high'
      });

      recommendations.push({
        type: 'budget_allocation',
        title: 'Increase Budget for Top Channel',
        description: `Consider increasing budget allocation to ${bestChannel.channel} as it shows the highest conversion rate.`,
        impact: 'high',
        effort: 'low'
      });
    }

    // Cost efficiency insights
    const lowCostChannels = channelData.channels.filter(c => c.avg_cpi > 0).sort((a, b) => a.avg_cpi - b.avg_cpi);
    if (lowCostChannels.length > 0) {
      const mostEfficient = lowCostChannels[0];
      insights.push({
        type: 'cost_efficiency',
        title: 'Most Cost-Efficient Channel',
        description: `${mostEfficient.channel} has the lowest cost per install at $${mostEfficient.avg_cpi.toFixed(2)}.`,
        data: mostEfficient,
        priority: 'medium'
      });
    }

    // Time-based insights
    const bestHour = timeData.hourly.sort((a, b) => b.total_installs - a.total_installs)[0];
    if (bestHour) {
      insights.push({
        type: 'peak_hour',
        title: 'Peak Performance Hour',
        description: `Hour ${bestHour.hour} shows the highest install volume with ${bestHour.total_installs} total installs.`,
        data: bestHour,
        priority: 'medium'
      });

      recommendations.push({
        type: 'timing_optimization',
        title: 'Optimize Ad Scheduling',
        description: `Focus ad spend during hour ${bestHour.hour} when conversion rates are highest.`,
        impact: 'medium',
        effort: 'low'
      });
    }

    // User journey insights
    if (journeyData.criticalDropoffs.length > 0) {
      const biggestDropoff = journeyData.criticalDropoffs[0];
      insights.push({
        type: 'conversion_issue',
        title: 'Critical Conversion Drop-off',
        description: `There's a ${biggestDropoff.dropoff.toFixed(1)}% drop-off at ${biggestDropoff.step}. This represents a significant optimization opportunity.`,
        data: biggestDropoff,
        priority: 'high'
      });

      recommendations.push({
        type: 'conversion_optimization',
        title: 'Improve Conversion Funnel',
        description: `Focus on reducing the drop-off rate at ${biggestDropoff.step} through UX improvements or retargeting.`,
        impact: 'high',
        effort: 'medium'
      });
    }

    // Trend-based insights
    trendData.trends.forEach(trend => {
      insights.push({
        type: 'trend',
        title: `${trend.direction.charAt(0).toUpperCase() + trend.direction.slice(1)} Trend Detected`,
        description: `${trend.metric} is ${trend.direction} by ${trend.change.toFixed(1)}% over ${trend.period}.`,
        data: trend,
        priority: trend.change > 50 ? 'high' : 'medium'
      });
    });

    // Campaign performance insights
    const topCampaigns = channelData.campaigns.slice(0, 3);
    if (topCampaigns.length > 0) {
      insights.push({
        type: 'top_campaigns',
        title: 'Best Performing Campaigns',
        description: `Top 3 campaigns by conversion rate: ${topCampaigns.map(c => c.campaign.substring(0, 30) + '...').join(', ')}.`,
        data: topCampaigns,
        priority: 'medium'
      });

      recommendations.push({
        type: 'campaign_scaling',
        title: 'Scale Winning Campaigns',
        description: 'Consider increasing budget for top-performing campaigns while pausing underperformers.',
        impact: 'high',
        effort: 'medium'
      });
    }

    return {
      insights: insights.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }),
      recommendations: recommendations.sort((a, b) => {
        const impactOrder = { high: 3, medium: 2, low: 1 };
        return impactOrder[b.impact] - impactOrder[a.impact];
      })
    };
  }

  /**
   * Run complete analysis
   */
  async runCompleteAnalysis(filePath) {
    try {
      console.log('🚀 Starting complete marketing analysis...');
      
      // Step 1: Load data
      await this.loadCSVFile(filePath);
      
      // Step 2: Clean data
      const cleaningResults = await this.cleanData();
      
      // Step 3: Calculate metrics
      this.calculateMetrics();
      
      // Step 4: Perform analyses
      const timeAnalysis = this.performTimeAnalysis();
      const campaignAnalysis = this.analyzeCampaignsAndChannels();
      const userJourneyAnalysis = this.analyzeUserJourney();
      const trendAnalysis = this.identifyTrends();
      const insights = this.generateInsights();
      
      // Step 5: Compile results with 100% accurate calculations
      const totalCost = this.data.reduce((sum, r) => sum + (r.network_cost || 0), 0);
      const totalInstalls = this.data.reduce((sum, r) => sum + (r.installs || 0), 0);
      const totalOnboarding = this.data.reduce((sum, r) => sum + (r.onboarding_events || 0), 0);
      const totalRegistered = this.data.reduce((sum, r) => sum + (r.registered || 0), 0);
      
      // Get valid dates for range calculation
      const validDates = this.data
        .map(r => r.parsed_date)
        .filter(date => date && date !== null)
        .map(date => new Date(date));
      
      this.analysisResults = {
        summary: {
          totalRecords: this.data.length,
          totalCost: Math.round(totalCost * 100) / 100, // 2 decimal precision
          totalInstalls: Math.round(totalInstalls),
          totalOnboarding: Math.round(totalOnboarding),
          totalRegistered: Math.round(totalRegistered),
          avgCPI: 0, // Will be calculated below
          overallConversionRate: 0, // Will be calculated below
          dateRange: validDates.length > 0 ? {
            start: new Date(Math.min(...validDates)).toISOString(),
            end: new Date(Math.max(...validDates)).toISOString()
          } : { start: null, end: null }
        },
        cleaning: cleaningResults,
        timeAnalysis,
        campaignAnalysis,
        userJourney: userJourneyAnalysis,
        trends: trendAnalysis,
        insights: insights.insights,
        recommendations: insights.recommendations,
        rawDataSample: this.data.slice(0, 5) // Sample for verification
      };

      // Calculate summary metrics with 100% precision
      this.analysisResults.summary.avgCPI = this.analysisResults.summary.totalInstalls > 0 ? 
        Math.round((this.analysisResults.summary.totalCost / this.analysisResults.summary.totalInstalls) * 100) / 100 : 0;
      this.analysisResults.summary.overallConversionRate = this.analysisResults.summary.totalOnboarding > 0 ?
        Math.round((this.analysisResults.summary.totalInstalls / this.analysisResults.summary.totalOnboarding) * 10000) / 100 : 0;

      console.log('✅ Complete marketing analysis finished successfully');
      console.log('📊 Analysis Summary:');
      console.log(`   - Records: ${this.analysisResults.summary.totalRecords}`);
      console.log(`   - Total Cost: $${this.analysisResults.summary.totalCost.toFixed(2)}`);
      console.log(`   - Total Installs: ${this.analysisResults.summary.totalInstalls}`);
      console.log(`   - Average CPI: $${this.analysisResults.summary.avgCPI.toFixed(2)}`);
      console.log(`   - Conversion Rate: ${this.analysisResults.summary.overallConversionRate.toFixed(2)}%`);
      console.log(`   - Insights Generated: ${this.analysisResults.insights.length}`);
      console.log(`   - Recommendations: ${this.analysisResults.recommendations.length}`);

      return this.analysisResults;
    } catch (error) {
      console.error('❌ Complete analysis failed:', error);
      throw error;
    }
  }

  /**
   * Get analysis results
   */
  getResults() {
    return this.analysisResults;
  }

  /**
   * Export analysis to JSON
   */
  exportResults() {
    return {
      timestamp: new Date().toISOString(),
      analysis: this.analysisResults,
      metadata: {
        version: '1.0.0',
        analyzer: 'MarketingAnalyzer'
      }
    };
  }
}

module.exports = MarketingAnalyzer;
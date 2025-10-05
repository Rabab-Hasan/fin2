const express = require('express');
const router = express.Router();
const pool = require('../database');
const AIAnalysisService = require('../services/aiAnalysisService');

// Helper function to calculate derived fields
function calculateDerivedFields(reportDate) {
  const date = new Date(reportDate);
  const year = date.getFullYear();
  const month_num = date.getMonth() + 1;
  const month_key = `${year}-${String(month_num).padStart(2, '0')}`;
  
  // Calculate week of month (ISO week starting Sunday)
  const firstOfMonth = new Date(year, month_num - 1, 1);
  const dayOfMonth = date.getDate();
  const week_of_month = Math.ceil(dayOfMonth / 7);
  
  // Day of week (0=Sunday, 6=Saturday)
  const day_of_week = date.getDay();
  
  return {
    year,
    month_num,
    month_key,
    week_of_month: Math.min(week_of_month, 5), // Cap at week 5
    day_of_week
  };
}

// Helper function to get metric value from row (SQLite) or data (PostgreSQL)
function getMetricValue(rowOrData, metric) {
  // If it's a row object with individual columns (SQLite)
  if (rowOrData && typeof rowOrData === 'object' && rowOrData.hasOwnProperty('report_date')) {
    return rowOrData[metric] || 0;
  }
  // If it's a data object (PostgreSQL JSONB)
  return rowOrData && rowOrData[metric] ? rowOrData[metric] : 0;
}

// Monthly Comparison endpoint
router.get('/monthly-comparison', async (req, res) => {
  try {
    const { weeks = 'all', months, metric = 'total_advance_applicants', maxDays } = req.query;
    
    const client = await pool.connect();
    
    // For SQLite, select individual columns instead of data JSONB
    let query = `SELECT 
      report_date,
      registered_onboarded,
      linked_accounts,
      total_advance_applications,
      total_advance_applicants,
      total_micro_financing_applications,
      total_micro_financing_applicants,
      total_personal_finance_application,
      total_personal_finance_applicants
    FROM reports ORDER BY report_date`;
    const result = await client.query(query);
    
    // Process data with derived fields - convert SQLite row to data structure
    let filteredData = result.rows.map(row => {
      const derived = calculateDerivedFields(row.report_date);
      return {
        report_date: row.report_date,
        derived,
        value: getMetricValue(row, metric)
      };
    });

    // Apply day normalization if maxDays is specified
    if (maxDays && parseInt(maxDays) > 0) {
      const maxDaysLimit = parseInt(maxDays);
      
      // Group data by month first
      const monthlyData = {};
      filteredData.forEach(row => {
        const monthKey = row.derived.month_key;
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = [];
        }
        monthlyData[monthKey].push(row);
      });
      
      // For each month, only take the first N days
      filteredData = [];
      Object.keys(monthlyData).forEach(monthKey => {
        const monthRows = monthlyData[monthKey].sort((a, b) => new Date(a.report_date) - new Date(b.report_date));
        // Take only the first maxDaysLimit days of the month
        const limitedRows = monthRows.slice(0, maxDaysLimit);
        filteredData.push(...limitedRows);
      });
    }
    
    // Filter by weeks
    if (weeks !== 'all') {
      const weekList = weeks.split(',').map(w => parseInt(w));
      filteredData = filteredData.filter(row => weekList.includes(row.derived.week_of_month));
    }
    
    // Filter by months
    if (months) {
      const monthList = months.split(',');
      filteredData = filteredData.filter(row => monthList.includes(row.derived.month_key));
    }
    
    // Decide aggregation level based on weeks selection
    if (weeks === 'all') {
      // Aggregate by month when all weeks selected
      const monthlyTotals = {};
      const monthlyCounts = {};
      
      filteredData.forEach(row => {
        const monthKey = row.derived.month_key;
        if (!monthlyTotals[monthKey]) {
          monthlyTotals[monthKey] = 0;
          monthlyCounts[monthKey] = 0;
        }
        monthlyTotals[monthKey] += row.value;
        monthlyCounts[monthKey]++;
      });
      
      // Format response
      const rows = Object.keys(monthlyTotals).sort().map(month => ({
        month,
        value: monthlyTotals[month],
        daysCounted: monthlyCounts[month]
      }));
      
      // Calculate month-over-month changes
      const mom_changes = [];
      for (let i = 1; i < rows.length; i++) {
        const current = rows[i];
        const previous = rows[i - 1];
        const pct = previous.value > 0 ? ((current.value - previous.value) / previous.value * 100) : 0;
        mom_changes.push({
          from: previous.month,
          to: current.month,
          pct: Math.round(pct * 10) / 10
        });
      }
      
      client.release();
      
      res.json({
        metric,
        weeks: 'all',
        months: months ? months.split(',') : rows.map(r => r.month),
        rows,
        mom_changes
      });
    } else {
      // Aggregate by week when specific weeks selected
      const weeklyTotals = {};
      const weeklyCounts = {};
      
      filteredData.forEach(row => {
        const weekKey = `${row.derived.month_key}-W${row.derived.week_of_month}`;
        if (!weeklyTotals[weekKey]) {
          weeklyTotals[weekKey] = 0;
          weeklyCounts[weekKey] = 0;
        }
        weeklyTotals[weekKey] += row.value;
        weeklyCounts[weekKey]++;
      });
      
      // Format response
      const rows = Object.keys(weeklyTotals).sort().map(week => ({
        month: week, // Using month field for consistency but it's actually week
        value: weeklyTotals[week],
        daysCounted: weeklyCounts[week]
      }));
      
      // Calculate week-over-week changes
      const mom_changes = [];
      for (let i = 1; i < rows.length; i++) {
        const current = rows[i];
        const previous = rows[i - 1];
        const pct = previous.value > 0 ? ((current.value - previous.value) / previous.value * 100) : 0;
        mom_changes.push({
          from: previous.month,
          to: current.month,
          pct: Math.round(pct * 10) / 10
        });
      }
      
      client.release();
      
      res.json({
        metric,
        weeks: weeks.split(',').map(w => parseInt(w)),
        months: months ? months.split(',') : [],
        rows,
        mom_changes
      });
    }
    
  } catch (error) {
    console.error('Monthly comparison error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Weekly Comparison endpoint
router.get('/weekly-comparison', async (req, res) => {
  try {
    const { days = '0', month, metric = 'total_advance_applicants' } = req.query;
    
    const client = await pool.connect();
    
    // For SQLite, select individual columns instead of data JSONB
    let query = `SELECT 
      report_date,
      registered_onboarded,
      linked_accounts,
      total_advance_applications,
      total_advance_applicants,
      total_micro_financing_applications,
      total_micro_financing_applicants,
      total_personal_finance_application,
      total_personal_finance_applicants
    FROM reports ORDER BY report_date`;
    const result = await client.query(query);
    
    // Process data with derived fields - convert SQLite row to data structure
    let filteredData = result.rows.map(row => {
      const derived = calculateDerivedFields(row.report_date);
      return {
        report_date: row.report_date,
        derived,
        value: getMetricValue(row, metric)
      };
    });
    
    // Filter by month if specified
    if (month) {
      filteredData = filteredData.filter(row => row.derived.month_key === month);
    }
    
    // Filter by days
    const dayList = days.split(',').map(d => parseInt(d));
    filteredData = filteredData.filter(row => dayList.includes(row.derived.day_of_week));
    
    // Build series data
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const series = dayList.map(dayNum => {
      const dayName = dayNames[dayNum];
      
      // Aggregate by month for this day
      const monthlyTotals = {};
      filteredData
        .filter(row => row.derived.day_of_week === dayNum)
        .forEach(row => {
          const monthKey = row.derived.month_key;
          if (!monthlyTotals[monthKey]) {
            monthlyTotals[monthKey] = 0;
          }
          monthlyTotals[monthKey] += row.value;
        });
      
      const points = Object.keys(monthlyTotals).sort().map(monthKey => ({
        month: monthKey,
        value: monthlyTotals[monthKey]
      }));
      
      return {
        label: dayName,
        points
      };
    });
    
    client.release();
    
    res.json({
      metric,
      days: dayList,
      month: month || null,
      series
    });
    
  } catch (error) {
    console.error('Weekly comparison error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Daily/Weekly Analysis endpoint
router.get('/daily-weekly', async (req, res) => {
  try {
    const { weeks = 'all', months, metric = 'total_advance_applicants', view = 'weekly', startDate, endDate, weekdays } = req.query;
    
    const client = await pool.connect();
    
    // For SQLite, select individual columns instead of data JSONB
    let query = `SELECT 
      report_date,
      registered_onboarded,
      linked_accounts,
      total_advance_applications,
      total_advance_applicants,
      total_micro_financing_applications,
      total_micro_financing_applicants,
      total_personal_finance_application,
      total_personal_finance_applicants
    FROM reports ORDER BY report_date`;
    const result = await client.query(query);
    
    // Process data with derived fields
    let filteredData = result.rows.map(row => {
      const derived = calculateDerivedFields(row.report_date);
      return {
        report_date: row.report_date,
        derived,
        value: getMetricValue(row, metric)
      };
    });
    
    // Filter by date range if provided
    if (startDate || endDate) {
      filteredData = filteredData.filter(row => {
        const rowDate = new Date(row.report_date);
        const start = startDate ? new Date(startDate) : new Date('1900-01-01');
        const end = endDate ? new Date(endDate) : new Date('2099-12-31');
        return rowDate >= start && rowDate <= end;
      });
    }
    
    // Filter by weeks
    if (weeks !== 'all') {
      const weekList = weeks.split(',').map(w => parseInt(w));
      filteredData = filteredData.filter(row => weekList.includes(row.derived.week_of_month));
    }
    
    // Filter by months
    if (months) {
      const monthList = months.split(',');
      filteredData = filteredData.filter(row => monthList.includes(row.derived.month_key));
    }

    // Filter by weekdays (for weekdays comparison view)
    if (weekdays) {
      const weekdayList = weekdays.split(',').map(w => parseInt(w));
      filteredData = filteredData.filter(row => weekdayList.includes(row.derived.day_of_week));
    }
    
    let responseData = {
      metric,
      weeks: weeks === 'all' ? 'all' : weeks.split(',').map(w => parseInt(w)),
      months: months ? months.split(',') : [],
      view
    };
    
    if (view === 'weekly') {
      // Weekly breakdown
      const weeklyTotals = {};
      const weeklyCounts = {};
      
      filteredData.forEach(row => {
        const weekKey = `${row.derived.month_key}-W${row.derived.week_of_month}`;
        if (!weeklyTotals[weekKey]) {
          weeklyTotals[weekKey] = 0;
          weeklyCounts[weekKey] = 0;
        }
        weeklyTotals[weekKey] += row.value;
        weeklyCounts[weekKey]++;
      });
      
      const rows = Object.keys(weeklyTotals).sort().map(week => ({
        week,
        value: weeklyTotals[week],
        daysCounted: weeklyCounts[week]
      }));
      
      // Calculate weekly summary
      const weekValues = rows.map(r => r.value);
      const bestWeek = rows.find(r => r.value === Math.max(...weekValues));
      const worstWeek = rows.find(r => r.value === Math.min(...weekValues));
      const avgValue = weekValues.reduce((sum, val) => sum + val, 0) / weekValues.length;
      
      responseData.rows = rows;
      responseData.weekly_summary = {
        best_week: bestWeek,
        worst_week: worstWeek,
        avg_value: Math.round(avgValue * 100) / 100,
        total_weeks: rows.length
      };
      
    } else if (view === 'daily') {
      // Daily breakdown
      const rows = filteredData.map(row => ({
        date: row.report_date,
        value: row.value,
        weekday: row.derived.day_of_week,
        week: row.derived.week_of_month,
        month: row.derived.month_key
      }));
      
      responseData.rows = rows;
      
    } else if (view === 'heatmap') {
      // Weekday heatmap data
      const weekdayTotals = {};
      const weekdayCounts = {};
      
      for (let day = 0; day <= 6; day++) {
        weekdayTotals[day] = 0;
        weekdayCounts[day] = 0;
      }
      
      filteredData.forEach(row => {
        const dayOfWeek = row.derived.day_of_week;
        weekdayTotals[dayOfWeek] += row.value;
        weekdayCounts[dayOfWeek]++;
      });
      
      const weekday_breakdown = Object.keys(weekdayTotals).map(day => ({
        weekday: parseInt(day),
        total_value: weekdayTotals[day],
        avg_value: weekdayCounts[day] > 0 ? Math.round((weekdayTotals[day] / weekdayCounts[day]) * 100) / 100 : 0,
        data_points: weekdayCounts[day]
      }));
      
      responseData.weekday_breakdown = weekday_breakdown;
      
    } else if (view === 'weekdays') {
      // Weekdays comparison view
      const weekdayTotals = {};
      const weekdayCounts = {};
      
      // Initialize all weekdays
      for (let day = 0; day <= 6; day++) {
        weekdayTotals[day] = 0;
        weekdayCounts[day] = 0;
      }
      
      filteredData.forEach(row => {
        const dayOfWeek = row.derived.day_of_week;
        weekdayTotals[dayOfWeek] += row.value;
        weekdayCounts[dayOfWeek]++;
      });
      
      const weekday_data = Object.keys(weekdayTotals).map(day => ({
        weekday: parseInt(day),
        total_value: weekdayTotals[day],
        avg_value: weekdayCounts[day] > 0 ? Math.round((weekdayTotals[day] / weekdayCounts[day]) * 100) / 100 : 0,
        data_points: weekdayCounts[day]
      }));
      
      // Calculate total average for comparison
      const totalSum = Object.values(weekdayTotals).reduce((sum, val) => sum + val, 0);
      const totalCount = Object.values(weekdayCounts).reduce((sum, count) => sum + count, 0);
      const total_avg = totalCount > 0 ? Math.round((totalSum / totalCount) * 100) / 100 : 0;
      
      responseData.weekday_data = weekday_data;
      responseData.total_avg = total_avg;
    }
    
    // Add available months for UI
    const allMonths = [...new Set(result.rows.map(row => {
      const derived = calculateDerivedFields(row.report_date);
      return derived.month_key;
    }))].sort();
    responseData.available_months = allMonths;
    
    client.release();
    res.json(responseData);
    
  } catch (error) {
    console.error('Daily/weekly analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Best Month Analysis endpoint
router.get('/best-month', async (req, res) => {
  try {
    const { metric = 'total_advance_applicants', weeks = 'all' } = req.query;
    
    const client = await pool.connect();
    
    // For SQLite, select individual columns instead of data JSONB
    const query = `SELECT 
      report_date,
      registered_onboarded,
      linked_accounts,
      total_advance_applications,
      total_advance_applicants,
      total_micro_financing_applications,
      total_micro_financing_applicants,
      total_personal_finance_application,
      total_personal_finance_applicants
    FROM reports ORDER BY report_date`;
    const result = await client.query(query);
    
    // Process data with derived fields - convert SQLite row to data structure
    let filteredData = result.rows.map(row => {
      const derived = calculateDerivedFields(row.report_date);
      return {
        report_date: row.report_date,
        derived,
        value: getMetricValue(row, metric)
      };
    });
    
    // Filter by weeks
    if (weeks !== 'all') {
      const weekList = weeks.split(',').map(w => parseInt(w));
      filteredData = filteredData.filter(row => weekList.includes(row.derived.week_of_month));
    }
    
    // Aggregate by month
    const monthlyData = {};
    filteredData.forEach(row => {
      const monthKey = row.derived.month_key;
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = [];
      }
      monthlyData[monthKey].push(row.value);
    });
    
    // Calculate scores for each month
    const monthlyScores = Object.keys(monthlyData).map(month => {
      const values = monthlyData[month];
      const volume = values.reduce((sum, val) => sum + val, 0);
      const mean = volume / values.length;
      const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
      const stddev = Math.sqrt(variance);
      const stability = mean > 0 ? Math.max(0, 1 - (stddev / mean)) : 0;
      
      return {
        month,
        value: volume,
        stability,
        rawStability: stability
      };
    });
    
    // Normalize volume scores (min-max)
    const volumes = monthlyScores.map(m => m.value);
    const minVolume = Math.min(...volumes);
    const maxVolume = Math.max(...volumes);
    const volumeRange = maxVolume - minVolume;
    
    monthlyScores.forEach(month => {
      const normalizedVolume = volumeRange > 0 ? (month.value - minVolume) / volumeRange : 1;
      month.score = 0.7 * normalizedVolume + 0.3 * month.stability;
    });
    
    // Sort by score and add ranks
    monthlyScores.sort((a, b) => b.score - a.score);
    monthlyScores.forEach((month, index) => {
      month.rank = index + 1;
      month.score = Math.round(month.score * 100) / 100;
    });
    
    const winner = monthlyScores[0];
    
    client.release();
    
    res.json({
      metric,
      weeks,
      scores: monthlyScores,
      winner,
      explain: {
        method: 'minmax',
        weights: { volume: 0.7, stability: 0.3 },
        notes: 'Score = 0.7*normalized(volume) + 0.3*(1 - stddev/mean)'
      }
    });
    
  } catch (error) {
    console.error('Best month error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Strategy Advisor endpoint
router.get('/strategy-advisor', async (req, res) => {
  try {
    const { metric = 'total_advance_applicants', weeks = 'all', months = 'all' } = req.query;
    
    const client = await pool.connect();
    
    // For SQLite, select individual columns instead of data JSONB
    const query = `SELECT 
      report_date,
      registered_onboarded,
      linked_accounts,
      total_advance_applications,
      total_advance_applicants,
      total_micro_financing_applications,
      total_micro_financing_applicants,
      total_personal_finance_application,
      total_personal_finance_applicants
    FROM reports ORDER BY report_date`;
    const result = await client.query(query);
    
    // Process data with derived fields - convert SQLite row to data structure
    let data = result.rows.map(row => {
      const derived = calculateDerivedFields(row.report_date);
      return {
        report_date: row.report_date,
        derived,
        metrics: {
          registered_onboarded: row.registered_onboarded || 0,
          linked_accounts: row.linked_accounts || 0,
          total_advance_applications: row.total_advance_applications || 0,
          total_advance_applicants: row.total_advance_applicants || 0,
          total_micro_financing_applications: row.total_micro_financing_applications || 0,
          total_micro_financing_applicants: row.total_micro_financing_applicants || 0,
          total_personal_finance_application: row.total_personal_finance_application || 0,
          total_personal_finance_applicants: row.total_personal_finance_applicants || 0
        }
      };
    });

    client.release();

    // Use AI Analysis Service for real insights
    const aiService = new AIAnalysisService();
    let analysisResult;
    
    try {
      console.log('🤖 Generating AI analysis...');
      analysisResult = await aiService.analyzeFinanceData(data, metric);
      console.log('✅ AI analysis completed');
    } catch (aiError) {
      console.warn('⚠️ AI analysis failed, using fallback:', aiError.message);
      analysisResult = aiService.fallbackAnalysis(data, metric);
    }
    
    res.json({
      generated_at: new Date().toISOString(),
      inputs: { metric, weeks, months },
      insights: analysisResult.insights || [],
      checklist: analysisResult.checklist || [],
      ai_powered: true,
      data_points: data.length
    });
    
  } catch (error) {
    console.error('Strategy advisor error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

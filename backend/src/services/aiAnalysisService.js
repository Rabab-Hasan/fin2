const { Ollama } = require('ollama');

class AIAnalysisService {
  constructor() {
    this.ollama = new Ollama({ host: 'http://localhost:11434' });
    this.model = 'mistral'; // You can change this to any model you have
  }

  async analyzeFinanceData(data, metric) {
    try {
      // Prepare data summary for AI
      const dataSummary = this.prepareDataSummary(data, metric);
      
      const prompt = `
You are a financial data analyst AI. Analyze the following financial performance data and provide actionable insights.

DATA SUMMARY:
${dataSummary}

TASK: Analyze this financial data and provide:
1. Key patterns and trends you observe
2. Specific opportunities for improvement
3. Risk areas that need attention
4. Timing-based recommendations (best days/weeks/months)
5. Actionable strategies for growth

Respond in JSON format with the following structure:
{
  "insights": [
    {
      "id": "unique-insight-id",
      "type": "opportunity|risk|timing",
      "priority": "high|medium|low",
      "title": "Brief descriptive title",
      "evidence": {"key": "value", "trend": "percentage"},
      "recommendation": "Specific actionable recommendation"
    }
  ],
  "checklist": [
    {
      "id": "task-id",
      "label": "Actionable task description",
      "owner": null,
      "due": null
    }
  ]
}

Focus on practical, data-driven insights that can lead to real business improvements.
`;

      const response = await this.ollama.chat({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        stream: false
      });

      // Parse AI response
      try {
        const aiAnalysis = JSON.parse(response.message.content);
        return aiAnalysis;
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError);
        // Fallback to rule-based analysis if AI fails
        return this.fallbackAnalysis(data, metric);
      }

    } catch (error) {
      console.error('AI Analysis error:', error);
      // Fallback to rule-based analysis
      return this.fallbackAnalysis(data, metric);
    }
  }

  prepareDataSummary(data, metric) {
    if (!data || data.length === 0) return "No data available";

    // Calculate key statistics
    const monthlyTotals = {};
    const weeklyTotals = {};
    const dailyTotals = {};

    data.forEach(row => {
      const monthKey = row.derived.month_key;
      const weekKey = row.derived.week_of_month;
      const dayKey = row.derived.day_of_week;

      if (!monthlyTotals[monthKey]) monthlyTotals[monthKey] = 0;
      if (!weeklyTotals[weekKey]) weeklyTotals[weekKey] = 0;
      if (!dailyTotals[dayKey]) dailyTotals[dayKey] = 0;

      Object.keys(row.metrics).forEach(metricKey => {
        monthlyTotals[monthKey] += row.metrics[metricKey];
        weeklyTotals[weekKey] += row.metrics[metricKey];
        dailyTotals[dayKey] += row.metrics[metricKey];
      });
    });

    const summary = {
      totalRecords: data.length,
      dateRange: `${data[0]?.report_date} to ${data[data.length - 1]?.report_date}`,
      monthlyPerformance: monthlyTotals,
      weeklyPerformance: weeklyTotals,
      dailyPerformance: dailyTotals,
      metrics: {
        primaryMetric: metric,
        totalVolume: data.reduce((sum, row) => sum + (row.metrics[metric] || 0), 0),
        averageDaily: data.reduce((sum, row) => sum + (row.metrics[metric] || 0), 0) / data.length
      }
    };

    return JSON.stringify(summary, null, 2);
  }

  // New method for Campaign Assistant with Ollama
  async analyzeCampaignWithOllama(prompt) {
    try {
      const response = await this.ollama.chat({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        stream: false
      });

      // Parse AI response
      try {
        const analysis = JSON.parse(response.message.content);
        return analysis;
      } catch (parseError) {
        console.error('Failed to parse campaign analysis:', parseError);
        // Return structured fallback
        return {
          insights: [{
            type: 'system',
            priority: 'medium',
            title: 'AI Response Parse Error',
            message: 'Ollama returned a response but it could not be parsed. Raw response available.',
            recommendation: 'Check Ollama model output format.',
            gfhEvidence: response.message.content.substring(0, 200) + '...'
          }],
          forecasts: {
            expectedCTR: 0.015,
            expectedCPC: 0.20,
            expectedCPM: 3.50,
            expectedReach: 50000,
            expectedImpressions: 250000,
            confidenceLevel: 'low'
          },
          recommendations: ['Review raw AI response for insights']
        };
      }
    } catch (error) {
      console.error('Ollama campaign analysis error:', error);
      throw error;
    }
  }

  // New method for GFH questions with Ollama
  async askGFHQuestion(prompt) {
    try {
      const response = await this.ollama.chat({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        stream: false
      });

      try {
        const analysis = JSON.parse(response.message.content);
        return analysis;
      } catch (parseError) {
        console.error('Failed to parse GFH response:', parseError);
        return {
          answer: response.message.content,
          evidence: [],
          insights: ['AI response parsing failed - raw response provided'],
          recommendations: ['Check Ollama response format']
        };
      }
    } catch (error) {
      console.error('Ollama GFH question error:', error);
      throw error;
    }
  }

  fallbackAnalysis(data, metric) {
    // This is the existing rule-based analysis as fallback
    const insights = [];
    const checklist = [];
    
    // Rule 1: Best Week Analysis
    const weeklyTotals = {};
    data.forEach(row => {
      const weekKey = row.derived.week_of_month;
      if (!weeklyTotals[weekKey]) weeklyTotals[weekKey] = 0;
      weeklyTotals[weekKey] += row.metrics[metric];
    });
    
    const avgWeekly = Object.values(weeklyTotals).reduce((sum, val) => sum + val, 0) / Object.keys(weeklyTotals).length;
    Object.keys(weeklyTotals).forEach(week => {
      const value = weeklyTotals[week];
      const lift = ((value - avgWeekly) / avgWeekly) * 100;
      if (lift >= 15) {
        insights.push({
          id: `wk${week}-spike-${metric.replace(/_/g, '-')}`,
          type: 'opportunity',
          priority: 'high',
          title: `Week ${week} shows ${Math.round(lift)}% higher performance`,
          evidence: {
            week: week,
            value: Math.round(value),
            lift_percentage: `+${Math.round(lift * 10) / 10}%`
          },
          recommendation: `Focus marketing efforts and resource allocation during Week ${week} of each month for maximum impact.`
        });
        
        checklist.push({
          id: `task-week-${week}`,
          label: `Schedule enhanced marketing campaigns for Week ${week}`,
          owner: null,
          due: null
        });
      }
    });

    return { insights, checklist };
  }
}

module.exports = AIAnalysisService;

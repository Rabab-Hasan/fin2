const express = require('express');
const router = express.Router();
const AIAnalysisService = require('../services/aiAnalysisService');

// GFH Campaign Data - Real data from Excel file
const GFH_CAMPAIGN_DATA = [
  {
    startDate: '2025-05-12',
    endDate: '2025-07-11',
    campaign: 'Mobile Investor app campaign',
    platform: 'Twitter',
    objective: 'Awareness',
    market: 'KSA',
    plannedSpends: 5000,
    deliveredSpends: 4977.15,
    deliveredReach: 64540,
    plannedImpressions: 1250000,
    deliveredImpressions: 2159928,
    deliveredClicks: 6088,
    deliveredCPM: 2.304312921541829,
    deliveredCPC: 0.817534494086728,
    deliveredCTR: 0.0028186124722675942
  },
  {
    startDate: '2025-05-06',
    endDate: '2025-07-06',
    campaign: 'Mobile Investor app campaign',
    platform: 'Meta',
    objective: 'CTAP',
    market: 'KSA',
    plannedSpends: 6500,
    deliveredSpends: 6497.62,
    deliveredReach: 834808,
    deliveredImpressions: 3255367,
    deliveredClicks: 49619,
    deliveredCPM: 1.9959715755550753,
    deliveredCPC: 0.13095024083516393,
    deliveredCTR: 0.015242213857915252,
    deliveredAppInstalls: 0
  },
  {
    startDate: '2025-05-06',
    endDate: '2025-07-06',
    campaign: 'Mobile Investor app campaign',
    platform: 'Meta',
    objective: 'CTAP',
    market: 'OMN',
    plannedSpends: 2000,
    deliveredSpends: 1997.67,
    deliveredReach: 1314075,
    deliveredImpressions: 1209030,
    deliveredClicks: 25571,
    deliveredCPM: 1.6522915064142327,
    deliveredCPC: 0.0781224824997067,
    deliveredCTR: 0.021150012820194703,
    deliveredAppInstalls: 0
  },
  {
    startDate: '2025-05-15',
    endDate: '2025-07-13',
    campaign: 'Mobile Investor app campaign',
    platform: 'Google UAC',
    objective: 'App Installs',
    market: 'KSA',
    plannedSpends: 6000,
    deliveredSpends: 4429.73,
    deliveredImpressions: 663702,
    deliveredClicks: 36210,
    deliveredCPM: 6.674275503162563,
    deliveredCPC: 0.12233443800055233,
    deliveredAppInstalls: 4362,
    deliveredCPI: 1.0155272810637321,
    deliveredCTR: 0.054557617726027643
  },
  {
    startDate: '2025-05-15',
    endDate: '2025-07-13',
    campaign: 'Mobile Investor app campaign',
    platform: 'Google UAC',
    objective: 'App Installs',
    market: 'OMN',
    plannedSpends: 2000,
    deliveredSpends: 1371.12,
    deliveredImpressions: 354786,
    deliveredClicks: 21573,
    deliveredCPM: 3.864639529180971,
    deliveredCPC: 0.06355722430816299,
    deliveredAppInstalls: 2683,
    deliveredCPI: 0.5110398807305255,
    deliveredCTR: 0.060805668769342645
  }
];

// Weekly performance data from GFH
const GFH_WEEKLY_DATA = [
  { week: 1, period: '4May - 10May', deliveredSpends: 2020.73, deliveredImpressions: 627604, deliveredClicks: 14193, cpm: 3.22, cpc: 0.142, ctr: 0.0226 },
  { week: 2, period: '11May - 17May', deliveredSpends: 5601.41, deliveredImpressions: 1766105, deliveredClicks: 29952, cpm: 3.17, cpc: 0.187, ctr: 0.0170 },
  { week: 3, period: '18May - 24May', deliveredSpends: 8245.04, deliveredImpressions: 2825349, deliveredClicks: 45675, cpm: 2.92, cpc: 0.181, ctr: 0.0162 },
  { week: 4, period: '25May - 31May', deliveredSpends: 10154.92, deliveredImpressions: 3940969, deliveredClicks: 51820, cpm: 2.58, cpc: 0.196, ctr: 0.0131 },
  { week: 5, period: '1Jun - 7Jun', deliveredSpends: 11766.13, deliveredImpressions: 3775316, deliveredClicks: 61762, cpm: 3.12, cpc: 0.191, ctr: 0.0164 }
];

const aiService = new AIAnalysisService();

// POST /api/campaign-assistant/analyze - Get Ollama AI analysis of campaign setup
router.post('/analyze', async (req, res) => {
  try {
    const { budget, duration, countries, platforms, objectives } = req.body;

    if (!budget || !duration || !countries?.length) {
      return res.status(400).json({ error: 'Budget, duration, and countries are required' });
    }

    // Filter GFH data for relevant markets and platforms
    const relevantCampaigns = GFH_CAMPAIGN_DATA.filter(campaign => {
      const campaignMarket = campaign.market.toLowerCase();
      const matchesCountries = countries.some(country => 
        campaignMarket.includes(country.toLowerCase().substring(0, 3)) ||
        (country.toLowerCase() === 'saudi arabia' && campaignMarket.includes('ksa')) ||
        (country.toLowerCase() === 'oman' && campaignMarket.includes('omn'))
      );
      
      const matchesPlatforms = !platforms?.length || platforms.some(platform =>
        campaign.platform.toLowerCase().includes(platform.toLowerCase()) ||
        (platform.toLowerCase().includes('meta') && campaign.platform.toLowerCase().includes('meta')) ||
        (platform.toLowerCase().includes('google') && campaign.platform.toLowerCase().includes('google'))
      );

      return matchesCountries && matchesPlatforms;
    });

    // Create detailed AI prompt with GFH data
    const prompt = `You are an expert Campaign Strategy AI Assistant powered by Ollama. Analyze this campaign setup using REAL GFH performance data.

USER'S CAMPAIGN SETUP:
- Budget: $${budget}
- Duration: ${duration} days  
- Target Countries: ${countries.join(', ')}
- Platforms: ${platforms?.join(', ') || 'Not specified'}
- Objectives: ${objectives?.join(', ') || 'Not specified'}

ACTUAL GFH CAMPAIGN PERFORMANCE DATA:
${JSON.stringify(relevantCampaigns, null, 2)}

GFH WEEKLY PERFORMANCE TRENDS:
${JSON.stringify(GFH_WEEKLY_DATA, null, 2)}

ANALYSIS TASK:
Based on the actual GFH performance data above, provide strategic campaign insights:

1. PLATFORM PERFORMANCE: Analyze which platforms performed best in target markets using actual CTR, CPC, CPM data from GFH campaigns

2. MARKET INSIGHTS: Compare market performance using delivered results from GFH data

3. BUDGET FORECASTING: Use GFH benchmarks to predict expected CTR, CPC, CPM, reach and impressions

4. TIMING STRATEGY: Leverage GFH weekly data to recommend optimal campaign timing

5. ACTIONABLE RECOMMENDATIONS: Provide specific next steps based on GFH learnings

Respond in this JSON format:
{
  "insights": [
    {
      "type": "platform|market|timing|budget|performance",
      "priority": "high|medium|low", 
      "title": "Clear insight title",
      "message": "Detailed message with specific GFH data references",
      "recommendation": "Actionable recommendation",
      "gfhEvidence": "Specific data from GFH campaigns supporting this insight"
    }
  ],
  "forecasts": {
    "expectedCTR": 0.000,
    "expectedCPC": 0.00,
    "expectedCPM": 0.00,
    "expectedReach": 0,
    "expectedImpressions": 0,
    "confidenceLevel": "high|medium|low"
  },
  "recommendations": [
    "Specific actionable recommendations based on GFH data"
  ]
}

Reference specific campaigns, performance metrics, and time periods from the provided GFH data.`;

    console.log('🤖 Sending prompt to Ollama for campaign analysis...');
    
    // Call Ollama through AI service
    const aiAnalysis = await aiService.analyzeCampaignWithOllama(prompt);
    
    console.log('✅ Ollama analysis completed');

    res.json({
      success: true,
      analysis: aiAnalysis,
      dataSource: {
        campaignsAnalyzed: relevantCampaigns.length,
        totalGFHCampaigns: GFH_CAMPAIGN_DATA.length,
        weeklyDataPoints: GFH_WEEKLY_DATA.length,
        markets: [...new Set(relevantCampaigns.map(c => c.market))],
        platforms: [...new Set(relevantCampaigns.map(c => c.platform))]
      },
      ollamaPowered: true
    });

  } catch (error) {
    console.error('❌ Campaign analysis error:', error);
    
    // Return fallback when Ollama is unavailable
    res.json({
      success: false,
      analysis: {
        insights: [{
          type: 'system',
          priority: 'high',
          title: 'Ollama AI Unavailable',
          message: 'Campaign Assistant requires Ollama AI service running on localhost:11434 with the mistral model to analyze GFH data and provide intelligent insights.',
          recommendation: 'Start Ollama service: "ollama serve" and "ollama pull mistral" to enable AI-powered campaign analysis.',
          gfhEvidence: 'AI service connection failed'
        }],
        forecasts: {
          expectedCTR: 0.015,
          expectedCPC: 0.20,
          expectedCPM: 3.50,
          expectedReach: budget * 1000,
          expectedImpressions: budget * 5000,
          confidenceLevel: 'low'
        },
        recommendations: [
          'Install Ollama AI: https://ollama.ai/',
          'Run: ollama serve',
          'Run: ollama pull mistral',
          'Restart application for AI-powered insights'
        ]
      },
      dataSource: {
        campaignsAnalyzed: 0,
        totalGFHCampaigns: GFH_CAMPAIGN_DATA.length,
        weeklyDataPoints: GFH_WEEKLY_DATA.length,
        markets: [],
        platforms: []
      },
      ollamaPowered: false,
      error: error.message
    });
  }
});

// POST /api/campaign-assistant/ask - Ask specific questions about GFH data
router.post('/ask', async (req, res) => {
  try {
    const { question } = req.body;

    if (!question?.trim()) {
      return res.status(400).json({ error: 'Question is required' });
    }

    const prompt = `You are a GFH Campaign Data Expert powered by Ollama. Answer this question using ONLY the actual GFH performance data provided.

QUESTION: ${question}

GFH CAMPAIGN DATA:
${JSON.stringify(GFH_CAMPAIGN_DATA, null, 2)}

GFH WEEKLY DATA:
${JSON.stringify(GFH_WEEKLY_DATA, null, 2)}

INSTRUCTIONS:
- Answer using ONLY the provided GFH data
- Reference specific campaigns, metrics, and performance numbers
- Provide numerical evidence from actual GFH campaigns
- Include actionable insights based on GFH patterns

Response format:
{
  "answer": "Detailed answer with specific GFH data references and numbers",
  "evidence": [
    {
      "campaign": "Campaign name from GFH data",
      "platform": "Platform", 
      "market": "Market",
      "metric": "Performance metric",
      "value": "Actual value from GFH data"
    }
  ],
  "insights": ["Key patterns from GFH data"],
  "recommendations": ["Actionable steps based on GFH performance"]
}`;

    console.log(`🤖 Asking Ollama: "${question}"`);
    
    const aiResponse = await aiService.askGFHQuestion(prompt);
    
    console.log('✅ Ollama answered GFH question');

    res.json({
      success: true,
      response: aiResponse,
      dataSource: 'GFH Campaign Performance Data',
      campaignsAnalyzed: GFH_CAMPAIGN_DATA.length,
      ollamaPowered: true
    });

  } catch (error) {
    console.error('❌ GFH question error:', error);
    
    res.json({
      success: false,
      response: {
        answer: `Ollama AI service is unavailable to analyze GFH data. Please ensure Ollama is running locally with the mistral model to get AI-powered insights from GFH campaign performance data.`,
        evidence: [],
        insights: ['Ollama service required for GFH data analysis'],
        recommendations: ['Start Ollama service and try again']
      },
      dataSource: 'Error - AI unavailable',
      campaignsAnalyzed: 0,
      ollamaPowered: false,
      error: error.message
    });
  }
});

module.exports = router;
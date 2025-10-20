const express = require('express');
const router = express.Router();
const GFHFileAnalyzer = require('../services/gfhFileAnalyzer');

// Initialize the GFH file analyzer
const gfhAnalyzer = new GFHFileAnalyzer();

// POST /api/campaign-assistant/analyze-comprehensive - Full GFH file analysis with Ollama
router.post('/analyze-comprehensive', async (req, res) => {
  try {
    const { question, campaignContext } = req.body;

    if (!question || question.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Question is required',
        example: 'Which platform performs best in Saudi Arabia?'
      });
    }

    console.log('🤖 Starting comprehensive GFH analysis for:', question);
    console.log('📋 Campaign context:', campaignContext);

    // Perform comprehensive analysis using Ollama and actual GFH file
    const analysis = await gfhAnalyzer.analyzeWithOllama(question, campaignContext || {});

    res.json({
      success: true,
      question,
      analysis,
      timestamp: new Date().toISOString(),
      analysisType: 'comprehensive-file-based'
    });

  } catch (error) {
    console.error('❌ Comprehensive analysis error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Analysis failed',
      details: error.message,
      fallback: {
        answer: 'Could not perform comprehensive analysis. Please ensure the GFH Excel file exists and Ollama is running.',
        keyFindings: [{
          finding: 'Analysis service unavailable',
          evidence: error.message,
          dataSource: 'System error'
        }],
        accuracyScore: {
          overall: 0,
          explanation: 'Service unavailable - cannot provide accurate analysis',
          factors: {
            dataCoverage: 0,
            dataQuality: 0,
            relevanceScore: 0,
            confidence: 0
          }
        }
      }
    });
  }
});

// POST /api/campaign-assistant/campaign-analysis - Analyze campaign setup against GFH data
router.post('/campaign-analysis', async (req, res) => {
  try {
    const { budget, duration, countries, platforms, objectives, contentTypes } = req.body;

    if (!budget || !duration || !countries || countries.length === 0) {
      return res.status(400).json({ 
        error: 'Budget, duration, and countries are required for campaign analysis'
      });
    }

    // Create campaign-specific question
    const campaignQuestion = `Analyze a campaign with $${budget} budget, ${duration} days duration, targeting ${countries.join(', ')} markets${platforms && platforms.length > 0 ? ` using ${platforms.join(', ')} platforms` : ''}. What are the expected performance metrics (CTR, CPC, CPM, reach) based on historical GFH data? Provide specific recommendations for optimization.`;

    const campaignContext = {
      budget,
      duration,
      countries,
      platforms: platforms || [],
      objectives: objectives || [],
      contentTypes: contentTypes || [],
      analysisType: 'campaign-setup'
    };

    console.log('🎯 Analyzing campaign setup against GFH data');

    // Use comprehensive analyzer for campaign analysis
    const analysis = await gfhAnalyzer.analyzeWithOllama(campaignQuestion, campaignContext);

    res.json({
      success: true,
      campaignSetup: {
        budget,
        duration,
        countries,
        platforms,
        objectives,
        contentTypes
      },
      analysis,
      timestamp: new Date().toISOString(),
      analysisType: 'campaign-optimization'
    });

  } catch (error) {
    console.error('❌ Campaign analysis error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Campaign analysis failed',
      details: error.message
    });
  }
});

// GET /api/campaign-assistant/gfh-file-info - Get GFH file information
router.get('/gfh-file-info', async (req, res) => {
  try {
    const fileInfo = await gfhAnalyzer.getFileInfo();
    
    res.json({
      success: true,
      fileInfo,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ File info error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Could not get file information',
      details: error.message
    });
  }
});

// POST /api/campaign-assistant/quick-question - Quick analysis for specific questions
router.post('/quick-question', async (req, res) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    // Use lightweight context for quick questions
    const quickContext = {
      analysisType: 'quick-question',
      requestTime: new Date().toISOString()
    };

    const analysis = await gfhAnalyzer.analyzeWithOllama(question, quickContext);

    res.json({
      success: true,
      question,
      analysis,
      timestamp: new Date().toISOString(),
      analysisType: 'quick-response'
    });

  } catch (error) {
    console.error('❌ Quick question error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Quick analysis failed',
      details: error.message
    });
  }
});

// POST /api/campaign-assistant/batch-analysis - Analyze multiple questions
router.post('/batch-analysis', async (req, res) => {
  try {
    const { questions } = req.body;

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ 
        error: 'Questions array is required',
        example: { questions: ['What is the best platform?', 'Which market has lowest CPC?'] }
      });
    }

    if (questions.length > 5) {
      return res.status(400).json({ 
        error: 'Maximum 5 questions allowed per batch'
      });
    }

    console.log(`🔄 Processing batch of ${questions.length} questions`);

    const batchResults = [];
    
    // Process questions sequentially to avoid overwhelming Ollama
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      
      try {
        const analysis = await gfhAnalyzer.analyzeWithOllama(question, {
          batchAnalysis: true,
          questionIndex: i + 1,
          totalQuestions: questions.length
        });

        batchResults.push({
          questionIndex: i + 1,
          question,
          analysis,
          success: true
        });

        console.log(`✅ Completed question ${i + 1}/${questions.length}`);
        
      } catch (questionError) {
        console.error(`❌ Error on question ${i + 1}:`, questionError);
        
        batchResults.push({
          questionIndex: i + 1,
          question,
          analysis: {
            answer: `Analysis failed: ${questionError.message}`,
            accuracyScore: { overall: 0, explanation: 'Question analysis failed' }
          },
          success: false,
          error: questionError.message
        });
      }
    }

    const successCount = batchResults.filter(r => r.success).length;
    const avgAccuracy = batchResults
      .filter(r => r.success)
      .reduce((sum, r) => sum + (r.analysis.accuracyScore?.overall || 0), 0) / Math.max(successCount, 1);

    res.json({
      success: true,
      batchSummary: {
        totalQuestions: questions.length,
        successfulAnalyses: successCount,
        failedAnalyses: questions.length - successCount,
        averageAccuracy: Math.round(avgAccuracy)
      },
      results: batchResults,
      timestamp: new Date().toISOString(),
      analysisType: 'batch-analysis'
    });

  } catch (error) {
    console.error('❌ Batch analysis error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Batch analysis failed',
      details: error.message
    });
  }
});

module.exports = router;
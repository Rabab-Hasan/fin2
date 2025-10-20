// Enhanced Campaign Assistant API Client - Comprehensive GFH file analysis with Ollama
import secureApiClient from './secure-api-client';

interface EnhancedCampaignAnalysis {
  answer: string;
  keyFindings: Array<{
    finding: string;
    evidence: string;
    dataSource: string;
  }>;
  dataAnalysis: {
    totalRecordsAnalyzed: number;
    relevantRecords: number;
    sheetsAnalyzed: string[];
    dateRange: string;
    platforms: string[];
    markets: string[];
  };
  recommendations: string[];
  accuracyScore: {
    overall: number;
    explanation: string;
    factors: {
      dataCoverage: number;
      dataQuality: number;
      relevanceScore: number;
      confidence: number;
    };
  };
  dataSource: {
    fileName: string;
    fileSize: string;
    lastModified: string;
    totalSheets: number;
  };
}

interface CampaignSetup {
  budget: number;
  duration: number;
  countries: string[];
  platforms: string[];
  objectives?: string[];
  contentTypes?: string[];
}

interface BatchAnalysisResult {
  questionIndex: number;
  question: string;
  analysis: EnhancedCampaignAnalysis;
  success: boolean;
  error?: string;
}

interface GFHFileInfo {
  exists: boolean;
  path?: string;
  size?: number;
  sizeFormatted?: string;
  modified?: string;
  sheets?: string[];
  sheetCount?: number;
  error?: string;
}

class EnhancedCampaignAssistantAPI {
  private baseURL = '/api/enhanced-campaign-assistant';

  /**
   * Get comprehensive analysis using actual GFH file and Ollama AI
   */
  async analyzeQuestion(question: string, campaignContext: any = {}): Promise<{
    success: boolean;
    question: string;
    analysis: EnhancedCampaignAnalysis;
    timestamp: string;
    analysisType: string;
  }> {
    try {
      console.log('🤖 Requesting comprehensive GFH analysis for:', question);
      
      const response = await secureApiClient.post(`${this.baseURL}/analyze-comprehensive`, {
        question,
        campaignContext
      });
      
      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Enhanced analysis received with accuracy:', result.analysis?.accuracyScore?.overall || 0);
      
      return result;
    } catch (error) {
      console.error('❌ Enhanced analysis error:', error);
      
      // Return comprehensive fallback
      return {
        success: false,
        question,
        analysis: {
          answer: `Enhanced analysis failed: ${error.message}. Please ensure Ollama is running on localhost:11434 with the mistral model, and the GFH Excel file is accessible.`,
          keyFindings: [{
            finding: 'AI service unavailable',
            evidence: `Error: ${error.message}`,
            dataSource: 'System error'
          }],
          dataAnalysis: {
            totalRecordsAnalyzed: 0,
            relevantRecords: 0,
            sheetsAnalyzed: [],
            dateRange: 'Unavailable',
            platforms: [],
            markets: []
          },
          recommendations: [
            'Start Ollama service: ollama serve',
            'Install mistral model: ollama pull mistral',
            'Verify GFH Excel file exists and is readable',
            'Check backend server logs for detailed errors'
          ],
          accuracyScore: {
            overall: 0,
            explanation: 'Analysis service unavailable - cannot provide accurate insights',
            factors: {
              dataCoverage: 0,
              dataQuality: 0,
              relevanceScore: 0,
              confidence: 0
            }
          },
          dataSource: {
            fileName: 'GFH - Weekly Campaign performance.xlsx',
            fileSize: 'Unknown',
            lastModified: 'Unknown',
            totalSheets: 0
          }
        },
        timestamp: new Date().toISOString(),
        analysisType: 'error-fallback'
      };
    }
  }

  /**
   * Analyze campaign setup against comprehensive GFH data
   */
  async analyzeCampaignSetup(setup: CampaignSetup): Promise<{
    success: boolean;
    campaignSetup: CampaignSetup;
    analysis: EnhancedCampaignAnalysis;
    timestamp: string;
    analysisType: string;
  }> {
    try {
      console.log('🎯 Analyzing campaign setup against full GFH dataset:', setup);
      
      const response = await secureApiClient.post(`${this.baseURL}/campaign-analysis`, setup);
      
      if (!response.ok) {
        throw new Error(`Campaign analysis failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Campaign analysis completed with accuracy:', result.analysis?.accuracyScore?.overall || 0);
      
      return result;
    } catch (error) {
      console.error('❌ Campaign analysis error:', error);
      throw error;
    }
  }

  /**
   * Get GFH file information and status
   */
  async getGFHFileInfo(): Promise<{
    success: boolean;
    fileInfo: GFHFileInfo;
    timestamp: string;
  }> {
    try {
      const response = await secureApiClient.get(`${this.baseURL}/gfh-file-info`);
      
      if (!response.ok) {
        throw new Error(`File info request failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ File info error:', error);
      
      return {
        success: false,
        fileInfo: {
          exists: false,
          error: error.message
        },
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Quick question analysis with lightweight processing
   */
  async askQuickQuestion(question: string): Promise<{
    success: boolean;
    question: string;
    analysis: EnhancedCampaignAnalysis;
    timestamp: string;
    analysisType: string;
  }> {
    try {
      console.log('⚡ Processing quick question:', question);
      
      const response = await secureApiClient.post(`${this.baseURL}/quick-question`, {
        question
      });
      
      if (!response.ok) {
        throw new Error(`Quick analysis failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Quick analysis completed');
      
      return result;
    } catch (error) {
      console.error('❌ Quick question error:', error);
      throw error;
    }
  }

  /**
   * Batch analysis for multiple questions
   */
  async analyzeBatch(questions: string[]): Promise<{
    success: boolean;
    batchSummary: {
      totalQuestions: number;
      successfulAnalyses: number;
      failedAnalyses: number;
      averageAccuracy: number;
    };
    results: BatchAnalysisResult[];
    timestamp: string;
    analysisType: string;
  }> {
    try {
      console.log(`🔄 Processing batch of ${questions.length} questions`);
      
      const response = await secureApiClient.post(`${this.baseURL}/batch-analysis`, {
        questions
      });
      
      if (!response.ok) {
        throw new Error(`Batch analysis failed: ${response.status}`);
      }

      const result = await response.json();
      console.log(`✅ Batch analysis completed: ${result.batchSummary?.successfulAnalyses || 0}/${questions.length} successful`);
      
      return result;
    } catch (error) {
      console.error('❌ Batch analysis error:', error);
      throw error;
    }
  }

  /**
   * Helper method to get accuracy score color for UI
   */
  getAccuracyColor(score: number): string {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 70) return 'text-blue-600 bg-blue-100';
    if (score >= 50) return 'text-yellow-600 bg-yellow-100';
    if (score >= 30) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  }

  /**
   * Helper method to format accuracy explanation
   */
  formatAccuracyExplanation(accuracyScore: EnhancedCampaignAnalysis['accuracyScore']): string {
    const { overall, factors, explanation } = accuracyScore;
    
    return `${explanation}\n\nFactors:\n• Data Coverage: ${factors.dataCoverage}%\n• Data Quality: ${factors.dataQuality}/10\n• Relevance Score: ${factors.relevanceScore}/10\n• Confidence: ${factors.confidence}/10\n\nOverall Score: ${overall}%`;
  }

  /**
   * Helper method to get recommended questions based on GFH data
   */
  getSuggestedQuestions(): string[] {
    return [
      'Which platform has the best CTR performance in Saudi Arabia?',
      'What is the optimal budget allocation across GCC markets?',
      'How does campaign performance vary by week in the GFH data?',
      'Which market has the lowest cost per click (CPC)?',
      'What are the best performing campaign types by platform?',
      'How do impression volumes correlate with spending in different markets?',
      'What is the optimal campaign duration based on GFH performance data?',
      'Which platforms show the highest ROI in the Middle East region?',
      'How do seasonal patterns affect campaign performance?',
      'What are the key performance benchmarks for financial services campaigns?'
    ];
  }

  /**
   * Helper method to validate campaign setup before analysis
   */
  validateCampaignSetup(setup: CampaignSetup): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!setup.budget || setup.budget <= 0) {
      errors.push('Budget must be greater than 0');
    }
    
    if (!setup.duration || setup.duration <= 0) {
      errors.push('Duration must be greater than 0');
    }
    
    if (!setup.countries || setup.countries.length === 0) {
      errors.push('At least one target country is required');
    }
    
    if (setup.budget && setup.budget > 1000000) {
      errors.push('Budget seems unusually high - please verify');
    }
    
    if (setup.duration && setup.duration > 365) {
      errors.push('Campaign duration over 1 year is unusual - please verify');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Export singleton instance
export const enhancedCampaignAssistantAPI = new EnhancedCampaignAssistantAPI();

// Export types
export type {
  EnhancedCampaignAnalysis,
  CampaignSetup,
  BatchAnalysisResult,
  GFHFileInfo
};
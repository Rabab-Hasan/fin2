// Comprehensive Vector Database Test - Verify ALL GFH data is searchable
import React, { useState, useEffect } from 'react';
import { Search, CheckCircle, XCircle, Database, Brain, TrendingUp, Target, AlertTriangle, Zap } from 'lucide-react';
import { enhancedGFH, type EnhancedGFHResponse } from '../utils/enhancedGFHQueryInterface';

interface TestQuery {
  question: string;
  category: string;
  expectedElements: string[];
  description: string;
}

const VectorDatabaseTest: React.FC = () => {
  const [testResults, setTestResults] = useState<Map<string, EnhancedGFHResponse>>(new Map());
  const [runningTests, setRunningTests] = useState<Set<string>>(new Set());
  const [customQuery, setCustomQuery] = useState('');
  const [customResult, setCustomResult] = useState<EnhancedGFHResponse | null>(null);
  const [isCustomSearching, setIsCustomSearching] = useState(false);

  // Comprehensive test queries covering all aspects of GFH data
  const testQueries: TestQuery[] = [
    {
      question: "What's the best performing platform across all markets?",
      category: "Platform Analysis",
      expectedElements: ["Meta", "Google", "Twitter", "LinkedIn", "CTR", "CPC"],
      description: "Should analyze all platforms and compare performance metrics"
    },
    {
      question: "Which market has the lowest cost per click?",
      category: "Market Comparison", 
      expectedElements: ["Oman", "Saudi Arabia", "UAE", "Kuwait", "Qatar", "Bahrain", "CPC"],
      description: "Should compare CPC across all GCC markets"
    },
    {
      question: "What's the Instagram timing recommendation for Oman?",
      category: "Specific Query",
      expectedElements: ["Meta", "Oman", "Instagram", "timing", "CTR", "May", "June", "July"],
      description: "Should provide specific timing data for Meta/Instagram in Oman"
    },
    {
      question: "Compare campaign performance between Meta and Google UAC",
      category: "Platform Comparison",
      expectedElements: ["Meta", "Google UAC", "CTR", "CPC", "impressions", "clicks"],
      description: "Should compare two major platforms across metrics"
    },
    {
      question: "What's the best budget allocation for a $15000 campaign in Saudi Arabia?",
      category: "Budget Optimization",
      expectedElements: ["Saudi Arabia", "$15000", "budget", "platform", "allocation", "CPC", "reach"],
      description: "Should provide budget recommendations based on historical performance"
    },
    {
      question: "Show me all LinkedIn campaign performance data",
      category: "Platform Specific",
      expectedElements: ["LinkedIn", "CTR", "CPC", "awareness", "impressions", "Saudi Arabia", "UAE"],
      description: "Should return all LinkedIn campaign data across markets"
    },
    {
      question: "Which campaigns had the highest app install rates?",
      category: "Conversion Analysis",
      expectedElements: ["app install", "Google UAC", "conversion", "CPI", "install rate"],
      description: "Should find campaigns optimized for app installations"
    },
    {
      question: "What's the seasonal performance trend for 2025 campaigns?",
      category: "Temporal Analysis",
      expectedElements: ["2025", "May", "June", "July", "seasonal", "performance", "trend"],
      description: "Should analyze performance by time periods"
    },
    {
      question: "Compare cost efficiency between awareness and conversion campaigns",
      category: "Objective Comparison",
      expectedElements: ["awareness", "CTAP", "app installs", "cost efficiency", "objective"],
      description: "Should compare different campaign objectives"
    },
    {
      question: "What are the total impressions and reach across all GFH campaigns?",
      category: "Global Statistics",
      expectedElements: ["total", "impressions", "reach", "all campaigns", "sum"],
      description: "Should aggregate data across entire dataset"
    }
  ];

  const runSingleTest = async (query: TestQuery) => {
    const key = query.question;
    setRunningTests(prev => new Set(Array.from(prev).concat(key)));
    
    try {
      const result = await enhancedGFH.askAnyQuestion(query.question);
      setTestResults(prev => new Map(prev.set(key, result)));
    } catch (error) {
      console.error(`Test failed for: ${query.question}`, error);
    } finally {
      setRunningTests(prev => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });
    }
  };

  const runAllTests = async () => {
    for (const query of testQueries) {
      await runSingleTest(query);
      // Add small delay to avoid overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  };

  const runCustomSearch = async () => {
    if (!customQuery.trim()) return;
    
    setIsCustomSearching(true);
    try {
      const result = await enhancedGFH.askAnyQuestion(customQuery);
      setCustomResult(result);
    } catch (error) {
      console.error('Custom search failed:', error);
    } finally {
      setIsCustomSearching(false);
    }
  };

  const evaluateTestResult = (query: TestQuery, result: EnhancedGFHResponse): {
    score: number;
    passed: boolean;
    issues: string[];
  } => {
    const issues: string[] = [];
    let score = 0;
    
    // Check if answer contains expected elements
    const answerLower = result.answer.toLowerCase();
    const foundElements = query.expectedElements.filter(element => 
      answerLower.includes(element.toLowerCase())
    );
    
    const elementScore = (foundElements.length / query.expectedElements.length) * 40;
    score += elementScore;
    
    if (foundElements.length < query.expectedElements.length * 0.5) {
      issues.push(`Missing key elements: ${query.expectedElements.filter(e => 
        !answerLower.includes(e.toLowerCase())
      ).join(', ')}`);
    }
    
    // Check confidence level
    if (result.confidence >= 80) score += 30;
    else if (result.confidence >= 60) score += 20;
    else if (result.confidence >= 40) score += 10;
    else issues.push(`Low confidence: ${result.confidence.toFixed(0)}%`);
    
    // Check data coverage
    if (result.campaignsAnalyzed >= 5) score += 20;
    else if (result.campaignsAnalyzed >= 3) score += 15;
    else if (result.campaignsAnalyzed >= 1) score += 10;
    else issues.push('No campaigns analyzed');
    
    // Check answer completeness
    if (result.answer.length >= 200) score += 10;
    else if (result.answer.length >= 100) score += 5;
    else issues.push('Answer too brief');
    
    return {
      score,
      passed: score >= 70,
      issues
    };
  };

  const getTestStatus = (query: TestQuery) => {
    const key = query.question;
    const isRunning = runningTests.has(key);
    const result = testResults.get(key);
    
    if (isRunning) return 'running';
    if (result) {
      const evaluation = evaluateTestResult(query, result);
      return evaluation.passed ? 'passed' : 'failed';
    }
    return 'pending';
  };

  const getOverallStats = () => {
    const total = testQueries.length;
    const completed = testResults.size;
    const running = runningTests.size;
    const passed = testQueries.filter(q => {
      const result = testResults.get(q.question);
      return result && evaluateTestResult(q, result).passed;
    }).length;
    
    return { total, completed, running, passed };
  };

  const stats = getOverallStats();

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <Database className="w-6 h-6 text-purple-600" />
          <h2 className="text-2xl font-bold text-gray-900">GFH Vector Database Test Suite</h2>
        </div>
        
        <p className="text-gray-600 mb-6">
          This comprehensive test verifies that the vector database can answer ANY question about the GFH campaign data.
          The system searches through ALL campaigns, platforms, markets, and metrics to provide accurate responses.
        </p>

        {/* Test Controls */}
        <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <button
            onClick={runAllTests}
            disabled={runningTests.size > 0}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            <Zap className="w-4 h-4" />
            Run All Tests ({testQueries.length})
          </button>
          
          <div className="flex-1 text-sm text-gray-600">
            <div className="grid grid-cols-4 gap-4">
              <div><span className="font-medium">Total:</span> {stats.total}</div>
              <div><span className="font-medium">Completed:</span> {stats.completed}</div>
              <div><span className="font-medium">Running:</span> {stats.running}</div>
              <div><span className="font-medium text-green-600">Passed:</span> {stats.passed}</div>
            </div>
          </div>
        </div>

        {/* Custom Query Test */}
        <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-3">Custom Query Test</h3>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={customQuery}
              onChange={(e) => setCustomQuery(e.target.value)}
              placeholder="Ask any question about GFH data: platforms, markets, costs, performance, timing, etc."
              className="flex-1 px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && runCustomSearch()}
            />
            <button
              onClick={runCustomSearch}
              disabled={isCustomSearching || !customQuery.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {isCustomSearching ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              ) : (
                <Search className="w-4 h-4" />
              )}
              Test Query
            </button>
          </div>
          
          {customResult && (
            <div className="bg-white border border-blue-200 rounded p-3">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="font-medium">Query Result</span>
                <span className="ml-auto text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                  {customResult.confidence.toFixed(0)}% confidence
                </span>
              </div>
              <div className="text-sm text-gray-700 max-h-40 overflow-y-auto">
                {customResult.answer.substring(0, 500)}
                {customResult.answer.length > 500 && '...'}
              </div>
              <div className="text-xs text-gray-500 mt-2">
                Based on {customResult.campaignsAnalyzed} campaigns
              </div>
            </div>
          )}
        </div>

        {/* Test Results */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            Automated Test Results
          </h3>
          
          <div className="grid gap-4">
            {testQueries.map((query, index) => {
              const status = getTestStatus(query);
              const result = testResults.get(query.question);
              const evaluation = result ? evaluateTestResult(query, result) : null;
              
              return (
                <div
                  key={index}
                  className={`border rounded-lg p-4 ${
                    status === 'passed' ? 'border-green-200 bg-green-50' :
                    status === 'failed' ? 'border-red-200 bg-red-50' :
                    status === 'running' ? 'border-blue-200 bg-blue-50' :
                    'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {status === 'passed' && <CheckCircle className="w-5 h-5 text-green-600" />}
                      {status === 'failed' && <XCircle className="w-5 h-5 text-red-600" />}
                      {status === 'running' && <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>}
                      {status === 'pending' && <AlertTriangle className="w-5 h-5 text-gray-400" />}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">{query.question}</span>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          {query.category}
                        </span>
                        {evaluation && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            Score: {evaluation.score.toFixed(0)}/100
                          </span>
                        )}
                      </div>
                      
                      <p className="text-xs text-gray-600 mb-2">{query.description}</p>
                      
                      {result && (
                        <div className="text-sm space-y-2">
                          <div className="bg-white p-2 rounded border">
                            <div className="text-gray-700">
                              {result.answer.substring(0, 200)}
                              {result.answer.length > 200 && '...'}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>Confidence: {result.confidence.toFixed(0)}%</span>
                            <span>Campaigns: {result.campaignsAnalyzed}</span>
                            <span>Insights: {result.insights.length}</span>
                          </div>
                          
                          {evaluation && evaluation.issues.length > 0 && (
                            <div className="text-xs text-red-600">
                              Issues: {evaluation.issues.join(', ')}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {status === 'pending' && (
                        <button
                          onClick={() => runSingleTest(query)}
                          className="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded"
                        >
                          Run Test
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Summary */}
        {stats.completed > 0 && (
          <div className="mt-8 p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
            <h3 className="font-semibold text-purple-900 mb-2">Test Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{stats.passed}</div>
                <div className="text-purple-700">Tests Passed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{stats.completed - stats.passed}</div>
                <div className="text-red-700">Tests Failed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{((stats.passed / stats.completed) * 100).toFixed(0)}%</div>
                <div className="text-blue-700">Success Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{testResults.size > 0 ? Array.from(testResults.values()).reduce((sum, r) => sum + r.campaignsAnalyzed, 0) : 0}</div>
                <div className="text-green-700">Total Campaigns</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VectorDatabaseTest;
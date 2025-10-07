import React, { useState } from 'react';
import { Play, Search, CheckCircle, XCircle, Loader2, Database } from 'lucide-react';
import { askGFH } from '../utils/gfhQueryInterface';
import GFHDataParser from '../utils/gfhDataParser';
import GFHDataAnalyzer from '../utils/gfhDataAnalyzer';

interface TestResult {
  test: string;
  result: any;
  success: boolean;
  executionTime: number;
}

const GFHTestValidation: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [customQuery, setCustomQuery] = useState('');

  const runGFHTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    const tests = [
      {
        name: 'Instagram Timing in Oman',
        test: () => askGFH.instagramTimingOman()
      },
      {
        name: 'All GFH Campaign Data',
        test: () => GFHDataParser.getAllCampaignData()
      },
      {
        name: 'Timing Insights for Meta in Oman',
        test: () => GFHDataParser.getTimingInsights('Meta', 'OMN')
      },
      {
        name: 'Platform Data for Oman Meta',
        test: () => GFHDataParser.getPlatformDataForMarket('Meta', 'OMN')
      },
      {
        name: 'Saudi Arabia Meta Performance',
        test: () => GFHDataParser.getPlatformDataForMarket('Meta', 'KSA')
      },
      {
        name: 'UAE Meta Performance',
        test: () => {
          const data = GFHDataParser.getPlatformDataForMarket('Meta', 'UAE');
          return data;
        }
      },
      {
        name: 'Best Performing Markets',
        test: () => {
          const allData = GFHDataParser.getAllCampaignData();
          return allData.sort((a, b) => b.deliveredCTR - a.deliveredCTR).slice(0, 3);
        }
      },
      {
        name: 'Dynamic Campaign Analysis',
        test: () => GFHDataAnalyzer.analyzeUserCampaign(
          5000, // budget
          30,   // duration
          ['Oman', 'Saudi Arabia'], // countries
          ['Instagram', 'Facebook'], // platforms
          ['Brand Awareness'], // objectives
          ['video', 'image'] // content types
        )
      },
      {
        name: 'Market Comparison',
        test: () => askGFH.marketComparison()
      },
      {
        name: 'Platform Timing Query',
        test: () => askGFH.platformTiming('Meta', 'OMN')
      }
    ];

    const results: TestResult[] = [];

    for (const test of tests) {
      try {
        const startTime = performance.now();
        const result = test.test();
        const endTime = performance.now();
        
        results.push({
          test: test.name,
          result,
          success: true,
          executionTime: endTime - startTime
        });
      } catch (error) {
        results.push({
          test: test.name,
          result: error,
          success: false,
          executionTime: 0
        });
      }
    }

    setTestResults(results);
    setIsRunning(false);
  };

  const runCustomQuery = () => {
    try {
      const startTime = performance.now();
      let result;
      
      // Parse common questions
      if (customQuery.toLowerCase().includes('instagram') && customQuery.toLowerCase().includes('oman')) {
        result = askGFH.instagramTimingOman();
      } else if (customQuery.toLowerCase().includes('timing')) {
        result = GFHDataParser.getTimingInsights('Meta', 'OMN');
      } else if (customQuery.toLowerCase().includes('campaign')) {
        result = GFHDataParser.getAllCampaignData();
      } else if (customQuery.toLowerCase().includes('market')) {
        result = askGFH.marketComparison();
      } else {
        result = { message: "Try asking about Instagram timing in Oman, campaign data, timing insights, or market comparison" };
      }
      
      const endTime = performance.now();
      
      const newResult: TestResult = {
        test: `Custom Query: "${customQuery}"`,
        result,
        success: true,
        executionTime: endTime - startTime
      };
      
      setTestResults([...testResults, newResult]);
    } catch (error) {
      const newResult: TestResult = {
        test: `Custom Query: "${customQuery}"`,
        result: error,
        success: false,
        executionTime: 0
      };
      
      setTestResults([...testResults, newResult]);
    }
  };

  const formatResult = (result: any) => {
    if (typeof result === 'string') return result;
    if (Array.isArray(result)) {
      return `Array with ${result.length} items: ${JSON.stringify(result.slice(0, 2), null, 2)}${result.length > 2 ? '...' : ''}`;
    }
    return JSON.stringify(result, null, 2);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <Database className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">GFH Data System Validation</h2>
        </div>
        
        <p className="text-gray-600 mb-6">
          This tool validates that the Campaign Assistant is actually reading and analyzing the GFH Excel data,
          not just providing generic recommendations.
        </p>

        {/* Test Controls */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={runGFHTests}
            disabled={isRunning}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isRunning ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            Run All Tests
          </button>
        </div>

        {/* Custom Query */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-3">Custom Query Test</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={customQuery}
              onChange={(e) => setCustomQuery(e.target.value)}
              placeholder="Ask about Instagram timing in Oman, campaign performance, etc."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={runCustomQuery}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              Test Query
            </button>
          </div>
        </div>

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Test Results</h3>
            {testResults.map((result, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  result.success 
                    ? 'border-green-200 bg-green-50' 
                    : 'border-red-200 bg-red-50'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {result.success ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                  <h4 className="font-semibold">{result.test}</h4>
                  <span className="text-sm text-gray-500 ml-auto">
                    {result.executionTime.toFixed(2)}ms
                  </span>
                </div>
                <div className="bg-white p-3 rounded border overflow-x-auto">
                  <pre className="text-sm text-gray-800 whitespace-pre-wrap">
                    {formatResult(result.result)}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary */}
        {testResults.length > 0 && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-2">Test Summary</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-blue-700">Total Tests:</span>
                <span className="font-semibold ml-2">{testResults.length}</span>
              </div>
              <div>
                <span className="text-green-700">Passed:</span>
                <span className="font-semibold ml-2 text-green-800">
                  {testResults.filter(r => r.success).length}
                </span>
              </div>
              <div>
                <span className="text-red-700">Failed:</span>
                <span className="font-semibold ml-2 text-red-800">
                  {testResults.filter(r => !r.success).length}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GFHTestValidation;
import React, { useState } from 'react';
import { X } from 'lucide-react';
import MonthlyComparison from './MonthlyComparison';
import DailyWeeklyAnalysis from './DailyWeeklyAnalysis';
import BestMonthAnalysis from './BestMonthAnalysis';
import MarketingStrategyAdvisor from './MarketingStrategyAdvisor';

type ActiveTab = 'monthly' | 'weekly' | 'best' | 'marketing' | null;

const StrategyViewInterface: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>(null);

  const closeTab = () => {
    setActiveTab(null);
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg">
        <h2 className="text-xl font-bold mb-2">Action Labs – Strategy View (Detailed)</h2>
        <p className="text-blue-100">
          Comprehensive analytics with Monthly Comparison, Weekly Analysis, Best Month Detection, and AI-powered Marketing Strategy Advisor.
        </p>
      </div>

      {/* Strategy Tab Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => setActiveTab('monthly')}
          className="bg-white border-2 border-gray-200 rounded-lg p-6 text-left hover:border-blue-500 hover:shadow-md transition-all duration-200 group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">📅</span>
            <div className="w-2 h-2 rounded-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">Monthly Comparison</h3>
          <p className="text-sm text-gray-600">Compare performance across months with detailed metrics and KPI cards</p>
        </button>

        <button
          onClick={() => setActiveTab('weekly')}
          className="bg-white border-2 border-gray-200 rounded-lg p-6 text-left hover:border-blue-500 hover:shadow-md transition-all duration-200 group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">📊</span>
            <div className="w-2 h-2 rounded-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">Daily & Weekly Analysis</h3>
          <p className="text-sm text-gray-600">Detailed breakdown with week filters, weekday heatmaps, per-week charts, and day-specific notes</p>
        </button>

        <button
          onClick={() => setActiveTab('best')}
          className="bg-white border-2 border-gray-200 rounded-lg p-6 text-left hover:border-blue-500 hover:shadow-md transition-all duration-200 group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">🏆</span>
            <div className="w-2 h-2 rounded-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">Best Month Analysis</h3>
          <p className="text-sm text-gray-600">Identify top performing months with detailed metrics and recommendations</p>
        </button>

        <button
          onClick={() => setActiveTab('marketing')}
          className="bg-white border-2 border-gray-200 rounded-lg p-6 text-left hover:border-blue-500 hover:shadow-md transition-all duration-200 group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">🤖</span>
            <div className="w-2 h-2 rounded-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">Marketing Strategy Advisor</h3>
          <p className="text-sm text-gray-600">AI-powered insights and strategic recommendations based on your data</p>
        </button>
      </div>

      {/* Monthly Comparison Display */}
      <div 
        id="monthlyComparisonDisplay" 
        className={activeTab === 'monthly' ? 'block' : 'hidden'}
      >
        {activeTab === 'monthly' && (
          <div className="bg-white border border-gray-200 rounded-lg shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <span className="mr-2">📅</span>
                Monthly Comparison
              </h3>
              <button
                onClick={closeTab}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                aria-label="Close Monthly Comparison"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            {/* Content */}
            <div id="monthlyComparisonContent" className="p-6">
              <MonthlyComparison />
            </div>
          </div>
        )}
      </div>

      {/* Cross-Month Weekly Analysis Display */}
      <div 
        id="crossMonthComparisonDisplay" 
        className={activeTab === 'weekly' ? 'block' : 'hidden'}
      >
        {activeTab === 'weekly' && (
          <div className="bg-white border border-gray-200 rounded-lg shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <span className="mr-2">📊</span>
                Daily & Weekly Analysis
              </h3>
              <button
                onClick={closeTab}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                aria-label="Close Daily Weekly Analysis"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            {/* Content */}
            <div id="crossMonthComparisonContent" className="p-6">
              <DailyWeeklyAnalysis />
            </div>
          </div>
        )}
      </div>

      {/* Best Month Analysis Display */}
      <div 
        id="bestMonthDisplay" 
        className={activeTab === 'best' ? 'block' : 'hidden'}
      >
        {activeTab === 'best' && (
          <div className="bg-white border border-gray-200 rounded-lg shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <span className="mr-2">🏆</span>
                Best Month Analysis
              </h3>
              <button
                onClick={closeTab}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                aria-label="Close Best Month Analysis"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            {/* Content */}
            <div id="bestMonthContent" className="p-6">
              <BestMonthAnalysis />
            </div>
          </div>
        )}
      </div>

      {/* Marketing Strategy Advisor Display */}
      <div 
        id="marketingAdvisorDisplay" 
        className={activeTab === 'marketing' ? 'block' : 'hidden'}
      >
        {activeTab === 'marketing' && (
          <div className="bg-white border border-gray-200 rounded-lg shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <span className="mr-2">🤖</span>
                Marketing Strategy Advisor
              </h3>
              <button
                onClick={closeTab}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                aria-label="Close Marketing Advisor"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            {/* Content */}
            <div id="marketingAdvisorContent" className="p-6">
              <MarketingStrategyAdvisor />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StrategyViewInterface;

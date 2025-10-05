
import React from 'react';
import MonthlyComparison from '../components/MonthlyComparison';
import DayPerformanceAnalysis from '../components/DayPerformanceAnalysis';
import { useClient } from '../contexts/ClientContext';
import Card from '../components/Card';

const BusinessDataNew: React.FC = () => {
  const { selectedClient } = useClient();

  if (!selectedClient) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Client Selection Required
            </h3>
            <p className="text-gray-600">
              Please select a client from the home page to view analytics.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Monthly Comparison Section */}
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">📅 Monthly Comparison - Performance Across Months</h1>
          <p className="text-gray-600 mt-1">Analyzing monthly trends for {selectedClient.name}</p>
        </div>
        <MonthlyComparison />
      </div>
      
      {/* Day Performance Analysis Section */}
      <div>
        <DayPerformanceAnalysis />
      </div>
    </div>
  );
};

export default BusinessDataNew;
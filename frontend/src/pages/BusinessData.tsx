
import React from 'react';
import SimpleDataManager from '../components/SimpleDataManager';

const BusinessData: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8 text-center">Monthly Comparison</h1>
      <SimpleDataManager />
    </div>
  );
};

export default BusinessData;

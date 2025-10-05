import React from 'react';
import Card from '../components/Card';

const BusinessData: React.FC = () => {
  return (
    <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-32 py-8">
      <Card>
        <div className="py-8">
          <h1 className="text-3xl font-bold text-green-600 mb-2 text-center">
            ✅ CLEAN BUSINESS DATA PAGE ✅
          </h1>
          <p className="text-green-600 text-center text-xl">
            NO MORE TABLES! NO MORE DATA ENTRY! PURE ANALYTICS ONLY!
          </p>
          <div className="mt-8 p-8 bg-green-100 rounded-lg text-center">
            <h2 className="text-2xl font-bold text-green-800 mb-4">🎉 SUCCESS 🎉</h2>
            <p className="text-green-700">The old data table and import functionality has been completely removed!</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default BusinessData;

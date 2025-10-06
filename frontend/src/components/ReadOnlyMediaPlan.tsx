import React from 'react';
import Card from './Card';
import { useMediaPlan } from '../contexts/MediaPlanContext';

interface ReadOnlyMediaPlanProps {
  title?: string;
}

const ReadOnlyMediaPlan: React.FC<ReadOnlyMediaPlanProps> = ({ 
  title = "Media Plan Overview" 
}) => {
  const {
    cpcRows,
    cpmRows,
    cpcTableShownOnBusinessData,
    cpmTableShownOnBusinessData
  } = useMediaPlan();

  // Exchange rates for currency conversion
  const exchangeRates = {
    'BHD': 2.65,
    'AED': 0.27,
    'SAR': 0.27,
    'KWD': 3.30,
    'QAR': 0.27,
    'OMR': 2.60,
    'USD': 1,
    'EUR': 1.10
  };

  // Calculate totals
  const totalCPCCost = cpcRows.reduce((sum, row) => sum + row.netCost, 0);
  const totalCPMCost = cpmRows.reduce((sum, row) => sum + row.netCost, 0);
  const totalAddressableAudience = cpmRows.reduce((sum, row) => sum + row.addressableAudience, 0);
  const totalReach = cpmRows.reduce((sum, row) => sum + row.reach, 0);
  const totalEstImpressions = cpmRows.reduce((sum, row) => sum + row.estImpressions, 0);

  // Don't render anything if both tables are hidden
  if (!cpcTableShownOnBusinessData && !cpmTableShownOnBusinessData) {
    return null;
  }

  return (
    <Card>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-600 mt-1">
            View-only campaign data - Configure in Media Plan section
          </p>
        </div>

        {/* CPC Table - Read Only */}
        {cpcTableShownOnBusinessData && cpcRows.length > 0 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                Cost Per Click (CPC) Campaigns
              </h3>
              <p className="text-sm text-gray-600">Read-only view of CPC campaign data</p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Channel</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Currency</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target Audience</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Format</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Est. Clicks</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CPC</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net Cost</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {cpcRows.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50">
                      <td className="px-3 py-4 text-sm font-medium text-gray-900">
                        {row.channel}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-600">
                        {row.currency}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-600">
                        <div className="max-w-xs truncate" title={row.targetAudience}>
                          {row.targetAudience}
                        </div>
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-600">
                        {row.format}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-900">
                        {row.estimatedClicks.toLocaleString()}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-900">
                        {row.cpc.toFixed(2)}
                      </td>
                      <td className="px-3 py-4 text-sm font-medium text-gray-900">
                        {row.netCost.toLocaleString()} {row.currency}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* CPC Summary */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Total CPC Campaign Cost</div>
              <div className="text-lg font-semibold text-gray-900">
                {totalCPCCost.toLocaleString()} {cpcRows[0]?.currency || 'BHD'}
              </div>
            </div>
          </div>
        )}

        {/* CPM Table - Read Only */}
        {cpmTableShownOnBusinessData && cpmRows.length > 0 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                Cost Per Thousand Impressions (CPM) Campaigns
              </h3>
              <p className="text-sm text-gray-600">Read-only view of CPM campaign data</p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Channel</th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Currency</th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target Audience</th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Format</th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Impressions</th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reach</th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net Rate</th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net Cost</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {cpmRows.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50">
                      <td className="px-2 py-3 text-xs font-medium text-gray-900">
                        {row.channel}
                      </td>
                      <td className="px-2 py-3 text-xs text-gray-600">
                        {row.currency}
                      </td>
                      <td className="px-2 py-3 text-xs text-gray-600">
                        <div className="max-w-24 truncate" title={row.targetAudience}>
                          {row.targetAudience}
                        </div>
                      </td>
                      <td className="px-2 py-3 text-xs text-gray-600">
                        <div className="max-w-24 truncate" title={row.format}>
                          {row.format}
                        </div>
                      </td>
                      <td className="px-2 py-3 text-xs text-gray-900">
                        {row.estImpressions.toLocaleString()}
                      </td>
                      <td className="px-2 py-3 text-xs text-gray-900">
                        {row.reach.toLocaleString()}
                      </td>
                      <td className="px-2 py-3 text-xs text-gray-900">
                        {row.netRate.toFixed(2)}
                      </td>
                      <td className="px-2 py-3 text-xs font-medium text-gray-900">
                        {row.netCost.toLocaleString()} {row.currency}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* CPM Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-green-50 px-4 py-3 rounded-lg">
                <div className="text-sm text-gray-600">Total Cost</div>
                <div className="text-lg font-semibold text-gray-900">
                  {totalCPMCost.toLocaleString()} {cpmRows[0]?.currency || 'BHD'}
                </div>
              </div>
              <div className="bg-green-50 px-4 py-3 rounded-lg">
                <div className="text-sm text-gray-600">Addressable Audience</div>
                <div className="text-lg font-semibold text-gray-900">
                  {totalAddressableAudience.toLocaleString()}
                </div>
              </div>
              <div className="bg-green-50 px-4 py-3 rounded-lg">
                <div className="text-sm text-gray-600">Total Reach</div>
                <div className="text-lg font-semibold text-gray-900">
                  {totalReach.toLocaleString()}
                </div>
              </div>
              <div className="bg-green-50 px-4 py-3 rounded-lg">
                <div className="text-sm text-gray-600">Total Impressions</div>
                <div className="text-lg font-semibold text-gray-900">
                  {totalEstImpressions.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Note about editing */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-blue-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Read-Only View
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  This is a read-only view of your media plan data. To edit campaigns or modify data, 
                  please go to the <strong>Action Labs → Media Plan</strong> section.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ReadOnlyMediaPlan;
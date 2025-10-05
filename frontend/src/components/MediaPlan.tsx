import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import Card from './Card';
import { useMediaPlan } from '../contexts/MediaPlanContext';

interface CPCRow {
  id: string;
  channel: string;
  currency: string;
  targetAudience: string;
  format: string;
  estimatedClicks: number;
  cpc: number;
  netCost: number;
}

interface CPMRow {
  id: string;
  channel: string;
  currency: string;
  targetAudience: string;
  format: string;
  impressions: number;
  frequencyUser: number;
  frequencyWeek: number;
  addressableAudience: number;
  percentReach: number;
  reach: number;
  estImpressions: number;
  netRate: number;
  netCost: number;
}

interface KPIRow {
  addressableAudience: number;
  percentReach: number;
  reach: number;
  frequency: number;
  durationWeeks: number;
  estImpressions: number;
}

interface InvestmentRow {
  id: string;
  item: string;
  aed: number;
  usd: number;
}

const CHANNELS = [
  'Facebook', 'Instagram', 'X (Twitter)', 'LinkedIn', 'Google Ads', 'TikTok', 'YouTube', 'Snapchat'
];

const CURRENCIES = [
  'BHD', 'AED', 'SAR', 'KWD', 'QAR', 'OMR', 'USD', 'EUR'
];

const FORMATS = [
  'Static', 'Video', 'Carousel', 'Reels', 'Stories', 'Newsfeed', 'Display'
];

const MediaPlan: React.FC = () => {
  const [activeView, setActiveView] = useState<'cpc' | 'cpm'>('cpc');
  
  // Use context for shared state and persistence
  const {
    cpcRows,
    setCpcRows,
    cpmRows, 
    setCpmRows,
    cpcTableShownOnBusinessData,
    setCpcTableShownOnBusinessData,
    cpmTableShownOnBusinessData,
    setCpmTableShownOnBusinessData
  } = useMediaPlan();
  




  const addCPCRow = () => {
    const newRow: CPCRow = {
      id: Date.now().toString(),
      channel: 'Facebook',
      currency: 'BHD',
      targetAudience: '',
      format: '',
      estimatedClicks: 0,
      cpc: 0,
      netCost: 0
    };
    setCpcRows([...cpcRows, newRow]);
  };

  const addCPMRow = () => {
    const newRow: CPMRow = {
      id: Date.now().toString(),
      channel: 'Facebook',
      currency: 'BHD',
      targetAudience: '',
      format: '',
      impressions: 0,
      frequencyUser: 0,
      frequencyWeek: 0,
      addressableAudience: 0,
      percentReach: 0,
      reach: 0,
      estImpressions: 0,
      netRate: 0,
      netCost: 0
    };
    setCpmRows([...cpmRows, newRow]);
  };

  const updateCPCRow = (id: string, field: keyof CPCRow, value: any) => {
    const updatedRows = cpcRows.map(row => {
      if (row.id === id) {
        const updatedRow = { ...row, [field]: value };
        // Auto-calculate net cost
        if (field === 'estimatedClicks' || field === 'cpc') {
          updatedRow.netCost = updatedRow.estimatedClicks * updatedRow.cpc;
        }
        return updatedRow;
      }
      return row;
    });
    setCpcRows(updatedRows);
  };

  const updateCPMRow = (id: string, field: keyof CPMRow, value: any) => {
    const updatedRows = cpmRows.map(row => {
      if (row.id === id) {
        const updatedRow = { ...row, [field]: value };
        // Calculate Reach
        if (field === 'addressableAudience' || field === 'percentReach') {
          const audience = Number(updatedRow.addressableAudience) || 0;
          const percent = Number(updatedRow.percentReach) || 0;
          updatedRow.reach = audience && percent ? Math.round(audience * percent / 100) : 0;
        }
        // Calculate Est. Impressions
        if (field === 'impressions' || field === 'frequencyUser' || field === 'frequencyWeek') {
          const impressions = Number(updatedRow.impressions) || 0;
          const freqUser = Number(updatedRow.frequencyUser) || 0;
          const freqWeek = Number(updatedRow.frequencyWeek) || 0;
          updatedRow.estImpressions = impressions * freqUser * freqWeek;
        }
        // Calculate Net Cost
        if (
          field === 'estImpressions' || field === 'netRate' || field === 'impressions' || 
          field === 'frequencyUser' || field === 'frequencyWeek'
        ) {
          updatedRow.netCost = updatedRow.estImpressions && updatedRow.netRate
            ? (updatedRow.estImpressions / 1000) * updatedRow.netRate
            : 0;
        }
        return updatedRow;
      }
      return row;
    });
    setCpmRows(updatedRows);
  };

  const deleteCPCRow = (id: string) => {
    const filteredRows = cpcRows.filter(row => row.id !== id);
    setCpcRows(filteredRows);
  };

  const deleteCPMRow = (id: string) => {
    const filteredRows = cpmRows.filter(row => row.id !== id);
    setCpmRows(filteredRows);
  };





  const totalCPCCost = cpcRows.reduce((sum, row) => sum + row.netCost, 0);
  const totalCPMCost = cpmRows.reduce((sum, row) => sum + row.netCost, 0);
  
  // Get currency from CPM table (use first row's currency or default to BHD)
  const selectedCurrency = cpmRows.length > 0 ? cpmRows[0].currency : 'BHD';
  
  // Exchange rates (to USD)
  const exchangeRates: { [key: string]: number } = {
    'BHD': 2.65, // 1 BHD = 2.65 USD
    'AED': 0.272, // 1 AED = 0.272 USD
    'SAR': 0.267, // 1 SAR = 0.267 USD
    'KWD': 3.27, // 1 KWD = 3.27 USD
    'QAR': 0.275, // 1 QAR = 0.275 USD
    'OMR': 2.60, // 1 OMR = 2.60 USD
    'USD': 1.0,   // 1 USD = 1 USD
    'EUR': 1.10   // 1 EUR = 1.10 USD
  };

  // Calculate investment data based on CPM total cost and selected currency
  const baseCost = totalCPMCost || 333502.37; // Use CPM total or default
  const agencyFee = baseCost * 0.05; // 5% of media cost
  const vat = (baseCost + agencyFee) * 0.05; // 5% of subtotal
  const grandTotal = baseCost + agencyFee + vat;
  
  // Convert to USD using exchange rate
  const exchangeRate = exchangeRates[selectedCurrency] || 1;
  const investmentData = [
    {
      item: 'Media Cost',
      amount: baseCost,
      usd: Math.round(baseCost * exchangeRate)
    },
    {
      item: `Agency Fee 5%`,
      amount: agencyFee,
      usd: Math.round(agencyFee * exchangeRate)
    },
    {
      item: `VAT 5%`,
      amount: vat,
      usd: Math.round(vat * exchangeRate)
    }
  ];
  
  const totalInvestmentUSD = investmentData.reduce((sum, row) => sum + row.usd, 0);
  
  // Calculate totals from CPM table for KPI table
  const totalAddressableAudience = cpmRows.reduce((sum, row) => sum + row.addressableAudience, 0);
  const totalReach = cpmRows.reduce((sum, row) => sum + row.reach, 0);
  const totalEstImpressions = cpmRows.reduce((sum, row) => sum + row.estImpressions, 0);
  const avgPercentReach = cpmRows.length > 0 ? totalReach / totalAddressableAudience * 100 : 0;
  
  // Calculate KPI data from CPM table - single row with totals/averages
  const kpiData: KPIRow = {
    addressableAudience: totalAddressableAudience,
    percentReach: Math.round(avgPercentReach),
    reach: totalReach,
    frequency: cpmRows.length > 0 ? Math.round(cpmRows.reduce((sum, row) => sum + row.frequencyUser, 0) / cpmRows.length) : 0,
    durationWeeks: cpmRows.length > 0 ? Math.round(cpmRows.reduce((sum, row) => sum + row.frequencyWeek, 0) / cpmRows.length) : 0,
    estImpressions: totalEstImpressions
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Media Plan</h2>
            <p className="text-sm text-gray-600 mt-1">
              Plan and budget your advertising campaigns across different channels
            </p>
          </div>
          
          {/* View Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveView('cpc')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeView === 'cpc'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              CPC (Cost Per Click)
            </button>
            <button
              onClick={() => setActiveView('cpm')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeView === 'cpm'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              CPM (Cost Per Thousand Impressions)
            </button>
          </div>
        </div>

        {/* CPC Table */}
        {activeView === 'cpc' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <h3 className="text-lg font-medium text-gray-900">Cost Per Click Campaigns</h3>
                <button
                  type="button"
                  onClick={() => setCpcTableShownOnBusinessData(!cpcTableShownOnBusinessData)}
                  className={`p-1 rounded hover:bg-gray-100 transition-colors ${
                    cpcTableShownOnBusinessData ? 'text-green-600' : 'text-gray-400'
                  }`}
                  title={cpcTableShownOnBusinessData ? 'Table is shown on Business Data (editing disabled)' : 'Table is hidden from Business Data (editing enabled)'}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
                  </svg>
                </button>
              </div>
              <button
                onClick={addCPCRow}
                className="btn-primary inline-flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Campaign
              </button>
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
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {cpcRows.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50">
                      <td className="px-3 py-4">
                        <select
                          value={row.channel}
                          onChange={(e) => updateCPCRow(row.id, 'channel', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        >
                          {CHANNELS.map(channel => (
                            <option key={channel} value={channel}>{channel}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-4">
                        <select
                          value={row.currency}
                          onChange={(e) => updateCPCRow(row.id, 'currency', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        >
                          {CURRENCIES.map(currency => (
                            <option key={currency} value={currency}>{currency}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-4">
                        <input
                          type="text"
                          value={row.targetAudience}
                          onChange={(e) => updateCPCRow(row.id, 'targetAudience', e.target.value)}
                          disabled={cpcTableShownOnBusinessData}
                          className={`w-full px-2 py-1 border rounded-md text-sm ${
                            cpcTableShownOnBusinessData 
                              ? 'border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed' 
                              : 'border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
                          }`}
                          placeholder="Target audience description"
                        />
                      </td>
                      <td className="px-3 py-4">
                        <input
                          type="text"
                          value={row.format}
                          onChange={(e) => updateCPCRow(row.id, 'format', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="e.g., Static, Video"
                        />
                      </td>
                      <td className="px-3 py-4">
                        <input
                          type="number"
                          value={row.estimatedClicks}
                          onChange={(e) => updateCPCRow(row.id, 'estimatedClicks', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          min="0"
                        />
                      </td>
                      <td className="px-3 py-4">
                        <input
                          type="number"
                          value={row.cpc}
                          onChange={(e) => updateCPCRow(row.id, 'cpc', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          min="0"
                          step="0.01"
                        />
                      </td>
                      <td className="px-3 py-4">
                        <span className="text-sm font-medium text-gray-900">
                          {row.netCost.toLocaleString()} {row.currency}
                        </span>
                      </td>
                      <td className="px-3 py-4">
                        <button
                          onClick={() => deleteCPCRow(row.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end">
              <div className="bg-gray-50 px-4 py-3 rounded-lg">
                <span className="text-lg font-semibold text-gray-900">
                  Total CPC Cost: {totalCPCCost.toLocaleString()} BHD
                </span>
              </div>
            </div>

            {/* CPC Total Investment Table */}
            <div className="mt-8 space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Total Investment</h3>
                <p className="text-sm text-gray-600">Campaign costs calculated from CPC data above (read-only) - Currency: {cpcRows.length > 0 ? cpcRows[0].currency : 'BHD'}</p>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Investment</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{cpcRows.length > 0 ? cpcRows[0].currency : 'BHD'}</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">USD</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(() => {
                      const cpcCurrency = cpcRows.length > 0 ? cpcRows[0].currency : 'BHD';
                      const cpcExchangeRate = exchangeRates[cpcCurrency] || 1;
                      const cpcBaseCost = totalCPCCost || 0;
                      const cpcAgencyFee = cpcBaseCost * 0.05;
                      const cpcVat = (cpcBaseCost + cpcAgencyFee) * 0.05;
                      const cpcGrandTotal = cpcBaseCost + cpcAgencyFee + cpcVat;
                      
                      const cpcInvestmentData = [
                        {
                          item: 'Media Cost',
                          amount: cpcBaseCost,
                          usd: Math.round(cpcBaseCost * cpcExchangeRate)
                        },
                        {
                          item: `Agency Fee 5%`,
                          amount: cpcAgencyFee,
                          usd: Math.round(cpcAgencyFee * cpcExchangeRate)
                        },
                        {
                          item: `VAT 5%`,
                          amount: cpcVat,
                          usd: Math.round(cpcVat * cpcExchangeRate)
                        }
                      ];
                      
                      const cpcTotalUSD = cpcInvestmentData.reduce((sum, row) => sum + row.usd, 0);

                      return (
                        <>
                          {cpcInvestmentData.map((row, index) => (
                            <tr key={index} className="bg-gray-50">
                              <td className="px-3 py-4 text-sm font-medium text-gray-900">
                                {row.item}
                              </td>
                              <td className="px-3 py-4 text-sm font-medium text-gray-900">
                                {cpcCurrency} {row.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td className="px-3 py-4 text-sm font-medium text-gray-900">
                                ${row.usd.toLocaleString()}
                              </td>
                            </tr>
                          ))}
                          <tr className="bg-gray-800 text-white font-semibold">
                            <td className="px-3 py-4 text-sm font-medium">
                              Grand Total
                            </td>
                            <td className="px-3 py-4 text-sm font-medium">
                              {cpcCurrency} {cpcGrandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="px-3 py-4 text-sm font-medium">
                              ${cpcTotalUSD.toLocaleString()}
                            </td>
                          </tr>
                        </>
                      );
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* CPM Table */}
        {activeView === 'cpm' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <h3 className="text-lg font-medium text-gray-900">Cost Per Thousand Impressions (CPM) Campaigns</h3>
                <button
                  type="button"
                  onClick={() => setCpmTableShownOnBusinessData(!cpmTableShownOnBusinessData)}
                  className={`p-1 rounded hover:bg-gray-100 transition-colors ${
                    cpmTableShownOnBusinessData ? 'text-green-600' : 'text-gray-400'
                  }`}
                  title={cpmTableShownOnBusinessData ? 'Table is shown on Business Data (editing disabled)' : 'Table is hidden from Business Data (editing enabled)'}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
                  </svg>
                </button>
              </div>
              <button
                onClick={addCPMRow}
                className="btn-primary inline-flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Campaign
              </button>
            </div>

            <div className="w-full">
              <table className="w-full table-auto divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Channel</th>
                    <th className="px-2 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">Currency</th>
                    <th className="px-2 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">Target Audience</th>
                    <th className="px-2 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Format</th>
                    <th className="px-2 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Impressions</th>
                    <th className="px-2 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">F/User</th>
                    <th className="px-2 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">F/Week</th>
                    <th className="px-2 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Addressable Aud.</th>
                    <th className="px-2 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">% Reach</th>
                    <th className="px-2 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Reach</th>
                    <th className="px-2 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Est. Impr.</th>
                    <th className="px-2 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">Net Rate</th>
                    <th className="px-2 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Net Cost</th>
                    <th className="px-2 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {cpmRows.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50">
                      <td className="px-2 py-3">
                        <select
                          value={row.channel}
                          onChange={(e) => updateCPMRow(row.id, 'channel', e.target.value)}
                          className="w-full px-1 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                        >
                          {CHANNELS.map(channel => (
                            <option key={channel} value={channel}>{channel}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-2 py-3">
                        <select
                          value={row.currency}
                          onChange={(e) => updateCPMRow(row.id, 'currency', e.target.value)}
                          className="w-full px-1 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                        >
                          {CURRENCIES.map(currency => (
                            <option key={currency} value={currency}>{currency}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-2 py-3">
                        <textarea
                          value={row.targetAudience}
                          onChange={(e) => updateCPMRow(row.id, 'targetAudience', e.target.value)}
                          className="w-full px-1 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-primary-500 focus:border-primary-500 resize-none"
                          placeholder="Target audience"
                          rows={2}
                        />
                      </td>
                      <td className="px-2 py-3">
                        <textarea
                          value={row.format}
                          onChange={(e) => updateCPMRow(row.id, 'format', e.target.value)}
                          className="w-full px-1 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-primary-500 focus:border-primary-500 resize-none"
                          placeholder="Format"
                          rows={2}
                        />
                      </td>
                      <td className="px-2 py-3">
                        <input
                          type="number"
                          value={row.impressions}
                          onChange={(e) => updateCPMRow(row.id, 'impressions', parseFloat(e.target.value) || 0)}
                          className="w-full px-1 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                          min="0"
                        />
                      </td>
                      <td className="px-2 py-3">
                        <input
                          type="number"
                          value={row.frequencyUser}
                          onChange={(e) => updateCPMRow(row.id, 'frequencyUser', parseFloat(e.target.value) || 0)}
                          className="w-full px-1 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                          min="0"
                        />
                      </td>
                      <td className="px-2 py-3">
                        <input
                          type="number"
                          value={row.frequencyWeek}
                          onChange={(e) => updateCPMRow(row.id, 'frequencyWeek', parseFloat(e.target.value) || 0)}
                          className="w-full px-1 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                          min="0"
                        />
                      </td>
                      <td className="px-2 py-3">
                        <input
                          type="number"
                          value={row.addressableAudience}
                          onChange={(e) => updateCPMRow(row.id, 'addressableAudience', parseFloat(e.target.value) || 0)}
                          className="w-full px-1 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                          min="0"
                        />
                      </td>
                      <td className="px-2 py-3">
                        <input
                          type="number"
                          value={row.percentReach}
                          onChange={(e) => updateCPMRow(row.id, 'percentReach', parseFloat(e.target.value) || 0)}
                          className="w-full px-1 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                          min="0"
                          max="100"
                        />
                      </td>
                      <td className="px-2 py-3">
                        <span className="text-xs font-medium text-gray-900 block">
                          {row.reach.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-2 py-3">
                        <span className="text-xs text-gray-600 block">
                          {row.estImpressions.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-2 py-3">
                        <input
                          type="number"
                          value={row.netRate}
                          onChange={(e) => updateCPMRow(row.id, 'netRate', parseFloat(e.target.value) || 0)}
                          className="w-full px-1 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                          min="0"
                          step="0.01"
                        />
                      </td>
                      <td className="px-2 py-3">
                        <span className="text-xs font-medium text-gray-900 block">
                          {row.netCost.toLocaleString()} {row.currency}
                        </span>
                      </td>
                      <td className="px-2 py-3">
                        <button
                          onClick={() => deleteCPMRow(row.id)}
                          className="text-red-600 hover:text-red-800 p-1"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* CPM Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-50 px-4 py-3 rounded-lg">
                <div className="text-sm text-gray-600">Total Cost</div>
                <div className="text-lg font-semibold text-gray-900">
                  {totalCPMCost.toLocaleString()} BHD
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 rounded-lg">
                <div className="text-sm text-gray-600">Total Addressable Audience</div>
                <div className="text-lg font-semibold text-gray-900">
                  {totalAddressableAudience.toLocaleString()}
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 rounded-lg">
                <div className="text-sm text-gray-600">Total Reach</div>
                <div className="text-lg font-semibold text-gray-900">
                  {totalReach.toLocaleString()}
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 rounded-lg">
                <div className="text-sm text-gray-600">Total Impressions</div>
                <div className="text-lg font-semibold text-gray-900">
                  {totalEstImpressions.toLocaleString()}
                </div>
              </div>
            </div>

            {/* KPI Table */}
            <div className="mt-8 space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Key Performance Indicators (KPIs)</h3>
                <p className="text-sm text-gray-600">Consolidated data from CPM campaigns above (read-only)</p>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Addressable Audience</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">%ge Reach</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reach</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frequency / user</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration by week</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Est. Impressions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr className="bg-gray-50">
                      <td className="px-3 py-4">
                        <span className="text-sm font-medium text-gray-900">
                          {kpiData.addressableAudience.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-3 py-4">
                        <span className="text-sm font-medium text-gray-900">
                          {kpiData.percentReach}%
                        </span>
                      </td>
                      <td className="px-3 py-4">
                        <span className="text-sm font-medium text-gray-900">
                          {kpiData.reach.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-3 py-4">
                        <span className="text-sm font-medium text-gray-900">
                          {kpiData.frequency}
                        </span>
                      </td>
                      <td className="px-3 py-4">
                        <span className="text-sm font-medium text-gray-900">
                          {kpiData.durationWeeks}
                        </span>
                      </td>
                      <td className="px-3 py-4">
                        <span className="text-sm font-medium text-gray-900">
                          {kpiData.estImpressions.toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Total Investment Table */}
            <div className="mt-8 space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Total Investment</h3>
                <p className="text-sm text-gray-600">Campaign costs calculated from CPM data above (read-only) - Currency: {selectedCurrency}</p>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Investment</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{selectedCurrency}</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">USD</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {investmentData.map((row, index) => (
                      <tr key={index} className="bg-gray-50">
                        <td className="px-3 py-4 text-sm font-medium text-gray-900">
                          {row.item}
                        </td>
                        <td className="px-3 py-4 text-sm font-medium text-gray-900">
                          {selectedCurrency} {row.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-3 py-4 text-sm font-medium text-gray-900">
                          ${row.usd.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                    {/* Grand Total Row */}
                    <tr className="bg-gray-800 text-white font-semibold">
                      <td className="px-3 py-4 text-sm font-medium">
                        Grand Total
                      </td>
                      <td className="px-3 py-4 text-sm font-medium">
                        {selectedCurrency} {grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-3 py-4 text-sm font-medium">
                        ${totalInvestmentUSD.toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default MediaPlan;
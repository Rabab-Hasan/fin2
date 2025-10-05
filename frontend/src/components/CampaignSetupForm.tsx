import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Check, MapPin, DollarSign, Calendar, Smartphone, Percent, Target, Globe } from 'lucide-react';

// Types for campaign setup
interface Country {
  code: string;
  name: string;
  flag: string;
}

interface Platform {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface CampaignType {
  id: string;
  name: string;
  description: string;
}

interface PlatformBudget {
  platformId: string;
  percentage: number;
  amount: number;
}

interface PlatformCampaignType {
  platformId: string;
  campaignTypeId: string;
  percentage: number;
  amount: number;
}

interface CountryCampaign {
  countryCode: string;
  totalBudget: number;
  duration: number;
  platforms: PlatformBudget[];
  campaignTypes: PlatformCampaignType[];
}

interface CampaignSetupData {
  selectedCountries: string[];
  totalBudget: number;
  duration: number;
  selectedPlatforms: string[];
  countryCampaigns: CountryCampaign[];
}

// Available countries
const COUNTRIES: Country[] = [
  { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪' },
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦' },
  { code: 'BH', name: 'Bahrain', flag: '🇧🇭' },
  { code: 'KW', name: 'Kuwait', flag: '🇰🇼' },
  { code: 'QA', name: 'Qatar', flag: '🇶🇦' },
  { code: 'OM', name: 'Oman', flag: '🇴🇲' },
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
];

// Available platforms
const PLATFORMS: Platform[] = [
  { id: 'meta', name: 'Meta (Facebook)', icon: '📘', color: 'bg-blue-500' },
  { id: 'instagram', name: 'Instagram', icon: '📷', color: 'bg-pink-500' },
  { id: 'google', name: 'Google Ads', icon: '🌎', color: 'bg-green-500' },
  { id: 'tiktok', name: 'TikTok', icon: '🎵', color: 'bg-black' },
  { id: 'youtube', name: 'YouTube', icon: '📺', color: 'bg-red-500' },
  { id: 'linkedin', name: 'LinkedIn', icon: '💼', color: 'bg-blue-600' },
  { id: 'twitter', name: 'X (Twitter)', icon: '🐦', color: 'bg-gray-900' },
  { id: 'snapchat', name: 'Snapchat', icon: '👻', color: 'bg-yellow-400' },
];

// Available campaign types
const CAMPAIGN_TYPES: CampaignType[] = [
  { id: 'awareness', name: 'Awareness', description: 'Build brand awareness and reach new audiences' },
  { id: 'traffic', name: 'Traffic', description: 'Drive traffic to your website or landing page' },
  { id: 'views', name: 'Views', description: 'Increase video views and engagement' },
  { id: 'leads', name: 'Leads', description: 'Generate leads and collect contact information' },
  { id: 'engagement', name: 'Engagement', description: 'Increase likes, comments, and shares' },
  { id: 'retargeting', name: 'Retargeting', description: 'Re-engage with previous visitors or customers' },
  { id: 'conversions', name: 'Conversions', description: 'Drive sales and conversions' },
  { id: 'app_installs', name: 'App Installs', description: 'Promote mobile app downloads' },
];

const CampaignSetupForm: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [currentCountryIndex, setCurrentCountryIndex] = useState(0);
  const [formData, setFormData] = useState<CampaignSetupData>({
    selectedCountries: [],
    totalBudget: 0,
    duration: 0,
    selectedPlatforms: [],
    countryCampaigns: [],
  });

  const totalSteps = 8;
  const isMultiCountry = formData.selectedCountries.length > 1;

  // Initialize country campaigns when countries are selected
  useEffect(() => {
    if (formData.selectedCountries.length > 0 && formData.countryCampaigns.length === 0) {
      const newCountryCampaigns = formData.selectedCountries.map(countryCode => ({
        countryCode,
        totalBudget: formData.totalBudget,
        duration: formData.duration,
        platforms: [],
        campaignTypes: [],
      }));
      setFormData(prev => ({ ...prev, countryCampaigns: newCountryCampaigns }));
    }
  }, [formData.selectedCountries, formData.totalBudget, formData.duration]);

  const getCurrentCountryCampaign = (): CountryCampaign => {
    return formData.countryCampaigns[currentCountryIndex] || {
      countryCode: formData.selectedCountries[currentCountryIndex],
      totalBudget: formData.totalBudget,
      duration: formData.duration,
      platforms: [],
      campaignTypes: [],
    };
  };

  const updateCurrentCountryCampaign = (updates: Partial<CountryCampaign>) => {
    const newCountryCampaigns = [...formData.countryCampaigns];
    newCountryCampaigns[currentCountryIndex] = { ...getCurrentCountryCampaign(), ...updates };
    setFormData(prev => ({ ...prev, countryCampaigns: newCountryCampaigns }));
  };

  const copyPreviousCountrySetup = () => {
    if (currentCountryIndex > 0) {
      const previousCampaign = formData.countryCampaigns[currentCountryIndex - 1];
      const currentCountry = formData.selectedCountries[currentCountryIndex];
      updateCurrentCountryCampaign({
        platforms: [...previousCampaign.platforms],
        campaignTypes: [...previousCampaign.campaignTypes],
      });
    }
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      if (currentStep === 7 && isMultiCountry && currentCountryIndex < formData.selectedCountries.length - 1) {
        // Move to next country for step 8
        setCurrentCountryIndex(prev => prev + 1);
        setCurrentStep(5); // Go back to platform selection for next country
      } else {
        setCurrentStep(prev => prev + 1);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return formData.selectedCountries.length > 0;
      case 2: return formData.totalBudget > 0;
      case 3: return formData.duration > 0;
      case 4: return formData.selectedPlatforms.length > 0;
      case 5: return getCurrentCountryCampaign().platforms.length > 0 && 
                     getCurrentCountryCampaign().platforms.reduce((sum, p) => sum + p.percentage, 0) === 100;
      case 6: return getCurrentCountryCampaign().campaignTypes.length > 0;
      case 7: return getCurrentCountryCampaign().campaignTypes.every(ct => ct.percentage > 0) &&
                     getCurrentCountryCampaign().campaignTypes.reduce((sum, ct) => sum + ct.percentage, 0) === 100;
      default: return true;
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-between mb-8">
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
        <div key={step} className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            step <= currentStep 
              ? 'bg-primary-600 text-white' 
              : 'bg-gray-200 text-gray-500'
          }`}>
            {step < currentStep ? <Check className="w-4 h-4" /> : step}
          </div>
          {step < totalSteps && (
            <div className={`h-1 w-12 mx-2 ${
              step < currentStep ? 'bg-primary-600' : 'bg-gray-200'
            }`} />
          )}
        </div>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <MapPin className="w-12 h-12 text-primary-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose Countries</h2>
        <p className="text-gray-600">Select the countries where you want the campaign to run.</p>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {COUNTRIES.map((country) => (
          <div
            key={country.code}
            onClick={() => {
              const isSelected = formData.selectedCountries.includes(country.code);
              setFormData(prev => ({
                ...prev,
                selectedCountries: isSelected
                  ? prev.selectedCountries.filter(c => c !== country.code)
                  : [...prev.selectedCountries, country.code]
              }));
            }}
            className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
              formData.selectedCountries.includes(country.code)
                ? 'border-primary-600 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-2xl mb-2">{country.flag}</div>
            <div className="text-sm font-medium text-gray-900">{country.name}</div>
          </div>
        ))}
      </div>
      
      {formData.selectedCountries.length > 0 && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-blue-800">
            Selected {formData.selectedCountries.length} countries: {' '}
            {formData.selectedCountries.map(code => 
              COUNTRIES.find(c => c.code === code)?.name
            ).join(', ')}
          </p>
        </div>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <DollarSign className="w-12 h-12 text-primary-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Set Total Budget</h2>
        <p className="text-gray-600">What is the total budget for the campaign?</p>
      </div>
      
      <div className="max-w-md mx-auto">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Total Campaign Budget (USD)
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-500 text-lg">$</span>
          </div>
          <input
            type="number"
            value={formData.totalBudget || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, totalBudget: parseFloat(e.target.value) || 0 }))}
            className="block w-full pl-8 pr-3 py-3 text-lg border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
            placeholder="0.00"
            min="0"
            step="0.01"
          />
        </div>
        
        {formData.totalBudget > 0 && (
          <div className="mt-4 p-3 bg-green-50 rounded-lg">
            <p className="text-sm text-green-800">
              Total budget: ${formData.totalBudget.toLocaleString()} USD
              {formData.selectedCountries.length > 1 && (
                <span className="block text-xs mt-1">
                  This budget will be allocated across {formData.selectedCountries.length} countries
                </span>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Calendar className="w-12 h-12 text-primary-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Define Campaign Duration</h2>
        <p className="text-gray-600">What is the duration of the campaign (in days)?</p>
      </div>
      
      <div className="max-w-md mx-auto">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Campaign Duration
        </label>
        <div className="relative">
          <input
            type="number"
            value={formData.duration || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, duration: parseFloat(e.target.value) || 0 }))}
            className="block w-full px-3 py-3 text-lg border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
            placeholder="30"
            min="1"
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="text-gray-500">days</span>
          </div>
        </div>
        
        {formData.duration > 0 && (
          <div className="mt-4 space-y-2">
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                Campaign duration: {formData.duration} days
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
              <div className="p-2 bg-gray-50 rounded text-center">
                <div className="font-medium">{Math.ceil(formData.duration / 7)} weeks</div>
                <div>Weeks</div>
              </div>
              <div className="p-2 bg-gray-50 rounded text-center">
                <div className="font-medium">{Math.ceil(formData.duration / 30)} months</div>
                <div>Months</div>
              </div>
              <div className="p-2 bg-gray-50 rounded text-center">
                <div className="font-medium">${(formData.totalBudget / formData.duration).toFixed(2)}</div>
                <div>Per day</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Smartphone className="w-12 h-12 text-primary-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose Platforms</h2>
        <p className="text-gray-600">Which platforms will the campaign be running on?</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {PLATFORMS.map((platform) => (
          <div
            key={platform.id}
            onClick={() => {
              const isSelected = formData.selectedPlatforms.includes(platform.id);
              setFormData(prev => ({
                ...prev,
                selectedPlatforms: isSelected
                  ? prev.selectedPlatforms.filter(p => p !== platform.id)
                  : [...prev.selectedPlatforms, platform.id]
              }));
            }}
            className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
              formData.selectedPlatforms.includes(platform.id)
                ? 'border-primary-600 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 ${platform.color} rounded-lg flex items-center justify-center text-white text-lg`}>
                {platform.icon}
              </div>
              <div>
                <div className="font-medium text-gray-900">{platform.name}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {formData.selectedPlatforms.length > 0 && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-blue-800">
            Selected {formData.selectedPlatforms.length} platforms: {' '}
            {formData.selectedPlatforms.map(id => 
              PLATFORMS.find(p => p.id === id)?.name
            ).join(', ')}
          </p>
        </div>
      )}
    </div>
  );

  const renderStep5 = () => {
    const currentCampaign = getCurrentCountryCampaign();
    const currentCountry = COUNTRIES.find(c => c.code === currentCampaign.countryCode);
    
    const updatePlatformBudget = (platformId: string, percentage: number) => {
      const platforms = [...currentCampaign.platforms];
      const existingIndex = platforms.findIndex(p => p.platformId === platformId);
      const amount = (percentage / 100) * formData.totalBudget;
      
      if (existingIndex >= 0) {
        platforms[existingIndex] = { platformId, percentage, amount };
      } else {
        platforms.push({ platformId, percentage, amount });
      }
      
      updateCurrentCountryCampaign({ platforms });
    };

    const totalAllocated = currentCampaign.platforms.reduce((sum, p) => sum + p.percentage, 0);
    const remaining = 100 - totalAllocated;

    return (
      <div className="space-y-6">
        <div className="text-center">
          <Percent className="w-12 h-12 text-primary-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Assign Platform Budgets</h2>
          {isMultiCountry && (
            <div className="flex items-center justify-center space-x-2 mb-2">
              <span className="text-2xl">{currentCountry?.flag}</span>
              <span className="text-lg font-medium text-gray-700">{currentCountry?.name}</span>
            </div>
          )}
          <p className="text-gray-600">How much budget would you like to allocate to each platform?</p>
        </div>

        {isMultiCountry && currentCountryIndex > 0 && (
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <p className="text-sm text-yellow-800">
                Would you like to copy the setup from the previous country?
              </p>
              <button
                onClick={copyPreviousCountrySetup}
                className="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700"
              >
                Copy Previous
              </button>
            </div>
          </div>
        )}
        
        <div className="space-y-4">
          {formData.selectedPlatforms.map((platformId) => {
            const platform = PLATFORMS.find(p => p.id === platformId);
            const platformBudget = currentCampaign.platforms.find(p => p.platformId === platformId);
            
            return (
              <div key={platformId} className="flex items-center space-x-4 p-4 border rounded-lg">
                <div className={`w-10 h-10 ${platform?.color} rounded-lg flex items-center justify-center text-white`}>
                  {platform?.icon}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{platform?.name}</div>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={platformBudget?.percentage || ''}
                    onChange={(e) => updatePlatformBudget(platformId, parseFloat(e.target.value) || 0)}
                    className="w-20 px-2 py-1 border rounded text-center"
                    placeholder="0"
                    min="0"
                    max="100"
                  />
                  <span className="text-gray-500">%</span>
                  <div className="text-sm text-gray-600 w-24 text-right">
                    ${((platformBudget?.percentage || 0) / 100 * formData.totalBudget).toLocaleString()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="font-medium">Total Allocated:</span>
            <span className={`font-medium ${remaining === 0 ? 'text-green-600' : remaining < 0 ? 'text-red-600' : 'text-gray-900'}`}>
              {totalAllocated}% (${(totalAllocated / 100 * formData.totalBudget).toLocaleString()})
            </span>
          </div>
          {remaining !== 0 && (
            <div className="text-sm text-gray-600 mt-1">
              {remaining > 0 ? `${remaining}% remaining` : `${Math.abs(remaining)}% over budget`}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderStep6 = () => {
    const currentCampaign = getCurrentCountryCampaign();
    const currentCountry = COUNTRIES.find(c => c.code === currentCampaign.countryCode);
    
    const toggleCampaignType = (platformId: string, campaignTypeId: string) => {
      const campaignTypes = [...currentCampaign.campaignTypes];
      const existingIndex = campaignTypes.findIndex(ct => ct.platformId === platformId && ct.campaignTypeId === campaignTypeId);
      
      if (existingIndex >= 0) {
        campaignTypes.splice(existingIndex, 1);
      } else {
        campaignTypes.push({ platformId, campaignTypeId, percentage: 0, amount: 0 });
      }
      
      updateCurrentCountryCampaign({ campaignTypes });
    };

    return (
      <div className="space-y-6">
        <div className="text-center">
          <Target className="w-12 h-12 text-primary-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Define Campaign Types</h2>
          {isMultiCountry && (
            <div className="flex items-center justify-center space-x-2 mb-2">
              <span className="text-2xl">{currentCountry?.flag}</span>
              <span className="text-lg font-medium text-gray-700">{currentCountry?.name}</span>
            </div>
          )}
          <p className="text-gray-600">What type of campaign are you running on each platform?</p>
        </div>
        
        <div className="space-y-6">
          {formData.selectedPlatforms.map((platformId) => {
            const platform = PLATFORMS.find(p => p.id === platformId);
            const platformCampaignTypes = currentCampaign.campaignTypes.filter(ct => ct.platformId === platformId);
            
            return (
              <div key={platformId} className="border rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-4">
                  <div className={`w-8 h-8 ${platform?.color} rounded-lg flex items-center justify-center text-white text-sm`}>
                    {platform?.icon}
                  </div>
                  <h3 className="font-medium text-gray-900">{platform?.name}</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {CAMPAIGN_TYPES.map((campaignType) => {
                    const isSelected = platformCampaignTypes.some(ct => ct.campaignTypeId === campaignType.id);
                    
                    return (
                      <div
                        key={campaignType.id}
                        onClick={() => toggleCampaignType(platformId, campaignType.id)}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          isSelected
                            ? 'border-primary-600 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="font-medium text-sm text-gray-900">{campaignType.name}</div>
                        <div className="text-xs text-gray-600 mt-1">{campaignType.description}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderStep7 = () => {
    const currentCampaign = getCurrentCountryCampaign();
    const currentCountry = COUNTRIES.find(c => c.code === currentCampaign.countryCode);
    
    const updateCampaignTypePercentage = (platformId: string, campaignTypeId: string, percentage: number) => {
      const campaignTypes = [...currentCampaign.campaignTypes];
      const index = campaignTypes.findIndex(ct => ct.platformId === platformId && ct.campaignTypeId === campaignTypeId);
      
      if (index >= 0) {
        const platformBudget = currentCampaign.platforms.find(p => p.platformId === platformId)?.amount || 0;
        campaignTypes[index] = {
          ...campaignTypes[index],
          percentage,
          amount: (percentage / 100) * platformBudget
        };
        updateCurrentCountryCampaign({ campaignTypes });
      }
    };

    return (
      <div className="space-y-6">
        <div className="text-center">
          <Percent className="w-12 h-12 text-primary-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Allocate Campaign Type Budgets</h2>
          {isMultiCountry && (
            <div className="flex items-center justify-center space-x-2 mb-2">
              <span className="text-2xl">{currentCountry?.flag}</span>
              <span className="text-lg font-medium text-gray-700">{currentCountry?.name}</span>
            </div>
          )}
          <p className="text-gray-600">How much of the platform's budget would you like to allocate to each campaign type?</p>
        </div>
        
        <div className="space-y-6">
          {formData.selectedPlatforms.map((platformId) => {
            const platform = PLATFORMS.find(p => p.id === platformId);
            const platformBudget = currentCampaign.platforms.find(p => p.platformId === platformId);
            const platformCampaignTypes = currentCampaign.campaignTypes.filter(ct => ct.platformId === platformId);
            const totalAllocated = platformCampaignTypes.reduce((sum, ct) => sum + ct.percentage, 0);
            const remaining = 100 - totalAllocated;
            
            return (
              <div key={platformId} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 ${platform?.color} rounded-lg flex items-center justify-center text-white text-sm`}>
                      {platform?.icon}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{platform?.name}</h3>
                      <p className="text-sm text-gray-600">Budget: ${platformBudget?.amount.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className={`text-sm font-medium ${remaining === 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {totalAllocated}% allocated
                  </div>
                </div>
                
                <div className="space-y-3">
                  {platformCampaignTypes.map((campaignType) => {
                    const campaignTypeInfo = CAMPAIGN_TYPES.find(ct => ct.id === campaignType.campaignTypeId);
                    
                    return (
                      <div key={campaignType.campaignTypeId} className="flex items-center space-x-4 p-3 bg-gray-50 rounded">
                        <div className="flex-1">
                          <div className="font-medium text-sm text-gray-900">{campaignTypeInfo?.name}</div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            value={campaignType.percentage || ''}
                            onChange={(e) => updateCampaignTypePercentage(platformId, campaignType.campaignTypeId, parseFloat(e.target.value) || 0)}
                            className="w-20 px-2 py-1 border rounded text-center"
                            placeholder="0"
                            min="0"
                            max="100"
                          />
                          <span className="text-gray-500">%</span>
                          <div className="text-sm text-gray-600 w-24 text-right">
                            ${campaignType.amount.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderStep8 = () => {
    if (isMultiCountry && currentCountryIndex < formData.selectedCountries.length - 1) {
      const nextCountry = COUNTRIES.find(c => c.code === formData.selectedCountries[currentCountryIndex + 1]);
      
      return (
        <div className="space-y-6">
          <div className="text-center">
            <Globe className="w-12 h-12 text-primary-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Next Country Setup</h2>
            <div className="flex items-center justify-center space-x-2 mb-4">
              <span className="text-2xl">{nextCountry?.flag}</span>
              <span className="text-lg font-medium text-gray-700">{nextCountry?.name}</span>
            </div>
            <p className="text-gray-600">
              Now, let's move on to the next country. Would you like to use the same budget and campaign types, or would you like to modify them?
            </p>
          </div>
          
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => {
                copyPreviousCountrySetup();
                handleNext();
              }}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Use Same Setup
            </button>
            <button
              onClick={() => {
                setCurrentCountryIndex(prev => prev + 1);
                setCurrentStep(5);
              }}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Customize Setup
            </button>
          </div>
        </div>
      );
    }
    
    // Final summary
    return (
      <div className="space-y-6">
        <div className="text-center">
          <Check className="w-12 h-12 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Campaign Setup Complete!</h2>
          <p className="text-gray-600">Review your campaign configuration below.</p>
        </div>
        
        <div className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Campaign Overview</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Total Budget:</span>
                <span className="ml-2 font-medium">${formData.totalBudget.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-gray-600">Duration:</span>
                <span className="ml-2 font-medium">{formData.duration} days</span>
              </div>
              <div>
                <span className="text-gray-600">Countries:</span>
                <span className="ml-2 font-medium">{formData.selectedCountries.length}</span>
              </div>
              <div>
                <span className="text-gray-600">Platforms:</span>
                <span className="ml-2 font-medium">{formData.selectedPlatforms.length}</span>
              </div>
            </div>
          </div>
          
          {formData.countryCampaigns.map((campaign, index) => {
            const country = COUNTRIES.find(c => c.code === campaign.countryCode);
            return (
              <div key={campaign.countryCode} className="border rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <span className="text-xl">{country?.flag}</span>
                  <h4 className="font-medium text-gray-900">{country?.name}</h4>
                </div>
                
                <div className="space-y-2">
                  {campaign.platforms.map((platformBudget) => {
                    const platform = PLATFORMS.find(p => p.id === platformBudget.platformId);
                    const platformCampaignTypes = campaign.campaignTypes.filter(ct => ct.platformId === platformBudget.platformId);
                    
                    return (
                      <div key={platformBudget.platformId} className="bg-gray-50 p-3 rounded">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <div className={`w-6 h-6 ${platform?.color} rounded text-white text-xs flex items-center justify-center`}>
                              {platform?.icon}
                            </div>
                            <span className="font-medium text-sm">{platform?.name}</span>
                          </div>
                          <span className="text-sm font-medium">${platformBudget.amount.toLocaleString()}</span>
                        </div>
                        {platformCampaignTypes.map((ct) => {
                          const campaignType = CAMPAIGN_TYPES.find(type => type.id === ct.campaignTypeId);
                          return (
                            <div key={ct.campaignTypeId} className="flex justify-between text-xs text-gray-600 ml-8">
                              <span>{campaignType?.name}</span>
                              <span>${ct.amount.toLocaleString()} ({ct.percentage}%)</span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="flex justify-center">
          <button className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">
            Create Campaign
          </button>
        </div>
      </div>
    );
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      case 5: return renderStep5();
      case 6: return renderStep6();
      case 7: return renderStep7();
      case 8: return renderStep8();
      default: return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-sm">
      {renderStepIndicator()}
      
      <div className="mb-8">
        {renderCurrentStep()}
      </div>
      
      <div className="flex justify-between">
        <button
          onClick={handlePrevious}
          disabled={currentStep === 1}
          className="flex items-center px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Previous
        </button>
        
        <button
          onClick={handleNext}
          disabled={!canProceed() || (currentStep === 8 && (!isMultiCountry || currentCountryIndex === formData.selectedCountries.length - 1))}
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {currentStep === 8 && (!isMultiCountry || currentCountryIndex === formData.selectedCountries.length - 1) ? 'Complete' : 'Next'}
          <ChevronRight className="w-4 h-4 ml-2" />
        </button>
      </div>
    </div>
  );
};

export default CampaignSetupForm;
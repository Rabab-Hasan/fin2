import React, { useState, useEffect } from 'react';
import { Globe, DollarSign, Calendar, Zap, Target, Percent, RotateCcw, Save, Trash2, Brain, TrendingUp, Users, Eye, MousePointer } from 'lucide-react';

interface Platform {
  name: string;
  budget: number;
  campaignTypes: { [key: string]: number };
}

interface ContentItem {
  type: string;
  comment: string;
}

interface BudgetImpact {
  estimatedReach: number;
  estimatedImpressions: number;
  estimatedClicks: number;
  estimatedConversions: number;
  costPerClick: number;
  costPerConversion: number;
  confidence: 'high' | 'medium' | 'low';
  insights: string[];
  recommendations: string[];
}

interface CountrySetup {
  countries: string[];
  totalBudget: number;
  duration: number;
  platforms: Platform[];
  content: ContentItem[];
  budgetImpact?: BudgetImpact;
}

const CampaignSetup: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [currentCountryIndex, setCurrentCountryIndex] = useState(0);
  const [countrySetups, setCountrySetups] = useState<CountrySetup[]>([]);
  const [savedSetups, setSavedSetups] = useState<CountrySetup[]>([]);
  const [currentSetup, setCurrentSetup] = useState<CountrySetup>({
    countries: [],
    totalBudget: 0,
    duration: 0,
    platforms: [],
    content: []
  });

  // Load saved setups from localStorage on component mount
  useEffect(() => {
    const saved = localStorage.getItem('campaignSetups');
    if (saved) {
      try {
        setSavedSetups(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading saved setups:', error);
      }
    }
  }, []);

  // Save setups to localStorage whenever savedSetups changes
  useEffect(() => {
    localStorage.setItem('campaignSetups', JSON.stringify(savedSetups));
  }, [savedSetups]);

  const availableCountries = [
    'Bahrain', 'Saudi Arabia', 'United Arab Emirates', 'Oman', 'Qatar', 'Kuwait',
    'United Kingdom', 'Jordan', 'Lebanon', 'Egypt', 'Morocco'
  ];

  const availablePlatforms = [
    'Meta (Facebook)', 'Instagram', 'Google Ads', 'TikTok', 'LinkedIn', 
    'Twitter', 'YouTube', 'Snapchat', 'Pinterest'
  ];

  const campaignTypes = [
    'Awareness', 'Traffic', 'Views', 'Leads', 'Engagement', 'Retargeting', 
    'Conversions', 'App Installs', 'Brand Consideration'
  ];

  const contentTypes = [
    'On ground stories of people winning',
    'Event Coverage Reel (video)',
    'TVC (video)',
    'Activation Prizes Animation (video)',
    'Prizes Animation (video)',
    'Achievers Animation (animation)',
    'Application Push post (achievers post)',
    'Lifestyle post Animation',
    'Lifesytle animation',
    'Coverage Reel',
    'Engagement & Winner Announcements post',
    'Launch Announcement & Explainers post',
    'Activation Announcement Post',
    'Influencer Reel',
    'Prizes Reel',
    'Application Push post',
    'Last-Chance Reminders post',
    'Engagement Post',
    'Engagement Posts',
    'Last-Chance Reminder',
    'Application & Loyalty Push post'
  ];

  const handleCountrySelection = (country: string) => {
    const updatedCountries = currentSetup.countries.includes(country)
      ? currentSetup.countries.filter(c => c !== country)
      : [...currentSetup.countries, country];
    
    setCurrentSetup({ ...currentSetup, countries: updatedCountries });
  };

  const handleBudgetChange = (value: number) => {
    setCurrentSetup({ ...currentSetup, totalBudget: value });
  };

  const handleDurationChange = (value: number) => {
    setCurrentSetup({ ...currentSetup, duration: value });
  };

  const handlePlatformSelection = (platform: string) => {
    const existingPlatform = currentSetup.platforms.find(p => p.name === platform);
    
    if (existingPlatform) {
      setCurrentSetup({
        ...currentSetup,
        platforms: currentSetup.platforms.filter(p => p.name !== platform)
      });
    } else {
      setCurrentSetup({
        ...currentSetup,
        platforms: [...currentSetup.platforms, { name: platform, budget: 0, campaignTypes: {} }]
      });
    }
  };

  const handlePlatformBudgetChange = (platformName: string, percentage: number) => {
    setCurrentSetup({
      ...currentSetup,
      platforms: currentSetup.platforms.map(p => 
        p.name === platformName ? { ...p, budget: percentage } : p
      )
    });
  };

  const handleCampaignTypeSelection = (platformName: string, campaignType: string) => {
    setCurrentSetup({
      ...currentSetup,
      platforms: currentSetup.platforms.map(p => {
        if (p.name === platformName) {
          const updatedTypes = { ...p.campaignTypes };
          if (updatedTypes[campaignType]) {
            delete updatedTypes[campaignType];
          } else {
            updatedTypes[campaignType] = 0;
          }
          return { ...p, campaignTypes: updatedTypes };
        }
        return p;
      })
    });
  };

  const handleCampaignTypePercentage = (platformName: string, campaignType: string, percentage: number) => {
    setCurrentSetup({
      ...currentSetup,
      platforms: currentSetup.platforms.map(p => 
        p.name === platformName 
          ? { 
              ...p, 
              campaignTypes: { 
                ...p.campaignTypes, 
                [campaignType]: percentage 
              } 
            } 
          : p
      )
    });
  };

  const handleContentSelection = (contentType: string) => {
    const existingContent = currentSetup.content.find(c => c.type === contentType);
    
    if (existingContent) {
      // Remove if already selected
      setCurrentSetup({
        ...currentSetup,
        content: currentSetup.content.filter(c => c.type !== contentType)
      });
    } else {
      // Add new content item
      setCurrentSetup({
        ...currentSetup,
        content: [...currentSetup.content, { type: contentType, comment: '' }]
      });
    }
  };

  const handleContentComment = (contentType: string, comment: string) => {
    setCurrentSetup({
      ...currentSetup,
      content: currentSetup.content.map(c => 
        c.type === contentType ? { ...c, comment } : c
      )
    });
  };

  // AI Agent for Budget Impact Prediction
  const calculateBudgetImpact = (setup: CountrySetup): BudgetImpact => {
    const { totalBudget, duration, platforms, countries, content } = setup;
    const dailyBudget = totalBudget / duration;
    
    // Base metrics calculation based on industry averages
    let baseReachMultiplier = 1000; // Base reach per $1
    let baseImpressionMultiplier = 5000; // Base impressions per $1
    let baseCTR = 0.02; // 2% click-through rate
    let baseConversionRate = 0.05; // 5% conversion rate
    
    // Adjust based on platforms
    platforms.forEach(platform => {
      const platformBudget = (totalBudget * platform.budget) / 100;
      
      switch (platform.name) {
        case 'Meta (Facebook)':
          baseReachMultiplier *= 1.2; // Higher reach on Meta
          baseCTR *= 1.1;
          break;
        case 'Instagram':
          baseReachMultiplier *= 1.1;
          baseCTR *= 1.3; // Better engagement on Instagram
          break;
        case 'Google Ads':
          baseReachMultiplier *= 0.8; // Lower reach but higher intent
          baseCTR *= 2.5; // Much higher CTR for search
          baseConversionRate *= 3; // Higher conversion rate
          break;
        case 'TikTok':
          baseReachMultiplier *= 1.5; // High reach on TikTok
          baseCTR *= 0.8; // Lower CTR but high engagement
          break;
        case 'LinkedIn':
          baseReachMultiplier *= 0.6; // Lower reach but professional
          baseCTR *= 1.2;
          baseConversionRate *= 2; // B2B conversions
          break;
      }
    });
    
    // Adjust based on countries (GCC markets)
    const gccCountries = ['Bahrain', 'Saudi Arabia', 'United Arab Emirates', 'Oman', 'Qatar', 'Kuwait'];
    const hasGCC = countries.some(country => gccCountries.includes(country));
    if (hasGCC) {
      baseReachMultiplier *= 0.7; // Smaller but higher value markets
      baseCTR *= 1.4; // Better engagement in GCC
      baseConversionRate *= 1.6; // Higher purchasing power
    }
    
    // Adjust based on content diversity
    const contentDiversity = content.length;
    if (contentDiversity > 10) {
      baseCTR *= 1.3; // More content variety improves engagement
      baseConversionRate *= 1.2;
    } else if (contentDiversity > 5) {
      baseCTR *= 1.15;
      baseConversionRate *= 1.1;
    }
    
    // Calculate final metrics
    const estimatedReach = Math.round(totalBudget * baseReachMultiplier);
    const estimatedImpressions = Math.round(totalBudget * baseImpressionMultiplier);
    const estimatedClicks = Math.round(estimatedImpressions * baseCTR);
    const estimatedConversions = Math.round(estimatedClicks * baseConversionRate);
    const costPerClick = estimatedClicks > 0 ? totalBudget / estimatedClicks : 0;
    const costPerConversion = estimatedConversions > 0 ? totalBudget / estimatedConversions : 0;
    
    // Generate insights
    const insights: string[] = [];
    const recommendations: string[] = [];
    
    if (dailyBudget < 50) {
      insights.push("Low daily budget may limit reach potential");
      recommendations.push("Consider extending campaign duration or increasing budget");
    } else if (dailyBudget > 500) {
      insights.push("High daily budget enables aggressive market penetration");
      recommendations.push("Monitor performance closely to optimize spend efficiency");
    }
    
    if (platforms.some(p => p.name === 'Google Ads' && p.budget > 40)) {
      insights.push("Strong Google Ads allocation will drive high-intent traffic");
      recommendations.push("Focus on conversion-optimized landing pages");
    }
    
    if (hasGCC) {
      insights.push("GCC markets show higher engagement and conversion rates");
      recommendations.push("Leverage premium content for affluent GCC audiences");
    }
    
    if (contentDiversity > 8) {
      insights.push("Diverse content mix will improve audience engagement");
      recommendations.push("A/B test different content types to identify top performers");
    }
    
    // Determine confidence level
    let confidence: 'high' | 'medium' | 'low' = 'medium';
    if (totalBudget >= 1000 && duration >= 7 && platforms.length >= 2) {
      confidence = 'high';
    } else if (totalBudget < 200 || duration < 3) {
      confidence = 'low';
    }
    
    return {
      estimatedReach,
      estimatedImpressions,
      estimatedClicks,
      estimatedConversions,
      costPerClick: Math.round(costPerClick * 100) / 100,
      costPerConversion: Math.round(costPerConversion * 100) / 100,
      confidence,
      insights,
      recommendations
    };
  };

  const nextStep = () => {
    if (currentStep < 10) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const finishCountrySetup = () => {
    const budgetImpact = calculateBudgetImpact(currentSetup);
    const newSetup = { ...currentSetup, budgetImpact };
    setCountrySetups([...countrySetups, newSetup]);
    setSavedSetups([...savedSetups, newSetup]);
    setCurrentCountryIndex(currentCountryIndex + 1);
    setCurrentStep(1);
    setCurrentSetup({
      countries: [],
      totalBudget: 0,
      duration: 0,
      platforms: [],
      content: []
    });
  };

  const copyPreviousSetup = () => {
    if (countrySetups.length > 0) {
      const lastSetup = countrySetups[countrySetups.length - 1];
      // Apply same setup to remaining countries from the original selection
      const remainingCountries = currentSetup.countries.filter(country => 
        !savedSetups.some(setup => setup.countries.includes(country)) &&
        !countrySetups.some(setup => setup.countries.includes(country))
      );
      
      if (remainingCountries.length > 0) {
        const newSetups = remainingCountries.map(country => ({
          ...lastSetup,
          countries: [country]
        }));
        
        setCountrySetups([...countrySetups, ...newSetups]);
        setSavedSetups([...savedSetups, ...newSetups]);
        
        // Reset for new setup
        setCurrentStep(1);
        setCurrentSetup({
          countries: [],
          totalBudget: 0,
          duration: 0,
          platforms: [],
          content: []
        });
      }
    }
  };



  const deleteSetup = (index: number) => {
    const updatedSetups = savedSetups.filter((_, i) => i !== index);
    setSavedSetups(updatedSetups);
  };

  const clearAllSetups = () => {
    if (window.confirm('Are you sure you want to clear all saved setups?')) {
      setSavedSetups([]);
      setCountrySetups([]);
      setCurrentSetup({
        countries: [],
        totalBudget: 0,
        duration: 0,
        platforms: [],
        content: []
      });
      setCurrentStep(1);
    }
  };

  const getTotalPlatformPercentage = () => {
    return currentSetup.platforms.reduce((total, platform) => total + platform.budget, 0);
  };

  const getCampaignTypeTotal = (platformName: string) => {
    const platform = currentSetup.platforms.find(p => p.name === platformName);
    if (!platform) return 0;
    return Object.values(platform.campaignTypes).reduce((total, percentage) => total + percentage, 0);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Globe className="mx-auto h-12 w-12 text-blue-600 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose Countries</h2>
              <p className="text-gray-600">Select the countries where you want the campaign to run.</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {availableCountries.map(country => {
                const isSelected = currentSetup.countries.includes(country);
                const isAlreadyConfigured = savedSetups.some(setup => setup.countries.includes(country));
                
                return (
                  <button
                    key={country}
                    onClick={() => handleCountrySelection(country)}
                    disabled={isAlreadyConfigured}
                    className={`p-3 border-2 rounded-lg text-sm font-medium transition-all relative ${
                      isAlreadyConfigured
                        ? 'border-green-300 bg-green-50 text-green-600 cursor-not-allowed'
                        : isSelected
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {country}
                    {isAlreadyConfigured && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full"></span>
                    )}
                  </button>
                );
              })}
            </div>
            
            {currentSetup.countries.length > 0 && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  Selected: {currentSetup.countries.join(', ')}
                </p>
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <DollarSign className="mx-auto h-12 w-12 text-green-600 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Set Total Budget</h2>
              <p className="text-gray-600">What is the total budget for the campaign?</p>
            </div>
            
            <div className="max-w-md mx-auto">
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg">$</span>
                <input
                  type="number"
                  value={currentSetup.totalBudget || ''}
                  onChange={(e) => handleBudgetChange(Number(e.target.value))}
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
            
            {currentSetup.totalBudget > 0 && (
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <p className="text-green-800 font-medium">
                  Total Campaign Budget: ${currentSetup.totalBudget.toLocaleString()}
                </p>
                {currentSetup.totalBudget >= 100 && (
                  <div className="mt-2 text-sm text-green-700">
                    <Brain className="inline w-4 h-4 mr-1" />
                    Quick AI Preview: ~{Math.round(currentSetup.totalBudget * 1000).toLocaleString()} estimated reach
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Calendar className="mx-auto h-12 w-12 text-purple-600 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Define Campaign Duration</h2>
              <p className="text-gray-600">What is the duration of the campaign (in days)?</p>
            </div>
            
            <div className="max-w-md mx-auto">
              <input
                type="number"
                value={currentSetup.duration || ''}
                onChange={(e) => handleDurationChange(Number(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter number of days"
                min="1"
              />
            </div>
            
            {currentSetup.duration > 0 && (
              <div className="bg-purple-50 p-4 rounded-lg text-center">
                <p className="text-purple-800 font-medium">
                  Campaign Duration: {currentSetup.duration} day{currentSetup.duration > 1 ? 's' : ''}
                </p>
                <p className="text-purple-600 text-sm mt-1">
                  Daily Budget: ${(currentSetup.totalBudget / currentSetup.duration).toFixed(2)}
                </p>
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Zap className="mx-auto h-12 w-12 text-yellow-600 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose Platforms</h2>
              <p className="text-gray-600">Which platforms will the campaign be running on?</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {availablePlatforms.map(platform => (
                <button
                  key={platform}
                  onClick={() => handlePlatformSelection(platform)}
                  className={`p-4 border-2 rounded-lg text-sm font-medium transition-all ${
                    currentSetup.platforms.some(p => p.name === platform)
                      ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {platform}
                </button>
              ))}
            </div>
            
            {currentSetup.platforms.length > 0 && (
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-sm text-yellow-800">
                  Selected Platforms: {currentSetup.platforms.map(p => p.name).join(', ')}
                </p>
              </div>
            )}
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Percent className="mx-auto h-12 w-12 text-indigo-600 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Assign Platform Budgets</h2>
              <p className="text-gray-600">How much budget would you like to allocate to each platform?</p>
            </div>
            
            <div className="space-y-4">
              {currentSetup.platforms.map(platform => (
                <div key={platform.name} className="bg-white p-4 border border-gray-200 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {platform.name}
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={platform.budget || ''}
                      onChange={(e) => handlePlatformBudgetChange(platform.name, Number(e.target.value))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                      min="0"
                      max="100"
                    />
                    <span className="text-gray-500">%</span>
                    <span className="text-sm text-gray-600 min-w-0">
                      (${((currentSetup.totalBudget * platform.budget) / 100).toFixed(2)})
                    </span>
                  </div>
                </div>
              ))}
              
              <div className={`p-4 rounded-lg ${
                getTotalPlatformPercentage() === 100 
                  ? 'bg-green-50 text-green-800' 
                  : 'bg-red-50 text-red-800'
              }`}>
                <p className="font-medium">
                  Total: {getTotalPlatformPercentage()}% 
                  {getTotalPlatformPercentage() !== 100 && (
                    <span className="text-sm ml-2">
                      (Must equal 100%)
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Target className="mx-auto h-12 w-12 text-red-600 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Define Campaign Types</h2>
              <p className="text-gray-600">What type of campaign are you running on each platform?</p>
            </div>
            
            <div className="space-y-6">
              {currentSetup.platforms.map(platform => (
                <div key={platform.name} className="bg-white p-4 border border-gray-200 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">{platform.name}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {campaignTypes.map(type => (
                      <button
                        key={type}
                        onClick={() => handleCampaignTypeSelection(platform.name, type)}
                        className={`p-2 border rounded text-sm font-medium transition-all ${
                          platform.campaignTypes[type] !== undefined
                            ? 'border-red-500 bg-red-50 text-red-700'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                  
                  {Object.keys(platform.campaignTypes).length > 0 && (
                    <div className="mt-3 p-3 bg-red-50 rounded">
                      <p className="text-sm text-red-800">
                        Selected: {Object.keys(platform.campaignTypes).join(', ')}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Percent className="mx-auto h-12 w-12 text-teal-600 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Allocate Campaign Type Budgets</h2>
              <p className="text-gray-600">How much of each platform's budget goes to each campaign type?</p>
            </div>
            
            <div className="space-y-6">
              {currentSetup.platforms.map(platform => (
                <div key={platform.name} className="bg-white p-4 border border-gray-200 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">
                    {platform.name} 
                    <span className="text-sm text-gray-600 ml-2">
                      (${((currentSetup.totalBudget * platform.budget) / 100).toFixed(2)} total)
                    </span>
                  </h3>
                  
                  <div className="space-y-3">
                    {Object.keys(platform.campaignTypes).map(type => (
                      <div key={type} className="flex items-center space-x-3">
                        <label className="flex-1 text-sm font-medium text-gray-700">
                          {type}
                        </label>
                        <input
                          type="number"
                          value={platform.campaignTypes[type] || ''}
                          onChange={(e) => handleCampaignTypePercentage(platform.name, type, Number(e.target.value))}
                          className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="0"
                          min="0"
                          max="100"
                        />
                        <span className="text-gray-500 text-sm">%</span>
                        <span className="text-xs text-gray-600 min-w-0">
                          (${(((currentSetup.totalBudget * platform.budget) / 100) * (platform.campaignTypes[type] || 0) / 100).toFixed(2)})
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  <div className={`mt-3 p-2 rounded ${
                    getCampaignTypeTotal(platform.name) === 100 
                      ? 'bg-green-50 text-green-800' 
                      : 'bg-red-50 text-red-800'
                  }`}>
                    <p className="text-sm font-medium">
                      Total: {getCampaignTypeTotal(platform.name)}%
                      {getCampaignTypeTotal(platform.name) !== 100 && (
                        <span className="ml-2">(Must equal 100%)</span>
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 8:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Target className="mx-auto h-12 w-12 text-purple-600 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Content Types</h2>
              <p className="text-gray-600">Choose the types of content for this campaign and add any specific notes.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {contentTypes.map(contentType => {
                const isSelected = currentSetup.content.some(c => c.type === contentType);
                const selectedContent = currentSetup.content.find(c => c.type === contentType);
                
                return (
                  <div key={contentType} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <button
                        onClick={() => handleContentSelection(contentType)}
                        className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                          isSelected
                            ? 'border-purple-500 bg-purple-500 text-white'
                            : 'border-gray-300 hover:border-purple-300'
                        }`}
                      >
                        {isSelected && (
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <label 
                          onClick={() => handleContentSelection(contentType)}
                          className="text-sm font-medium text-gray-900 cursor-pointer block"
                        >
                          {contentType}
                        </label>
                        {isSelected && (
                          <textarea
                            value={selectedContent?.comment || ''}
                            onChange={(e) => handleContentComment(contentType, e.target.value)}
                            className="mt-2 w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="Add specific notes or requirements..."
                            rows={2}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {currentSetup.content.length > 0 && (
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-purple-800 font-medium mb-2">
                  Selected Content Types ({currentSetup.content.length}):
                </p>
                <div className="text-xs text-purple-700 space-y-1">
                  {currentSetup.content.map(content => (
                    <div key={content.type}>
                      • {content.type}
                      {content.comment && (
                        <span className="text-purple-600 ml-2 italic">
                          - {content.comment}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 9:
        const budgetImpact = calculateBudgetImpact(currentSetup);
        
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Brain className="mx-auto h-12 w-12 text-indigo-600 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">AI Budget Impact Analysis</h2>
              <p className="text-gray-600">See what results you can expect from your budget allocation.</p>
            </div>
            
            {/* Confidence Level */}
            <div className={`p-4 rounded-lg text-center ${
              budgetImpact.confidence === 'high' ? 'bg-green-50 text-green-800' :
              budgetImpact.confidence === 'medium' ? 'bg-yellow-50 text-yellow-800' :
              'bg-red-50 text-red-800'
            }`}>
              <p className="font-medium">
                Prediction Confidence: {budgetImpact.confidence.toUpperCase()}
                {budgetImpact.confidence === 'high' && ' ✓'}
                {budgetImpact.confidence === 'medium' && ' ⚠️'}
                {budgetImpact.confidence === 'low' && ' ⚡'}
              </p>
            </div>
            
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 border border-gray-200 rounded-lg text-center">
                <Users className="mx-auto h-8 w-8 text-blue-600 mb-2" />
                <p className="text-2xl font-bold text-gray-900">{budgetImpact.estimatedReach.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Estimated Reach</p>
              </div>
              
              <div className="bg-white p-4 border border-gray-200 rounded-lg text-center">
                <Eye className="mx-auto h-8 w-8 text-purple-600 mb-2" />
                <p className="text-2xl font-bold text-gray-900">{budgetImpact.estimatedImpressions.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Impressions</p>
              </div>
              
              <div className="bg-white p-4 border border-gray-200 rounded-lg text-center">
                <MousePointer className="mx-auto h-8 w-8 text-green-600 mb-2" />
                <p className="text-2xl font-bold text-gray-900">{budgetImpact.estimatedClicks.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Clicks</p>
              </div>
              
              <div className="bg-white p-4 border border-gray-200 rounded-lg text-center">
                <TrendingUp className="mx-auto h-8 w-8 text-orange-600 mb-2" />
                <p className="text-2xl font-bold text-gray-900">{budgetImpact.estimatedConversions.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Conversions</p>
              </div>
            </div>
            
            {/* Cost Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">Cost Per Click (CPC)</h4>
                <p className="text-2xl font-bold text-blue-700">${budgetImpact.costPerClick}</p>
              </div>
              
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                <h4 className="font-medium text-green-900 mb-2">Cost Per Conversion</h4>
                <p className="text-2xl font-bold text-green-700">${budgetImpact.costPerConversion}</p>
              </div>
            </div>
            
            {/* AI Insights */}
            <div className="bg-indigo-50 p-6 rounded-lg border border-indigo-200">
              <h4 className="font-medium text-indigo-900 mb-3 flex items-center">
                <Brain className="w-5 h-5 mr-2" />
                AI Insights
              </h4>
              <ul className="space-y-2">
                {budgetImpact.insights.map((insight, index) => (
                  <li key={index} className="text-sm text-indigo-800 flex items-start">
                    <span className="w-2 h-2 bg-indigo-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    {insight}
                  </li>
                ))}
              </ul>
            </div>
            
            {/* AI Recommendations */}
            <div className="bg-amber-50 p-6 rounded-lg border border-amber-200">
              <h4 className="font-medium text-amber-900 mb-3 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                AI Recommendations
              </h4>
              <ul className="space-y-2">
                {budgetImpact.recommendations.map((rec, index) => (
                  <li key={index} className="text-sm text-amber-800 flex items-start">
                    <span className="w-2 h-2 bg-amber-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );

      case 10:
        const remainingCountries = currentSetup.countries.filter(country => 
          !savedSetups.some(setup => setup.countries.includes(country)) &&
          !countrySetups.some(setup => setup.countries.includes(country))
        );

        return (
          <div className="space-y-6">
            <div className="text-center">
              <RotateCcw className="mx-auto h-12 w-12 text-blue-600 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Complete Setup</h2>
              <p className="text-gray-600">
                Save this setup and optionally apply it to remaining countries.
              </p>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Current Setup Summary:</h3>
              <div className="space-y-2 text-sm">
                <p><strong>Countries:</strong> {currentSetup.countries.join(', ')}</p>
                <p><strong>Budget:</strong> ${currentSetup.totalBudget.toLocaleString()}</p>
                <p><strong>Duration:</strong> {currentSetup.duration} days</p>
                <p><strong>Platforms:</strong> {currentSetup.platforms.map(p => p.name).join(', ')}</p>
                <p><strong>Content Types:</strong> {currentSetup.content.length} selected</p>
              </div>
            </div>
            
            {remainingCountries.length > 0 && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800 mb-2">
                  <strong>Remaining Countries:</strong> {remainingCountries.join(', ')}
                </p>
                <p className="text-xs text-blue-600">
                  You can apply the same setup to all remaining countries with one click.
                </p>
              </div>
            )}
            
            <div className="flex flex-col space-y-3">
              <button
                onClick={finishCountrySetup}
                className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
              >
                <Save className="inline w-4 h-4 mr-2" />
                Save This Setup
              </button>
              
              {remainingCountries.length > 0 && (
                <button
                  onClick={copyPreviousSetup}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  <RotateCcw className="inline w-4 h-4 mr-2" />
                  Save & Apply to All Remaining Countries ({remainingCountries.length})
                </button>
              )}
              
              <button
                onClick={() => setCurrentStep(1)}
                className="w-full px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
              >
                Start New Setup
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return currentSetup.countries.length > 0;
      case 2: return currentSetup.totalBudget > 0;
      case 3: return currentSetup.duration > 0;
      case 4: return currentSetup.platforms.length > 0;
      case 5: return getTotalPlatformPercentage() === 100;
      case 6: return currentSetup.platforms.every(p => Object.keys(p.campaignTypes).length > 0);
      case 7: return currentSetup.platforms.every(p => getCampaignTypeTotal(p.name) === 100);
      case 8: return currentSetup.content.length > 0;
      case 9: return true; // AI analysis step - always allow to proceed
      default: return false;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600">
            <h1 className="text-2xl font-bold text-white">Campaign Setup Form</h1>
            <p className="text-blue-100">Step-by-Step Process</p>
            {savedSetups.length > 0 && (
              <div className="mt-2 text-sm text-blue-100">
                {savedSetups.length} of {availableCountries.length} countries configured
              </div>
            )}
          </div>
          
          {/* Progress Bar */}
          <div className="px-6 py-4 bg-gray-50 border-b">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">
                Step {currentStep} of 10
              </span>
              <div className="flex-1 mx-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(currentStep / 10) * 100}%` }}
                  ></div>
                </div>
              </div>
              <span className="text-sm font-medium text-gray-600">
                {Math.round((currentStep / 10) * 100)}%
              </span>
            </div>
          </div>
          
          {/* Step Content */}
          <div className="px-6 py-8">
            {renderStepContent()}
          </div>
          
          {/* Navigation */}
          <div className="px-6 py-4 bg-gray-50 border-t flex justify-between">
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            <button
              onClick={nextStep}
              disabled={!canProceed() || currentStep === 10}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {currentStep === 10 ? 'Complete' : 'Next'}
            </button>
          </div>
        </div>
        
        {/* Saved Setups */}
        {savedSetups.length > 0 && (
          <div className="mt-8 bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 bg-gray-800 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Saved Campaign Setups</h2>
              <button
                onClick={clearAllSetups}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium flex items-center"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All
              </button>
            </div>
            <div className="px-6 py-4 max-h-96 overflow-y-auto">
              {savedSetups.map((setup, index) => (
                <div key={index} className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-gray-900">
                      {setup.countries.join(', ')}
                    </h3>
                    <button
                      onClick={() => deleteSetup(index)}
                      className="text-red-500 hover:text-red-700 p-1"
                      title="Delete this setup"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>Budget:</strong> ${setup.totalBudget.toLocaleString()}</p>
                    <p><strong>Duration:</strong> {setup.duration} days</p>
                    <p><strong>Daily Budget:</strong> ${(setup.totalBudget / setup.duration).toFixed(2)}</p>
                    <p><strong>Platforms:</strong> {setup.platforms.map(p => p.name).join(', ')}</p>
                    <p><strong>Content Types:</strong> {setup.content?.length || 0} selected</p>
                    
                    {setup.budgetImpact && (
                      <div className="mt-2 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded border border-indigo-200">
                        <p className="text-xs font-medium text-indigo-700 mb-2 flex items-center">
                          <Brain className="w-3 h-3 mr-1" />
                          AI Impact Analysis
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="text-gray-600">
                            <span className="font-medium">Reach:</span> {setup.budgetImpact.estimatedReach.toLocaleString()}
                          </div>
                          <div className="text-gray-600">
                            <span className="font-medium">Clicks:</span> {setup.budgetImpact.estimatedClicks.toLocaleString()}
                          </div>
                          <div className="text-gray-600">
                            <span className="font-medium">Conversions:</span> {setup.budgetImpact.estimatedConversions.toLocaleString()}
                          </div>
                          <div className="text-gray-600">
                            <span className="font-medium">CPC:</span> ${setup.budgetImpact.costPerClick}
                          </div>
                        </div>
                        <div className={`mt-2 px-2 py-1 rounded text-xs text-center ${
                          setup.budgetImpact.confidence === 'high' ? 'bg-green-100 text-green-700' :
                          setup.budgetImpact.confidence === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {setup.budgetImpact.confidence.toUpperCase()} Confidence
                        </div>
                      </div>
                    )}
                    
                    {setup.content && setup.content.length > 0 && (
                      <div className="mt-2 p-2 bg-white rounded border">
                        <p className="text-xs font-medium text-gray-700 mb-1">Selected Content:</p>
                        {setup.content.slice(0, 3).map(content => (
                          <div key={content.type} className="text-xs text-gray-600 mb-1">
                            • {content.type}
                            {content.comment && (
                              <span className="text-gray-500 ml-1 italic">- {content.comment}</span>
                            )}
                          </div>
                        ))}
                        {setup.content.length > 3 && (
                          <p className="text-xs text-gray-500 italic">
                            +{setup.content.length - 3} more content types...
                          </p>
                        )}
                      </div>
                    )}
                    
                    {setup.platforms.length > 0 && (
                      <div className="mt-2 p-2 bg-white rounded border">
                        <p className="text-xs font-medium text-gray-700 mb-1">Platform Allocation:</p>
                        {setup.platforms.map(platform => (
                          <div key={platform.name} className="text-xs text-gray-600 mb-1">
                            <strong>{platform.name}:</strong> {platform.budget}% 
                            (${((setup.totalBudget * platform.budget) / 100).toFixed(2)})
                            {Object.keys(platform.campaignTypes).length > 0 && (
                              <div className="ml-2 mt-1">
                                {Object.entries(platform.campaignTypes).map(([type, percentage]) => (
                                  <div key={type} className="text-xs text-gray-500">
                                    • {type}: {percentage}% 
                                    (${(((setup.totalBudget * platform.budget) / 100) * (percentage / 100)).toFixed(2)})
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CampaignSetup;
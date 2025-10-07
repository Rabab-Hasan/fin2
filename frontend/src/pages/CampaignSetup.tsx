import React, { useState, useEffect } from 'react';
import { Globe, DollarSign, Calendar, Zap, Target, Percent, RotateCcw, Save, Trash2, Brain, TrendingUp, Users, Eye, MousePointer, Database, Plus, CheckCircle } from 'lucide-react';
import { calculateDataDrivenEstimates, type EstimationResult } from '../utils/campaignEstimations';
import { useAuth } from '../contexts/AuthContext';
import { useClient } from '../contexts/ClientContext';
import CampaignAssistantComponent from '../components/CampaignAssistantComponent';

interface Platform {
  name: string;
  budget: number;
  campaignTypes: { [key: string]: number };
}

interface ContentItem {
  type: string;
  comment: string;
}

interface BudgetImpact extends EstimationResult {
  // EstimationResult already includes all the properties we need
}

interface CountrySetup {
  countries: string[];
  totalBudget: number;
  duration: number;
  platforms: Platform[];
  content: ContentItem[];
  budgetImpact?: BudgetImpact;
}

interface SavedCampaign {
  id?: number;
  name: string;
  countries: string[];
  totalBudget: number;
  duration: number;
  platforms: Platform[];
  content: ContentItem[];
  budgetImpact?: BudgetImpact;
  createdAt?: string;
  status?: string;
}

const CampaignSetup: React.FC = () => {
  const { user } = useAuth();
  const { selectedClient } = useClient();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [currentCountryIndex, setCurrentCountryIndex] = useState(0);
  const [countrySetups, setCountrySetups] = useState<CountrySetup[]>([]);
  const [savedSetups, setSavedSetups] = useState<CountrySetup[]>([]);
  const [savedCampaigns, setSavedCampaigns] = useState<SavedCampaign[]>([]);
  const [campaignName, setCampaignName] = useState('');
  const [isCreatingCampaign, setIsCreatingCampaign] = useState(false);
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
    
    // Load saved campaigns from backend
    loadSavedCampaigns();
  }, [selectedClient]);

  // Save setups to localStorage whenever savedSetups changes
  useEffect(() => {
    localStorage.setItem('campaignSetups', JSON.stringify(savedSetups));
  }, [savedSetups]);

  // Load saved campaigns from backend
  const loadSavedCampaigns = async () => {
    if (!selectedClient) return;
    
    try {
      const response = await fetch(`/api/campaigns?client_id=${selectedClient.id}`);
      if (response.ok) {
        const campaigns = await response.json();
        setSavedCampaigns(campaigns.map((campaign: any) => ({
          id: campaign.id,
          name: campaign.name,
          countries: campaign.countries || [],
          totalBudget: campaign.budget || 0,
          duration: campaign.duration || 0,
          platforms: campaign.platforms || [],
          content: campaign.content || [],
          budgetImpact: campaign.budget_impact,
          createdAt: campaign.created_at,
          status: campaign.status || 'active'
        })));
      }
    } catch (error) {
      console.error('Error loading saved campaigns:', error);
    }
  };

  // Save campaign to backend
  const saveCampaignToBackend = async () => {
    if (!campaignName.trim() || !selectedClient || !user) {
      alert('Please enter a campaign name and ensure you have a client selected');
      return;
    }

    if (currentSetup.countries.length === 0) {
      alert('Please select at least one country');
      return;
    }

    if (currentSetup.platforms.length === 0) {
      alert('Please select at least one platform');
      return;
    }

    setIsCreatingCampaign(true);

    try {
      const budgetImpact = calculateBudgetImpact(currentSetup);
      
      const campaignData = {
        name: campaignName,
        type: 'Media Plan',
        budget: currentSetup.totalBudget,
        productService: 'Campaign from Media Plan Setup',
        objective: `Multi-platform campaign for ${currentSetup.countries.join(', ')}`,
        narrative: `Campaign targeting ${currentSetup.countries.join(', ')} with budget of $${currentSetup.totalBudget.toLocaleString()} over ${currentSetup.duration} days`,
        concept: currentSetup.platforms.map(p => p.name).join(', ') + ' campaign',
        tagline: campaignName,
        heroArtwork: null,
        accountManagerId: user._id,
        activities: currentSetup.platforms.map(p => p.name.toLowerCase().replace(/\s+/g, '_')),
        internalApprovalRequired: false,
        clientApprovalRequired: false,
        clientId: selectedClient.id,
        createdBy: user._id,
        // Additional campaign setup data
        countries: currentSetup.countries,
        duration: currentSetup.duration,
        platforms: currentSetup.platforms,
        content: currentSetup.content,
        budgetImpact: budgetImpact
      };

      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(campaignData)
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Campaign "${campaignName}" created successfully!`);
        
        // Reset form
        setCampaignName('');
        setCurrentSetup({
          countries: [],
          totalBudget: 0,
          duration: 0,
          platforms: [],
          content: []
        });
        setCurrentStep(1);
        
        // Reload campaigns
        await loadSavedCampaigns();
      } else {
        const error = await response.json();
        alert(`Error creating campaign: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
      alert('Error creating campaign. Please try again.');
    } finally {
      setIsCreatingCampaign(false);
    }
  };

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

  // Handle applying recommendations from the AI assistant
  const handleRecommendationApply = (type: string, data: any) => {
    if (type === 'content') {
      // Add recommended content if not already selected
      if (!currentSetup.content.some(c => c.type === data)) {
        setCurrentSetup({
          ...currentSetup,
          content: [...currentSetup.content, { type: data, comment: '' }]
        });
      }
    }
    // Add other recommendation types as needed
  };

  // Data-Driven Budget Impact Prediction using GFH Historical Data
  const calculateBudgetImpact = (setup: CountrySetup): BudgetImpact => {
    const { totalBudget, duration, platforms, countries, content } = setup;
    
    // Use the new data-driven estimation function
    const result = calculateDataDrivenEstimates(
      totalBudget,
      platforms,
      countries,
      duration,
      content.length
    );
    
    return {
      estimatedReach: result.estimatedReach,
      estimatedImpressions: result.estimatedImpressions,
      estimatedClicks: result.estimatedClicks,
      estimatedConversions: result.estimatedConversions,
      costPerClick: result.costPerClick,
      costPerConversion: result.costPerConversion,
      confidence: result.confidence,
      insights: result.insights,
      recommendations: result.recommendations,
      averageCPM: result.averageCPM,
      averageCPC: result.averageCPC,
      averageCTR: result.averageCTR,
      dataPoints: result.dataPoints
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

  const finishCountrySetup = async () => {
    const budgetImpact = calculateBudgetImpact(currentSetup);
    const newSetup = { ...currentSetup, budgetImpact };
    
    // Auto-generate campaign name if not provided
    const autoGeneratedName = `Campaign_${currentSetup.countries.join('_')}_${Date.now()}`;
    
    // Automatically save as campaign to backend
    if (selectedClient && user && currentSetup.countries.length > 0) {
      try {
        const campaignData = {
          name: autoGeneratedName,
          type: 'Media Plan',
          budget: currentSetup.totalBudget,
          productService: 'Campaign from Media Plan Setup',
          objective: `Multi-platform campaign for ${currentSetup.countries.join(', ')}`,
          narrative: `Campaign targeting ${currentSetup.countries.join(', ')} with budget of $${currentSetup.totalBudget.toLocaleString()} over ${currentSetup.duration} days`,
          concept: currentSetup.platforms.map(p => p.name).join(', ') + ' campaign',
          tagline: autoGeneratedName,
          heroArtwork: null,
          accountManagerId: user._id,
          activities: currentSetup.platforms.map(p => p.name.toLowerCase().replace(/\s+/g, '_')),
          internalApprovalRequired: false,
          clientApprovalRequired: false,
          clientId: selectedClient.id,
          createdBy: user._id,
          // Additional campaign setup data
          countries: currentSetup.countries,
          duration: currentSetup.duration,
          platforms: currentSetup.platforms,
          content: currentSetup.content,
          budgetImpact: budgetImpact,
          estimatedReach: budgetImpact.estimatedReach,
          estimatedImpressions: budgetImpact.estimatedImpressions,
          estimatedClicks: budgetImpact.estimatedClicks,
          estimatedCtr: budgetImpact.averageCTR,
          campaignData: newSetup
        };

        const response = await fetch('/api/campaigns', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(campaignData)
        });

        if (response.ok) {
          console.log('✅ Campaign auto-saved successfully!');
          // Reload campaigns to show in table
          await loadSavedCampaigns();
        } else {
          console.error('❌ Failed to auto-save campaign');
        }
      } catch (error) {
        console.error('❌ Error auto-saving campaign:', error);
      }
    }
    
    // Also keep in local setups for backward compatibility
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

  const copyPreviousSetup = async () => {
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
        
        // Save each setup as a campaign automatically
        if (selectedClient && user) {
          for (const setup of newSetups) {
            const autoGeneratedName = `Campaign_${setup.countries.join('_')}_${Date.now()}`;
            const budgetImpact = calculateBudgetImpact(setup);
            
            try {
              const campaignData = {
                name: autoGeneratedName,
                type: 'Media Plan',
                budget: setup.totalBudget,
                productService: 'Campaign from Media Plan Setup',
                objective: `Multi-platform campaign for ${setup.countries.join(', ')}`,
                narrative: `Campaign targeting ${setup.countries.join(', ')} with budget of $${setup.totalBudget.toLocaleString()} over ${setup.duration} days`,
                concept: setup.platforms.map(p => p.name).join(', ') + ' campaign',
                tagline: autoGeneratedName,
                heroArtwork: null,
                accountManagerId: user._id,
                activities: setup.platforms.map(p => p.name.toLowerCase().replace(/\s+/g, '_')),
                internalApprovalRequired: false,
                clientApprovalRequired: false,
                clientId: selectedClient.id,
                createdBy: user._id,
                countries: setup.countries,
                duration: setup.duration,
                platforms: setup.platforms,
                content: setup.content,
                budgetImpact: budgetImpact,
                estimatedReach: budgetImpact.estimatedReach,
                estimatedImpressions: budgetImpact.estimatedImpressions,
                estimatedClicks: budgetImpact.estimatedClicks,
                estimatedCtr: budgetImpact.averageCTR,
                campaignData: setup
              };

              const response = await fetch('/api/campaigns', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(campaignData)
              });

              if (response.ok) {
                console.log(`✅ Campaign for ${setup.countries.join(', ')} auto-saved successfully!`);
              }
            } catch (error) {
              console.error(`❌ Error saving campaign for ${setup.countries.join(', ')}:`, error);
            }
          }
          
          // Reload campaigns to show in table
          await loadSavedCampaigns();
        }
        
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
                <p className="text-sm text-blue-800 mb-2">
                  Selected: {currentSetup.countries.join(', ')}
                </p>
                {currentSetup.countries.includes('Saudi Arabia') && (
                  <div className="text-xs text-green-700 bg-green-50 p-2 rounded border border-green-200 mb-1">
                    <Brain className="inline w-3 h-3 mr-1" />
                    <strong>GFH Data:</strong> Saudi Arabia shows strong performance: 1.18% CTR, $0.21 CPC
                  </div>
                )}
                {currentSetup.countries.includes('Oman') && (
                  <div className="text-xs text-emerald-700 bg-emerald-50 p-2 rounded border border-emerald-200 mb-1">
                    <Brain className="inline w-3 h-3 mr-1" />
                    <strong>GFH Insight:</strong> Oman has excellent cost efficiency: 3.01% CTR, $0.071 CPC - highly recommended!
                  </div>
                )}
                {currentSetup.countries.includes('Qatar') && (
                  <div className="text-xs text-blue-700 bg-blue-50 p-2 rounded border border-blue-200 mb-1">
                    <Brain className="inline w-3 h-3 mr-1" />
                    <strong>GFH Data:</strong> Qatar offers good app install performance: $2.80 CPI
                  </div>
                )}
                {currentSetup.countries.length >= 3 && (
                  <div className="text-xs text-purple-700 bg-purple-50 p-2 rounded border border-purple-200">
                    <Brain className="inline w-3 h-3 mr-1" />
                    <strong>Multi-Market Strategy:</strong> Consider A/B testing different creative approaches per market
                  </div>
                )}
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
                {currentSetup.totalBudget >= 100 && currentSetup.countries.length > 0 && (
                  <div className="mt-2 text-sm text-green-700">
                    <Database className="inline w-4 h-4 mr-1" />
                    Quick Data Preview: Based on GFH historical performance data
                  </div>
                )}
                {currentSetup.totalBudget >= 20000 && (
                  <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                    <p className="text-xs text-blue-700">
                      <Brain className="inline w-3 h-3 mr-1" />
                      <strong>AI Insight:</strong> High-budget campaigns perform best with Meta + Google combination (based on GFH data)
                    </p>
                  </div>
                )}
                {currentSetup.totalBudget < 5000 && currentSetup.totalBudget > 0 && (
                  <div className="mt-2 p-2 bg-yellow-50 rounded border border-yellow-200">
                    <p className="text-xs text-yellow-700">
                      <Brain className="inline w-3 h-3 mr-1" />
                      <strong>AI Tip:</strong> For budget-conscious campaigns, focus on Meta platform for best cost-efficiency
                    </p>
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
                <p className="text-sm text-yellow-800 mb-2">
                  Selected Platforms: {currentSetup.platforms.map(p => p.name).join(', ')}
                </p>
                {currentSetup.platforms.some(p => p.name.includes('Meta')) && (
                  <div className="text-xs text-green-700 bg-green-50 p-2 rounded border border-green-200 mb-1">
                    <Brain className="inline w-3 h-3 mr-1" />
                    <strong>GFH Data:</strong> Meta shows 1.90% average CTR and $0.127 CPC in your target markets
                  </div>
                )}
                {currentSetup.platforms.some(p => p.name.includes('Google')) && (
                  <div className="text-xs text-blue-700 bg-blue-50 p-2 rounded border border-blue-200 mb-1">
                    <Brain className="inline w-3 h-3 mr-1" />
                    <strong>GFH Data:</strong> Google UAC excels at app installs with 4.76% CTR
                  </div>
                )}
                {currentSetup.platforms.some(p => p.name === 'LinkedIn') && (
                  <div className="text-xs text-purple-700 bg-purple-50 p-2 rounded border border-purple-200">
                    <Brain className="inline w-3 h-3 mr-1" />
                    <strong>GFH Data:</strong> LinkedIn has lower CTR (0.13%) but targets professional audiences effectively
                  </div>
                )}
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
                {getTotalPlatformPercentage() === 100 && currentSetup.totalBudget > 0 && currentSetup.countries.length > 0 && (
                  <div className="mt-3 p-3 bg-white rounded border border-green-200">
                    <p className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <Database className="w-4 h-4 mr-2" />
                      Quick Estimation Preview
                    </p>
                    {(() => {
                      const quickEstimate = calculateDataDrivenEstimates(
                        currentSetup.totalBudget,
                        currentSetup.platforms,
                        currentSetup.countries,
                        currentSetup.duration || 7,
                        0
                      );
                      return (
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="text-gray-600">
                            <span className="font-medium">Est. Impressions:</span> {quickEstimate.estimatedImpressions.toLocaleString()}
                          </div>
                          <div className="text-gray-600">
                            <span className="font-medium">Est. Clicks:</span> {quickEstimate.estimatedClicks.toLocaleString()}
                          </div>
                          <div className="text-gray-600">
                            <span className="font-medium">Avg CPM:</span> ${quickEstimate.averageCPM.toFixed(2)}
                          </div>
                          <div className="text-gray-600">
                            <span className="font-medium">Avg CPC:</span> ${quickEstimate.averageCPC.toFixed(2)}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
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
                <div className="text-xs text-purple-700 space-y-1 mb-3">
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
                {currentSetup.content.some(c => c.type.includes('Influencer')) && (
                  <div className="text-xs text-green-700 bg-green-50 p-2 rounded border border-green-200 mb-1">
                    <Brain className="inline w-3 h-3 mr-1" />
                    <strong>AI Insight:</strong> Influencer content typically shows +70% engagement boost on Instagram and TikTok
                  </div>
                )}
                {currentSetup.content.some(c => c.type.includes('Last-Chance')) && (
                  <div className="text-xs text-blue-700 bg-blue-50 p-2 rounded border border-blue-200 mb-1">
                    <Brain className="inline w-3 h-3 mr-1" />
                    <strong>GFH Strategy:</strong> Last-chance content performs best in final 2 weeks of campaign
                  </div>
                )}
                {currentSetup.content.length >= 6 && (
                  <div className="text-xs text-indigo-700 bg-indigo-50 p-2 rounded border border-indigo-200">
                    <Brain className="inline w-3 h-3 mr-1" />
                    <strong>Content Strategy:</strong> Good content diversity! Plan to rotate content every 7-10 days for optimal performance
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case 9:
        const budgetImpact = calculateBudgetImpact(currentSetup);
        
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Database className="mx-auto h-12 w-12 text-indigo-600 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">GFH Data-Driven Analysis</h2>
              <p className="text-gray-600">Predictions based on historical campaign performance data</p>
            </div>
            
            {/* Confidence Level & Data Points */}
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
              <p className="text-sm mt-1">
                Based on {budgetImpact.dataPoints} historical data points from GFH campaigns
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

            {/* Historical Performance Metrics */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-4 flex items-center">
                <Database className="w-5 h-5 mr-2" />
                Historical Performance Metrics
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-700">${budgetImpact.averageCPM.toFixed(2)}</p>
                  <p className="text-sm text-blue-600">Average CPM</p>
                  <p className="text-xs text-blue-500 mt-1">Cost per 1,000 impressions</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-700">${budgetImpact.averageCPC.toFixed(2)}</p>
                  <p className="text-sm text-blue-600">Average CPC</p>
                  <p className="text-xs text-blue-500 mt-1">Cost per click</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-700">{budgetImpact.averageCTR.toFixed(2)}%</p>
                  <p className="text-sm text-blue-600">Average CTR</p>
                  <p className="text-xs text-blue-500 mt-1">Click-through rate</p>
                </div>
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
            
            {/* Data-Driven Insights */}
            <div className="bg-indigo-50 p-6 rounded-lg border border-indigo-200">
              <h4 className="font-medium text-indigo-900 mb-3 flex items-center">
                <Database className="w-5 h-5 mr-2" />
                Data-Driven Insights
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
            
            {/* Strategic Recommendations */}
            <div className="bg-amber-50 p-6 rounded-lg border border-amber-200">
              <h4 className="font-medium text-amber-900 mb-3 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                Strategic Recommendations
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
                <CheckCircle className="inline w-4 h-4 mr-2" />
                Save Campaign to Database & Table
              </button>
              
              {remainingCountries.length > 0 && (
                <button
                  onClick={copyPreviousSetup}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  <CheckCircle className="inline w-4 h-4 mr-2" />
                  Save {remainingCountries.length} Campaigns to Database & Table
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Saved Campaigns Table - ALWAYS VISIBLE */}
        <div className="mb-8 bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 bg-green-600">
            <h2 className="text-xl font-bold text-white flex items-center">
              <Database className="w-6 h-6 mr-2" />
              All Saved Campaigns ({savedCampaigns.length})
            </h2>
            <p className="text-green-100 text-sm">All your created campaigns appear in this table</p>
          </div>
          
          {savedCampaigns.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Campaign Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Countries
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Budget
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Platforms
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Est. Reach
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Est. Impressions
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Est. Clicks
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {savedCampaigns.map((campaign) => (
                    <tr key={campaign.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{campaign.name}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {campaign.countries.length > 0 ? campaign.countries.join(', ') : 'N/A'}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-green-600">
                          ${campaign.totalBudget.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">{campaign.duration} days</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {campaign.platforms.length > 0 ? campaign.platforms.map(p => p.name).join(', ') : 'N/A'}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-blue-600">
                          {campaign.budgetImpact?.estimatedReach?.toLocaleString() || 'N/A'}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-purple-600">
                          {campaign.budgetImpact?.estimatedImpressions?.toLocaleString() || 'N/A'}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-orange-600">
                          {campaign.budgetImpact?.estimatedClicks?.toLocaleString() || 'N/A'}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {campaign.createdAt ? new Date(campaign.createdAt).toLocaleDateString() : 'N/A'}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          campaign.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {campaign.status || 'Active'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-12 text-center">
              <Database className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns created yet</h3>
              <p className="text-gray-600">Create your first campaign using the form below and it will appear here.</p>
            </div>
          )}
        </div>

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

        {/* Create Campaign Section */}
        {currentStep === 10 && currentSetup.countries.length > 0 && (
          <div className="mt-8 bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 bg-green-600">
              <h2 className="text-xl font-bold text-white flex items-center">
                <Plus className="w-6 h-6 mr-2" />
                Create Campaign
              </h2>
            </div>
            <div className="px-6 py-6">
              <div className="mb-4">
                <label htmlFor="campaignName" className="block text-sm font-medium text-gray-700 mb-2">
                  Campaign Name *
                </label>
                <input
                  type="text"
                  id="campaignName"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="Enter campaign name..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h4 className="font-medium text-gray-900 mb-2">Campaign Summary</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <strong>Countries:</strong> {currentSetup.countries.join(', ')}
                  </div>
                  <div>
                    <strong>Budget:</strong> ${currentSetup.totalBudget.toLocaleString()}
                  </div>
                  <div>
                    <strong>Duration:</strong> {currentSetup.duration} days
                  </div>
                  <div>
                    <strong>Platforms:</strong> {currentSetup.platforms.map(p => p.name).join(', ')}
                  </div>
                </div>
              </div>

              <button
                onClick={saveCampaignToBackend}
                disabled={!campaignName.trim() || isCreatingCampaign}
                className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center"
              >
                {isCreatingCampaign ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Creating Campaign...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Create Campaign
                  </>
                )}
              </button>
            </div>
          </div>
        )}


        
        {/* Campaign Assistant - Always visible when setup is in progress */}
        {(currentStep > 1 || currentSetup.countries.length > 0) && (
          <div className="mt-8">
            <CampaignAssistantComponent
              budget={currentSetup.totalBudget}
              duration={currentSetup.duration}
              countries={currentSetup.countries}
              platforms={currentSetup.platforms.map(p => p.name)}
              objectives={currentSetup.platforms.flatMap(p => Object.keys(p.campaignTypes))}
              contentSelected={currentSetup.content.map(c => c.type)}
              onRecommendationApply={handleRecommendationApply}
            />
          </div>
        )}

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
                          <Database className="w-3 h-3 mr-1" />
                          GFH Data Analysis ({setup.budgetImpact.dataPoints || 0} data points)
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="text-gray-600">
                            <span className="font-medium">Reach:</span> {setup.budgetImpact.estimatedReach.toLocaleString()}
                          </div>
                          <div className="text-gray-600">
                            <span className="font-medium">Impressions:</span> {setup.budgetImpact.estimatedImpressions.toLocaleString()}
                          </div>
                          <div className="text-gray-600">
                            <span className="font-medium">Clicks:</span> {setup.budgetImpact.estimatedClicks.toLocaleString()}
                          </div>
                          <div className="text-gray-600">
                            <span className="font-medium">Conversions:</span> {setup.budgetImpact.estimatedConversions.toLocaleString()}
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-1 mt-2 text-xs">
                          <div className="text-gray-600">
                            <span className="font-medium">CPM:</span> ${setup.budgetImpact.averageCPM?.toFixed(2) || 'N/A'}
                          </div>
                          <div className="text-gray-600">
                            <span className="font-medium">CPC:</span> ${setup.budgetImpact.averageCPC?.toFixed(2) || setup.budgetImpact.costPerClick}
                          </div>
                          <div className="text-gray-600">
                            <span className="font-medium">CTR:</span> {setup.budgetImpact.averageCTR?.toFixed(2) || 'N/A'}%
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
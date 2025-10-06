import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, CheckCircle, AlertCircle, Loader2, Sparkles, Rocket, Target, Users, Palette, Award } from 'lucide-react';
import Card from './Card';
import { useClient } from '../contexts/ClientContext';
import { useAuth } from '../contexts/AuthContext';

interface CampaignWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (campaign: any) => void;
}

interface CampaignData {
  name: string;
  type: string;
  budget: number;
  productService: string;
  objective: string;
  narrative: string;
  concept: string;
  tagline: string;
  heroArtwork: string;
  accountManagerId: string;
  activities: string[];
  internalApprovalRequired: boolean;
  clientApprovalRequired: boolean;
}

interface AIValidation {
  isValid: boolean;
  feedback: string;
  suggestions: string[];
  score: number;
}

const MARKETING_ACTIVITIES = [
  { id: 'video_ads', label: 'Video Advertisements', description: 'Create engaging video content for digital platforms' },
  { id: 'photoshoot', label: 'Photo Shoot', description: 'Professional photography for brand assets' },
  { id: 'events', label: 'Events & Activations', description: 'Live experiences and brand activations' },
  { id: 'influencers', label: 'Influencer Marketing', description: 'Partner with content creators and influencers' },
  { id: 'outdoor', label: 'Outdoor Advertising', description: 'Billboards, transit ads, and outdoor displays' },
  { id: 'radio', label: 'Radio Campaigns', description: 'Audio advertising across radio platforms' },
  { id: 'pr', label: 'Public Relations', description: 'Media relations and press coverage' },
  { id: 'sponsorships', label: 'Sponsorships', description: 'Brand partnerships and sponsorship opportunities' },
];

const CampaignWizard: React.FC<CampaignWizardProps> = ({ isOpen, onClose, onSuccess }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiValidating, setAiValidating] = useState(false);
  const [aiValidation, setAiValidation] = useState<AIValidation | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const { selectedClient } = useClient();
  const { user } = useAuth();

  // Total number of questions (one question per step)
  const totalSteps = 12;

  const [campaignData, setCampaignData] = useState<CampaignData>({
    name: '',
    type: '',
    budget: 0,
    productService: '',
    objective: '',
    narrative: '',
    concept: '',
    tagline: '',
    heroArtwork: '',
    accountManagerId: '',
    activities: [],
    internalApprovalRequired: false,
    clientApprovalRequired: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch employee users only (excluding client users) for account manager selection
  useEffect(() => {
    const fetchEmployeeUsers = async () => {
      try {
        const response = await fetch('/api/auth/users');
        if (response.ok) {
          const result = await response.json();
          // Filter to only include employee users (excluding client users)
          const employeeUsers = result.users.filter((user: any) => 
            user.role === 'employee' || user.role === 'admin'
          );
          setUsers(employeeUsers);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    if (isOpen) {
      fetchEmployeeUsers();
    }
  }, [isOpen]);

  // AI Validation function
  const validateWithAI = async (stepData: Partial<CampaignData>) => {
    setAiValidating(true);
    try {
      const response = await fetch('/api/campaigns/new/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(stepData),
      });

      if (response.ok) {
        const validation = await response.json();
        setAiValidation(validation);
        return validation;
      }
    } catch (error) {
      console.error('AI validation error:', error);
    } finally {
      setAiValidating(false);
    }
    return null;
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1: // Campaign Name
        if (!campaignData.name.trim()) newErrors.name = 'Campaign name is required';
        break;
      case 2: // Campaign Type
        if (!campaignData.type.trim()) newErrors.type = 'Campaign type is required';
        break;
      case 3: // Budget
        // Budget is optional, no validation needed
        break;
      case 4: // Product/Service
        if (!campaignData.productService.trim()) newErrors.productService = 'Product/Service is required';
        break;
      case 5: // Campaign Objective
        if (!campaignData.objective.trim()) newErrors.objective = 'Campaign objective is required';
        break;
      case 6: // Campaign Narrative
        if (!campaignData.narrative.trim()) newErrors.narrative = 'Campaign narrative is required';
        break;
      case 7: // Creative Concept
        if (!campaignData.concept.trim()) newErrors.concept = 'Creative concept is required';
        break;
      case 8: // Tagline
        // Tagline is optional, no validation needed
        break;
      case 9: // Hero Artwork
        // Hero artwork is optional, no validation needed
        break;
      case 10: // Account Manager
        if (!campaignData.accountManagerId || campaignData.accountManagerId.trim() === '') newErrors.accountManagerId = 'Account manager is required';
        break;
      case 11: // Marketing Activities
        if (campaignData.activities.length === 0) newErrors.activities = 'At least one activity must be selected';
        break;
      case 12: // Review & Approval
        // Final validation happens here
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (!validateStep(currentStep)) return;

    // Trigger AI validation on key steps
    if (currentStep === 5 || currentStep === 11) {
      await validateWithAI({
        name: campaignData.name,
        objective: campaignData.objective,
        activities: campaignData.activities,
        budget: campaignData.budget,
        narrative: campaignData.narrative,
        concept: campaignData.concept,
        tagline: campaignData.tagline,
      });
    }

    setCurrentStep(prev => Math.min(prev + 1, totalSteps));
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleInputChange = (field: keyof CampaignData, value: any) => {
    setCampaignData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleActivityToggle = (activityId: string) => {
    setCampaignData(prev => ({
      ...prev,
      activities: prev.activities.includes(activityId)
        ? prev.activities.filter(id => id !== activityId)
        : [...prev.activities, activityId]
    }));
  };

  const handleSubmit = async () => {
    if (!validateStep(totalSteps)) return;

    setIsSubmitting(true);
    try {
      const payload = {
        name: campaignData.name,
        type: campaignData.type,
        budget: campaignData.budget,
        productService: campaignData.productService,
        objective: campaignData.objective,
        narrative: campaignData.narrative,
        concept: campaignData.concept,
        tagline: campaignData.tagline,
        heroArtwork: campaignData.heroArtwork,
        accountManagerId: campaignData.accountManagerId,
        activities: campaignData.activities,
        internalApprovalRequired: campaignData.internalApprovalRequired,
        clientApprovalRequired: campaignData.clientApprovalRequired,
        clientId: selectedClient?.id,
        createdBy: user?._id,
      };

      console.log('Sending campaign data:', payload);

      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const result = await response.json();
        onSuccess?.(result);
        onClose();
        // Reset form
        setCampaignData({
          name: '',
          type: '',
          budget: 0,
          productService: '',
          objective: '',
          narrative: '',
          concept: '',
          tagline: '',
          heroArtwork: '',
          accountManagerId: '',
          activities: [],
          internalApprovalRequired: false,
          clientApprovalRequired: true,
        });
        setCurrentStep(1);
        setAiValidation(null);
        setErrors({});
      } else {
        const error = await response.json();
        console.error('Campaign creation failed:', error);
        alert(`Failed to create campaign: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
      alert(`Error creating campaign: ${error.message || 'Network error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStepTitle = (step: number) => {
    const titles = [
      '',
      'Campaign Name',
      'Campaign Type', 
      'Budget',
      'Product/Service',
      'Campaign Objective',
      'Campaign Narrative',
      'Creative Concept',
      'Campaign Tagline',
      'Hero Artwork',
      'Account Manager Assignment',
      'Marketing Activities',
      'Approval Workflow & Review'
    ];
    return titles[step];
  };

  const getStepDescription = (step: number) => {
    const descriptions = [
      '',
      'What would you like to name your campaign?',
      'What type of campaign are you creating?',
      'What is your budget for this campaign? (Optional)',
      'What product or service is this campaign promoting?',
      'What do you want to achieve with this campaign?',
      'Tell the story behind your campaign',
      'Describe your creative direction and visual style',
      'Create a memorable tagline or slogan (Optional)',
      'Add a link to your main campaign artwork (Optional)',
      'Who will manage this campaign?',
      'Which marketing activities do you want to include?',
      'Set approval requirements and review your campaign'
    ];
    return descriptions[step];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-xl">


        {/* Glassmorphism Header */}
        <div className="relative bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 p-8 text-white">
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm border border-white/30">
                <Rocket className="w-7 h-7 animate-pulse" />
              </div>
              <div>
                <h2 className="text-3xl font-bold tracking-tight">Create Campaign</h2>
                <p className="text-purple-100 text-lg">Build something extraordinary together</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-3 hover:bg-white/20 rounded-2xl transition-all duration-300 hover:rotate-90 hover:scale-110 bg-white/10 backdrop-blur-sm border border-white/20"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Enhanced Progress Section */}
          <div className="mt-8 relative z-10">
            <div className="flex items-center justify-between text-purple-100 mb-4">
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-lg">Step {currentStep} of {totalSteps}</span>
                <div className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium backdrop-blur-sm">
                  {getStepTitle(currentStep)}
                </div>
              </div>
              <div className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-purple-900 rounded-full font-bold text-sm shadow-lg">
                {Math.round((currentStep / totalSteps) * 100)}% complete
              </div>
            </div>
            
            {/* Advanced Progress Bar */}
            <div className="relative">
              <div className="w-full bg-white/20 rounded-full h-4 overflow-hidden backdrop-blur-sm border border-white/30">
                <div 
                  className="h-full rounded-full transition-all duration-700 ease-out relative bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400"
                  style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                >
                  <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
                  <div className="absolute right-0 top-0 h-full w-8 bg-gradient-to-r from-transparent to-white/50 animate-pulse"></div>
                </div>
              </div>
              
              {/* Interactive progress dots */}
              <div className="absolute top-0 w-full flex justify-between items-center h-4">
                {Array.from({ length: totalSteps }, (_, i) => {
                  const isCompleted = i < currentStep;
                  const isCurrent = i === currentStep - 1;
                  const icon = i < 3 ? Target : i < 6 ? Palette : i < 9 ? Users : Award;
                  const IconComponent = icon;
                  
                  return (
                    <div
                      key={i}
                      className={`relative flex items-center justify-center w-8 h-8 rounded-full transition-all duration-500 ${
                        isCompleted 
                          ? 'bg-gradient-to-br from-green-400 to-emerald-500 scale-110 shadow-lg shadow-green-400/50' 
                          : isCurrent
                          ? 'bg-gradient-to-br from-white to-yellow-200 scale-125 shadow-xl shadow-white/60 animate-pulse'
                          : 'bg-white/30 scale-90 hover:scale-100'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle className="w-4 h-4 text-white" />
                      ) : isCurrent ? (
                        <IconComponent className="w-4 h-4 text-purple-700 animate-bounce" />
                      ) : (
                        <div className="w-2 h-2 bg-white/60 rounded-full"></div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Step description with animation */}
            <div className="mt-6 text-center">
              <p className="text-purple-100 text-lg animate-fade-in">
                {getStepDescription(currentStep)}
              </p>
            </div>
          </div>
          
          {/* Decorative wave */}
          <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-r from-purple-500 via-violet-500 to-indigo-500 opacity-60"></div>
        </div>

        {/* Enhanced Content */}
        <div className="flex-1 overflow-y-auto p-8 bg-gradient-to-b from-gray-50 to-white relative">
          {/* Step 1: Campaign Name */}
          {currentStep === 1 && (
            <div className="space-y-8 animate-fadeIn">
              <div className="relative">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-3 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl text-white shadow-lg">
                    <Target className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Let's name your campaign</h3>
                    <p className="text-gray-600">Give your campaign a memorable and descriptive name</p>
                  </div>
                </div>
                
                <div className="relative">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Campaign Name *
                  </label>
                  <div className="relative group">
                    <input
                      type="text"
                      value={campaignData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className={`w-full p-4 border-2 rounded-2xl text-lg font-medium transition-all duration-300 bg-white shadow-sm hover:shadow-md focus:shadow-lg ${
                        errors.name 
                          ? 'border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-100' 
                          : 'border-gray-200 hover:border-purple-300 focus:border-purple-500 focus:ring-4 focus:ring-purple-100'
                      } placeholder:text-gray-400 focus:outline-none`}
                      placeholder="e.g., Summer Product Launch 2025"
                      autoFocus
                    />
                    <div className={`absolute inset-0 rounded-2xl transition-all duration-300 pointer-events-none ${
                      campaignData.name 
                        ? 'bg-gradient-to-r from-purple-500/5 to-violet-500/5' 
                        : 'bg-transparent'
                    }`}></div>
                  </div>
                  {errors.name && (
                    <div className="flex items-center space-x-2 mt-2">
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      <p className="text-red-600 text-sm font-medium">{errors.name}</p>
                    </div>
                  )}
                  {campaignData.name && !errors.name && (
                    <div className="flex items-center space-x-2 mt-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <p className="text-green-600 text-sm font-medium">Great name choice!</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Tips section */}
              <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100">
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                  <Sparkles className="w-4 h-4 text-purple-500 mr-2" />
                  Campaign Naming Tips
                </h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start">
                    <div className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>Include the product/service and time period</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>Keep it concise but descriptive (3-7 words)</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-1.5 h-1.5 bg-pink-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>Make it memorable for your team</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* Step 2: Campaign Type */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Campaign Type *
                </label>
                <select
                  value={campaignData.type}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.type ? 'border-red-500' : 'border-gray-300'
                  }`}
                  autoFocus
                >
                  <option value="">Select campaign type</option>
                  <option value="brand_awareness">Brand Awareness</option>
                  <option value="product_launch">Product Launch</option>
                  <option value="lead_generation">Lead Generation</option>
                  <option value="sales_conversion">Sales Conversion</option>
                  <option value="retention">Customer Retention</option>
                  <option value="rebranding">Rebranding</option>
                </select>
                {errors.type && <p className="text-red-500 text-sm mt-1">{errors.type}</p>}
              </div>
            </div>
          )}

          {/* Step 3: Budget */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Budget (Optional)
                </label>
                <input
                  type="number"
                  value={campaignData.budget || ''}
                  onChange={(e) => handleInputChange('budget', parseFloat(e.target.value) || 0)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter budget in BHD"
                  autoFocus
                />
                <p className="text-sm text-gray-500 mt-1">You can skip this if you haven't determined the budget yet</p>
              </div>
            </div>
          )}

          {/* Step 4: Product/Service */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product/Service *
                </label>
                <input
                  type="text"
                  value={campaignData.productService}
                  onChange={(e) => handleInputChange('productService', e.target.value)}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.productService ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., New smartphone, Banking services, Restaurant menu"
                  autoFocus
                />
                {errors.productService && <p className="text-red-500 text-sm mt-1">{errors.productService}</p>}
              </div>
            </div>
          )}

          {/* Step 5: Campaign Objective */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Campaign Objective *
                </label>
                <textarea
                  value={campaignData.objective}
                  onChange={(e) => handleInputChange('objective', e.target.value)}
                  rows={4}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.objective ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="What do you want to achieve with this campaign? Include specific goals and target outcomes."
                  autoFocus
                />
                {errors.objective && <p className="text-red-500 text-sm mt-1">{errors.objective}</p>}
              </div>
            </div>
          )}

          {/* Step 6: Campaign Narrative */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Campaign Narrative *
                </label>
                <textarea
                  value={campaignData.narrative}
                  onChange={(e) => handleInputChange('narrative', e.target.value)}
                  rows={4}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.narrative ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Tell the story behind your campaign. What's the brand message and emotional connection?"
                  autoFocus
                />
                {errors.narrative && <p className="text-red-500 text-sm mt-1">{errors.narrative}</p>}
              </div>
            </div>
          )}

          {/* Step 7: Creative Concept */}
          {currentStep === 7 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Creative Concept *
                </label>
                <textarea
                  value={campaignData.concept}
                  onChange={(e) => handleInputChange('concept', e.target.value)}
                  rows={4}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.concept ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Describe the creative direction, visual style, and key messaging approach."
                  autoFocus
                />
                {errors.concept && <p className="text-red-500 text-sm mt-1">{errors.concept}</p>}
              </div>
            </div>
          )}

          {/* Step 8: Campaign Tagline */}
          {currentStep === 8 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Campaign Tagline (Optional)
                </label>
                <input
                  type="text"
                  value={campaignData.tagline}
                  onChange={(e) => handleInputChange('tagline', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter a memorable tagline or slogan"
                  autoFocus
                />
                <p className="text-sm text-gray-500 mt-1">You can skip this if you haven't created a tagline yet</p>
              </div>
            </div>
          )}

          {/* Step 9: Hero Artwork */}
          {currentStep === 9 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hero Artwork URL (Optional)
                </label>
                <input
                  type="url"
                  value={campaignData.heroArtwork}
                  onChange={(e) => handleInputChange('heroArtwork', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Link to main campaign artwork or visual"
                  autoFocus
                />
                <p className="text-sm text-gray-500 mt-1">You can add this later if the artwork isn't ready yet</p>
              </div>
            </div>
          )}

          {/* Step 10: Account Manager */}
          {currentStep === 10 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assign Account Manager *
                </label>
                <select
                  value={campaignData.accountManagerId || ''}
                  onChange={(e) => handleInputChange('accountManagerId', e.target.value)}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.accountManagerId ? 'border-red-500' : 'border-gray-300'
                  }`}
                  autoFocus
                >
                  <option value="">Select an account manager</option>
                  {users.map((user) => (
                    <option key={user._id || user.id} value={user._id || user.id}>
                      {user.name} - {user.email}
                    </option>
                  ))}
                </select>
                {errors.accountManagerId && <p className="text-red-500 text-sm mt-1">{errors.accountManagerId}</p>}
                <p className="text-sm text-gray-600 mt-2">
                  The account manager will oversee this campaign and receive notifications about updates and approvals.
                </p>
              </div>
            </div>
          )}

          {/* Step 11: Marketing Activities */}
          {currentStep === 11 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Select Marketing Activities</h3>
                {errors.activities && <p className="text-red-500 text-sm mb-4">{errors.activities}</p>}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {MARKETING_ACTIVITIES.map((activity) => (
                    <div
                      key={activity.id}
                      className={`
                        p-4 border-2 rounded-lg cursor-pointer transition-all
                        ${campaignData.activities.includes(activity.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'}
                      `}
                      onClick={() => handleActivityToggle(activity.id)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`
                          w-5 h-5 rounded border-2 flex-shrink-0 mt-0.5
                          ${campaignData.activities.includes(activity.id)
                            ? 'bg-blue-600 border-blue-600'
                            : 'border-gray-300'}
                        `}>
                          {campaignData.activities.includes(activity.id) && (
                            <CheckCircle className="w-3 h-3 text-white m-0.5" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{activity.label}</h4>
                          <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <Sparkles className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-blue-900">Auto-Generated Tasks</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Based on your selected activities, we'll automatically create relevant tasks and subtasks 
                        to help you manage your campaign effectively.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 12: Review & Approval */}
          {currentStep === 12 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Approval Workflow</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="internal-approval"
                      checked={campaignData.internalApprovalRequired}
                      onChange={(e) => handleInputChange('internalApprovalRequired', e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="internal-approval" className="text-sm font-medium text-gray-700">
                      Require internal approval before launch
                    </label>
                  </div>

                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="client-approval"
                      checked={campaignData.clientApprovalRequired}
                      onChange={(e) => handleInputChange('clientApprovalRequired', e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="client-approval" className="text-sm font-medium text-gray-700">
                      Require client approval before launch
                    </label>
                  </div>
                </div>
              </div>

              {/* AI Validation Results */}
              {aiValidation && (
                <div className={`
                  p-4 rounded-lg border-2
                  ${aiValidation.isValid 
                    ? 'border-green-200 bg-green-50' 
                    : 'border-amber-200 bg-amber-50'}
                `}>
                  <div className="flex items-start space-x-3">
                    {aiValidation.isValid ? (
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    )}
                    <div>
                      <h4 className={`font-medium ${aiValidation.isValid ? 'text-green-900' : 'text-amber-900'}`}>
                        AI Validation Results (Score: {aiValidation.score}/100)
                      </h4>
                      <p className={`text-sm mt-1 ${aiValidation.isValid ? 'text-green-700' : 'text-amber-700'}`}>
                        {aiValidation.feedback}
                      </p>
                      {aiValidation.suggestions.length > 0 && (
                        <ul className={`text-sm mt-2 space-y-1 ${aiValidation.isValid ? 'text-green-700' : 'text-amber-700'}`}>
                          {aiValidation.suggestions.map((suggestion, index) => (
                            <li key={index}>• {suggestion}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Campaign Summary */}
              <Card>
                <h4 className="font-medium text-gray-900 mb-4">Campaign Summary</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Name:</span>
                    <span className="ml-2 font-medium">{campaignData.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Type:</span>
                    <span className="ml-2 font-medium">{campaignData.type}</span>
                  </div>
                  {campaignData.budget > 0 && (
                    <div>
                      <span className="text-gray-600">Budget:</span>
                      <span className="ml-2 font-medium">{campaignData.budget.toLocaleString()} BHD</span>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-600">Activities:</span>
                    <span className="ml-2 font-medium">{campaignData.activities.length} selected</span>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>

        {/* Enhanced Footer */}
        <div className="relative bg-gradient-to-r from-gray-50 via-white to-gray-50 p-8 border-t border-gray-200/50">
          <div className="flex justify-between items-center">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="group flex items-center space-x-3 px-6 py-3 text-gray-600 hover:text-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 rounded-xl hover:bg-purple-50 disabled:hover:bg-transparent"
            >
              <div className="p-2 rounded-lg bg-gray-100 group-hover:bg-purple-100 group-disabled:bg-gray-100 transition-colors duration-300">
                <ChevronLeft className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
              </div>
              <span className="font-medium">Previous Step</span>
            </button>

            <div className="flex items-center space-x-4">
              {aiValidating && (
                <div className="flex items-center space-x-3 px-4 py-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full border border-blue-200">
                  <div className="relative">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                    <div className="absolute inset-0 animate-ping">
                      <Loader2 className="w-5 h-5 text-blue-400 opacity-30" />
                    </div>
                  </div>
                  <span className="text-sm font-medium text-blue-700">AI is validating your campaign...</span>
                </div>
              )}

              {currentStep < totalSteps ? (
                <button
                  onClick={handleNext}
                  disabled={aiValidating}
                  className="group relative overflow-hidden flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-2xl hover:from-purple-700 hover:to-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-purple-500/25 hover:shadow-xl transform hover:scale-105 active:scale-95"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                  <span className="relative font-semibold">Next Step</span>
                  <div className="relative p-1 bg-white/20 rounded-lg group-hover:bg-white/30 transition-colors duration-200">
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" />
                  </div>
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="group relative overflow-hidden flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-2xl hover:from-emerald-700 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-emerald-500/25 hover:shadow-xl transform hover:scale-105 active:scale-95"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                  {isSubmitting ? (
                    <>
                      <div className="relative">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <div className="absolute inset-0 animate-ping">
                          <Loader2 className="w-5 h-5 opacity-30" />
                        </div>
                      </div>
                      <span className="relative font-semibold">Creating Campaign...</span>
                    </>
                  ) : (
                    <>
                      <div className="relative p-1 bg-white/20 rounded-lg group-hover:bg-white/30 transition-colors duration-200">
                        <Rocket className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                      </div>
                      <span className="relative font-semibold">Launch Campaign</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
          
          {/* Decorative elements */}
          <div className="absolute bottom-0 left-1/4 w-16 h-1 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"></div>
          <div className="absolute bottom-0 right-1/4 w-12 h-1 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};

export default CampaignWizard;

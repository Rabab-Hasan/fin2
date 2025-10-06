import React, { createContext, useContext, useState, ReactNode } from 'react';

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

interface MediaPlanContextType {
  cpcRows: CPCRow[];
  setCpcRows: React.Dispatch<React.SetStateAction<CPCRow[]>>;
  cpmRows: CPMRow[];
  setCpmRows: React.Dispatch<React.SetStateAction<CPMRow[]>>;
  cpcTableShownOnBusinessData: boolean;
  setCpcTableShownOnBusinessData: React.Dispatch<React.SetStateAction<boolean>>;
  cpmTableShownOnBusinessData: boolean;
  setCpmTableShownOnBusinessData: React.Dispatch<React.SetStateAction<boolean>>;
}

const MediaPlanContext = createContext<MediaPlanContextType | undefined>(undefined);

export const useMediaPlan = () => {
  const context = useContext(MediaPlanContext);
  if (!context) {
    throw new Error('useMediaPlan must be used within a MediaPlanProvider');
  }
  return context;
};

interface MediaPlanProviderProps {
  children: ReactNode;
}

export const MediaPlanProvider: React.FC<MediaPlanProviderProps> = ({ children }) => {
  const [cpcRows, setCpcRows] = useState<CPCRow[]>([
    {
      id: '1',
      channel: 'Facebook',
      currency: 'BHD',
      targetAudience: 'Executives in medium to large companies',
      format: 'Static, Video, Carousel',
      estimatedClicks: 435660,
      cpc: 2,
      netCost: 871320
    },
    {
      id: '2',
      channel: 'Instagram',
      currency: 'BHD',
      targetAudience: 'Constant travelers, frequent online shoppers',
      format: 'Stories, Reels, Newsfeed',
      estimatedClicks: 435500,
      cpc: 5,
      netCost: 2177500
    },
    {
      id: '3',
      channel: 'LinkedIn',
      currency: 'BHD',
      targetAudience: 'Professionals in large companies',
      format: 'Carousel, Video',
      estimatedClicks: 183740,
      cpc: 4,
      netCost: 734960
    }
  ]);
  const [cpmRows, setCpmRows] = useState<CPMRow[]>([
    {
      id: '1',
      channel: 'Facebook',
      currency: 'BHD',
      targetAudience: 'Executives in medium to large companies',
      format: 'Static, Video, Carousel',
      impressions: 435660,
      frequencyUser: 3,
      frequencyWeek: 7,
      addressableAudience: 500000,
      percentReach: 80,
      reach: 400000,
      estImpressions: 9147660,
      netRate: 2,
      netCost: 18295
    },
    {
      id: '2',
      channel: 'Instagram',
      currency: 'BHD',
      targetAudience: 'Frequent online shoppers',
      format: 'Stories, Reels, Newsfeed',
      impressions: 435500,
      frequencyUser: 5,
      frequencyWeek: 7,
      addressableAudience: 600000,
      percentReach: 75,
      reach: 450000,
      estImpressions: 15241250,
      netRate: 5,
      netCost: 76206
    },
    {
      id: '3',
      channel: 'LinkedIn',
      currency: 'BHD',
      targetAudience: 'Established professionals, business owners',
      format: 'Carousel, Video',
      impressions: 183740,
      frequencyUser: 4,
      frequencyWeek: 7,
      addressableAudience: 200000,
      percentReach: 60,
      reach: 120000,
      estImpressions: 5144720,
      netRate: 4,
      netCost: 20579
    }
  ]);
  const [cpcTableShownOnBusinessData, setCpcTableShownOnBusinessData] = useState(true);
  const [cpmTableShownOnBusinessData, setCpmTableShownOnBusinessData] = useState(false);

  const value: MediaPlanContextType = {
    cpcRows,
    setCpcRows,
    cpmRows,
    setCpmRows,
    cpcTableShownOnBusinessData,
    setCpcTableShownOnBusinessData,
    cpmTableShownOnBusinessData,
    setCpmTableShownOnBusinessData
  };

  return (
    <MediaPlanContext.Provider value={value}>
      {children}
    </MediaPlanContext.Provider>
  );
};
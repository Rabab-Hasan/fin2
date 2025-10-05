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
  const [cpcRows, setCpcRows] = useState<CPCRow[]>([]);
  const [cpmRows, setCpmRows] = useState<CPMRow[]>([]);
  const [cpcTableShownOnBusinessData, setCpcTableShownOnBusinessData] = useState(false);
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
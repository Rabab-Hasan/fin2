import React from 'react';
import Card from './Card';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  loading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, loading = false }) => {
  return (
    <Card>
      <div className="text-sm font-medium text-gray-500 mb-1">{title}</div>
      {loading ? (
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-20 mb-1"></div>
          <div className="h-4 bg-gray-200 rounded w-32"></div>
        </div>
      ) : (
        <>
          <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
          <div className="text-xs text-gray-600">{subtitle}</div>
        </>
      )}
    </Card>
  );
};

export default StatCard;

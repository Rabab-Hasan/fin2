import React from 'react';

interface MonthFilterProps {
  value: string;
  onChange: (value: string) => void;
  months: string[];
  loading?: boolean;
}

const MonthFilter: React.FC<MonthFilterProps> = ({ value, onChange, months, loading = false }) => {
  return (
    <div className="flex items-center space-x-2">
      <label htmlFor="month-filter" className="text-sm font-medium text-gray-700">
        Filter by Month:
      </label>
      <select
        id="month-filter"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading}
        className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
      >
        <option value="">All Months</option>
        {months.map(month => (
          <option key={month} value={month}>
            {month}
          </option>
        ))}
      </select>
    </div>
  );
};

export default MonthFilter;

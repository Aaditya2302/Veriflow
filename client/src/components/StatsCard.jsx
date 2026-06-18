import React from 'react';

export default function StatsCard({ title, value, color = 'gray' }) {
  // Define color-based style mappings
  const colorMap = {
    green: {
      border: 'border-t-green-600',
      text: 'text-green-600',
      bg: 'bg-green-50/50'
    },
    red: {
      border: 'border-t-red-600',
      text: 'text-red-600',
      bg: 'bg-red-50/50'
    },
    blue: {
      border: 'border-t-blue-600',
      text: 'text-blue-600',
      bg: 'bg-blue-50/50'
    },
    gray: {
      border: 'border-t-gray-400',
      text: 'text-gray-900',
      bg: 'bg-gray-50/50'
    }
  };

  const currentStyle = colorMap[color] || colorMap.gray;

  return (
    <div className={`bg-white rounded-lg border border-gray-200 border-t-4 ${currentStyle.border} p-5 shadow-sm transition-all duration-150 hover:shadow`}>
      <div className="flex flex-col space-y-1.5">
        <span className="text-sm font-medium text-gray-500">{title}</span>
        <div className="flex items-baseline space-x-1">
          <span className={`text-3xl font-bold tracking-tight ${currentStyle.text}`}>
            {value}
          </span>
        </div>
      </div>
    </div>
  );
}

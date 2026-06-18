import React from 'react';
import StatsCard from './StatsCard';
import ValidationTable from './ValidationTable';

export default function ResultsDashboard({ results }) {
  if (!results) return null;

  const { totalRows, validRows, invalidRows, transactions } = results;

  // Calculate success rate percent
  const successRate = totalRows > 0 ? ((validRows / totalRows) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-6">
      {/* 4 Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Records"
          value={totalRows.toLocaleString()}
          color="gray"
        />
        <StatsCard
          title="Valid Records"
          value={validRows.toLocaleString()}
          color="green"
        />
        <StatsCard
          title="Invalid Records"
          value={invalidRows.toLocaleString()}
          color="red"
        />
        <StatsCard
          title="Success Rate"
          value={`${successRate}%`}
          color="blue"
        />
      </div>

      {/* Title Details Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4 shadow-sm">
        <div className="flex flex-col space-y-1">
          <h2 className="text-xl font-semibold text-gray-900">Validation Results</h2>
          <p className="text-sm text-gray-500">Review validation outcomes, detected issues, and processed records.</p>
        </div>

        {/* Table list */}
        <ValidationTable transactions={transactions} />
      </div>
    </div>
  );
}

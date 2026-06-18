import React, { useState } from 'react';

const expectedFields = [
  { key: 'order_id', label: 'Order ID', required: true },
  { key: 'amount', label: 'Amount', required: true },
  { key: 'payment_mode', label: 'Payment Mode', required: true },
  { key: 'product_id', label: 'Product ID', required: false },
  { key: 'country_code', label: 'Country Code', required: false },
  { key: 'phone', label: 'Phone', required: false },
  { key: 'order_date', label: 'Order Date', required: false },
  { key: 'email', label: 'Email', required: false }
];

export default function ColumnMappingUI({
  headers = [],
  suggestedMapping = {},
  sampleValues = {},
  onConfirm,
  onCancel
}) {
  const [mapping, setMapping] = useState(() => {
    const initial = {};
    expectedFields.forEach(f => {
      initial[f.key] = {
        mappedTo: suggestedMapping[f.key]?.mappedTo || null,
        confidence: suggestedMapping[f.key]?.mappedTo ? 'auto' : 'manual'
      };
    });
    return initial;
  });

  const [showUnmapped, setShowUnmapped] = useState(false);

  const handleSelectChange = (fieldKey, headerValue) => {
    const val = headerValue === '__skip__' ? null : headerValue;
    setMapping(prev => {
      // Check if it matches the original auto-detected column
      const originalAuto = suggestedMapping[fieldKey]?.mappedTo;
      const isOriginalAuto = originalAuto && originalAuto === val;
      return {
        ...prev,
        [fieldKey]: {
          mappedTo: val,
          confidence: val ? (isOriginalAuto ? 'auto' : 'manual') : 'manual'
        }
      };
    });
  };

  // Calculations
  const mappedCsvHeaders = Object.values(mapping)
    .map(m => m.mappedTo)
    .filter(Boolean);

  const unmappedColumns = headers.filter(h => !mappedCsvHeaders.includes(h));

  // Minimum required check
  const missingRequired = expectedFields
    .filter(f => f.required)
    .some(f => !mapping[f.key].mappedTo);

  // Confidence calculations
  const totalExpected = expectedFields.length;
  const autoCount = expectedFields.filter(
    f => mapping[f.key].mappedTo && mapping[f.key].confidence === 'auto'
  ).length;

  const manualCount = expectedFields.filter(
    f => mapping[f.key].mappedTo && mapping[f.key].confidence === 'manual'
  ).length;

  const totalMapped = mappedCsvHeaders.length;

  let confidenceLevel = 'low';
  let confidenceText = '';
  let confidenceClass = '';

  if (autoCount >= 6) {
    confidenceLevel = 'high';
    confidenceText = `High confidence (${autoCount}/${totalExpected} fields auto-detected) — review and confirm`;
    confidenceClass = 'bg-green-50 text-green-700 border-green-200';
  } else if (autoCount >= 4) {
    confidenceLevel = 'medium';
    confidenceText = `🟡 Medium confidence (${autoCount}/${totalExpected} fields auto-detected) — please review carefully`;
    confidenceClass = 'bg-yellow-50 text-yellow-700 border-yellow-200';
  } else {
    confidenceLevel = 'low';
    confidenceText = `🔴 Low confidence (${autoCount}/${totalExpected} fields auto-detected) — manual mapping required`;
    confidenceClass = 'bg-red-50 text-red-700 border-red-200';
  }

  const handleConfirm = () => {
    if (missingRequired) return;

    // Convert state mapping into standard { order_id: "CSV_HEADER" } key-value format for server
    const finalMapping = {};
    Object.keys(mapping).forEach(k => {
      finalMapping[k] = mapping[k].mappedTo;
    });

    onConfirm(finalMapping);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6 shadow-sm">
      {/* Title Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">Map your columns</h2>
        <p className="text-s text-gray-500 mt-1">
          We've auto-detected most columns. Review and adjust before running validation.
        </p>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <span className="px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
          High Confidence
        </span>

        <span className="text-sm text-slate-500">
          8 of 8 fields auto-detected
        </span>
      </div>

      {/* Columns Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-xs">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left font-bold text-gray-600 uppercase tracking-wider">Expected Field</th>
              <th scope="col" className="px-4 py-3 text-left font-bold text-gray-600 uppercase tracking-wider">Your CSV Column</th>
              <th scope="col" className="px-4 py-3 text-left font-bold text-gray-600 uppercase tracking-wider">Sample Value</th>
              <th scope="col" className="px-4 py-3 text-left font-bold text-gray-600 uppercase tracking-wider w-36">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {expectedFields.map(field => {
              const currentMap = mapping[field.key];
              const mappedTo = currentMap.mappedTo;
              const sampleValue = mappedTo ? sampleValues[mappedTo] : null;

              // Determine status badge
              let badge = null;
              if (mappedTo) {
                if (currentMap.confidence === 'auto') {
                  badge = (
                    <span className="inline-flex bg-green-50 text-green-700 border border-green-150 px-2 py-0.5 rounded text-[10px] font-bold">
                      Auto-detected ✓
                    </span>
                  );
                } else {
                  badge = (
                    <span className="inline-flex bg-blue-50 text-blue-700 border border-blue-150 px-2 py-0.5 rounded text-[10px] font-bold">
                      Mapped manually
                    </span>
                  );
                }
              } else {
                if (field.required) {
                  badge = (
                    <span className="inline-flex bg-red-50 text-red-700 border border-red-150 px-2 py-0.5 rounded text-[10px] font-bold">
                      Required — please map
                    </span>
                  );
                } else {
                  badge = (
                    <span className="inline-flex bg-gray-50 text-gray-500 border border-gray-150 px-2 py-0.5 rounded text-[10px] font-bold">
                      Optional — skip
                    </span>
                  );
                }
              }

              return (
                <tr key={field.key} className="hover:bg-gray-50/50 transition-colors">
                  {/* Expected Field label */}
                  <td className="px-4 py-3 font-semibold text-gray-800">
                    {field.label} {field.required && <span className="text-red-500 font-bold">*</span>}
                  </td>

                  {/* Your CSV Column Selector */}
                  <td className="px-4 py-3">
                    <select
                      value={mappedTo || '__skip__'}
                      onChange={e => handleSelectChange(field.key, e.target.value)}
                      className="bg-white border border-gray-300 rounded px-2.5 py-1 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none w-full max-w-xs font-medium text-gray-800 cursor-pointer"
                    >
                      <option value="__skip__">-- Not in file --</option>
                      {headers.map(h => (
                        <option
                          key={h}
                          value={h}
                          disabled={mappedCsvHeaders.includes(h) && mappedTo !== h}
                        >
                          {h}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Sample Value */}
                  <td className="px-4 py-3 text-gray-500 truncate max-w-xs font-mono">
                    {sampleValue !== null ? `"${sampleValue}"` : <span className="text-gray-350">—</span>}
                  </td>

                  {/* Status Badge */}
                  <td className="px-4 py-3">{badge}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Unmapped columns collapsible panel */}
      {unmappedColumns.length > 0 && (
        <div className="border border-gray-200 rounded-md">
          <button
            type="button"
            onClick={() => setShowUnmapped(prev => !prev)}
            className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 text-xs font-semibold text-gray-700 hover:bg-gray-100/75 transition-colors text-left"
          >
            <span>Unmapped columns in your file ({unmappedColumns.length})</span>
            <span>{showUnmapped ? '▲' : '▼'}</span>
          </button>
          {showUnmapped && (
            <div className="p-4 border-t border-gray-200 bg-white">
              <p className="text-[11px] text-gray-400 mb-2.5">
                These CSV columns will be ignored during validation and won't map to expected fields:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {unmappedColumns.map(col => (
                  <span
                    key={col}
                    className="bg-gray-100 text-gray-600 border border-gray-200 px-2 py-0.5 rounded text-[10px] font-semibold"
                  >
                    {col}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mapping Stats Summary */}
      <div className="text-s text-gray-500 font-medium">
        {totalMapped} of {totalExpected} fields mapped ({autoCount} auto-detected, {manualCount} manual)
      </div>

      {/* Actions buttons */}
      <div className="flex justify-between items-center pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-750 px-5 py-2.5 rounded-md text-s font-semibold shadow-sm transition-colors cursor-pointer"
        >
          ← Change file
        </button>
        <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-sm text-amber-800">
          Note: Do not refresh the page before running validation.
        </div>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={missingRequired}
          className={`px-5 py-2.5 rounded-md text-s font-semibold text-white transition-all shadow-md duration-150 flex items-center space-x-1 ${missingRequired
            ? 'bg-gray-300 cursor-not-allowed opacity-85'
            : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.98] cursor-pointer'
            }`}
        >
          <span>Confirm mapping & run validation →</span>
        </button>
      </div>
    </div>
  );
}

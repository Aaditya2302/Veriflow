import React, { useState, useEffect } from 'react';

export default function ConfigPanel({ config, onChange }) {
  // Local states initialized from config or defaults
  const [countryRules, setCountryRules] = useState(
    config?.countryRules || { IN: 10, SG: 8, US: 10 }
  );
  const [dateFormats, setDateFormats] = useState(
    config?.dateFormats || ["YYYY-MM-DD", "DD/MM/YYYY", "MM-DD-YYYY", "YYYY-MM-DD HH:mm:ss"]
  );
  const [requiredFields, setRequiredFields] = useState(
    config?.requiredFields || ["order_id", "product_id", "amount", "payment_mode", "country_code", "phone"]
  );
  const [paymentModes, setPaymentModes] = useState(
    config?.paymentModes || ["UPI", "card", "cash", "netbanking", "wallet"]
  );

  // States for "Add" forms
  const [newCountryCode, setNewCountryCode] = useState('');
  const [newCountryDigits, setNewCountryDigits] = useState('');
  
  const [newDateFormat, setNewDateFormat] = useState('');
  const [newPaymentMode, setNewPaymentMode] = useState('');

  // Built-in date formats available for toggle
  const defaultDateFormatsList = [
    "YYYY-MM-DD",
    "DD/MM/YYYY",
    "MM-DD-YYYY",
    "YYYY-MM-DD HH:mm:ss"
  ];

  // Notify parent on config change
  useEffect(() => {
    onChange({
      countryRules,
      dateFormats,
      requiredFields,
      paymentModes
    });
  }, [countryRules, dateFormats, requiredFields, paymentModes]);

  // Country Rules Handlers
  const handleAddCountryRule = (e) => {
    e.preventDefault();
    const code = newCountryCode.trim().toUpperCase();
    const digits = parseInt(newCountryDigits, 10);
    if (!code || isNaN(digits) || digits <= 0) return;

    setCountryRules(prev => ({
      ...prev,
      [code]: digits
    }));
    setNewCountryCode('');
    setNewCountryDigits('');
  };

  const handleRemoveCountryRule = (code) => {
    setCountryRules(prev => {
      const copy = { ...prev };
      delete copy[code];
      return copy;
    });
  };

  // Date Formats Handlers
  const handleToggleDateFormat = (format) => {
    setDateFormats(prev => {
      if (prev.includes(format)) {
        // Keep at least one format
        if (prev.length === 1) return prev;
        return prev.filter(f => f !== format);
      } else {
        return [...prev, format];
      }
    });
  };

  const handleAddCustomDateFormat = (e) => {
    e.preventDefault();
    const format = newDateFormat.trim();
    if (!format) return;
    if (dateFormats.includes(format)) return;

    setDateFormats(prev => [...prev, format]);
    setNewDateFormat('');
  };

  // Required Fields Handlers
  const handleToggleRequiredField = (field) => {
    setRequiredFields(prev => {
      if (prev.includes(field)) {
        return prev.filter(f => f !== field);
      } else {
        return [...prev, field];
      }
    });
  };

  // Payment Modes Handlers
  const handleAddPaymentMode = (e) => {
    e.preventDefault();
    const mode = newPaymentMode.trim();
    if (!mode) return;
    if (paymentModes.some(m => m.toLowerCase() === mode.toLowerCase())) return;

    setPaymentModes(prev => [...prev, mode]);
    setNewPaymentMode('');
  };

  const handleRemovePaymentMode = (mode) => {
    setPaymentModes(prev => prev.filter(m => m !== mode));
  };

  return (
    <div className="space-y-6">
      {/* Country Rules Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <div>
          <h3 className="text-base font-semibold text-gray-900">Country Phone Rules</h3>
          <p className="text-xs text-gray-500">Define expected numeric digit count for each country code</p>
        </div>

        {/* Existing Rules as pills */}
        <div className="flex flex-wrap gap-2 items-center">
          {Object.entries(countryRules).map(([code, digits]) => (
            <span
              key={code}
              className="inline-flex items-center bg-gray-100 border border-gray-200 rounded-full pl-3 pr-2 py-1 text-xs font-semibold text-gray-700"
            >
              <span>{code} → {digits} digits</span>
              <button
                type="button"
                onClick={() => handleRemoveCountryRule(code)}
                className="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
              >
                <span className="sr-only">Delete</span>
                &times;
              </button>
            </span>
          ))}
        </div>

        {/* Add Country Form */}
        <form onSubmit={handleAddCountryRule} className="flex gap-2 items-center bg-gray-50 p-3 rounded-lg border border-gray-150">
          <input
            type="text"
            placeholder="IN"
            maxLength={3}
            value={newCountryCode}
            onChange={(e) => setNewCountryCode(e.target.value)}
            className="border border-gray-300 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 w-16 uppercase bg-white text-gray-800"
          />
          <input
            type="number"
            placeholder="10"
            min={1}
            value={newCountryDigits}
            onChange={(e) => setNewCountryDigits(e.target.value)}
            className="border border-gray-300 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 w-16 bg-white text-gray-800"
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center space-x-1"
          >
            <span>+ Add</span>
          </button>
        </form>
      </div>

      {/* Date Formats Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <div>
          <h3 className="text-base font-semibold text-gray-900">Accepted Date Formats</h3>
          <p className="text-xs text-gray-500">Rows will be validated using strict dayjs verification</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {defaultDateFormatsList.map((format) => {
            const isChecked = dateFormats.includes(format);
            return (
              <button
                key={format}
                type="button"
                onClick={() => handleToggleDateFormat(format)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 border ${
                  isChecked
                    ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-sm'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <span>{format}</span>
                {isChecked && <span className="ml-1 text-blue-500">✓</span>}
              </button>
            );
          })}
          
          {/* Custom Date Formats (not in defaults) */}
          {dateFormats
            .filter(f => !defaultDateFormatsList.includes(f))
            .map((format) => (
              <span
                key={format}
                className="inline-flex items-center bg-blue-50 border border-blue-200 rounded-full pl-3 pr-2 py-1 text-xs font-semibold text-blue-700 shadow-sm"
              >
                <span>{format}</span>
                <button
                  type="button"
                  onClick={() => handleToggleDateFormat(format)}
                  className="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full hover:bg-blue-150 text-blue-500 hover:text-blue-700 transition-colors focus:outline-none"
                >
                  &times;
                </button>
              </span>
            ))}
        </div>

        <form onSubmit={handleAddCustomDateFormat} className="flex gap-2 items-center bg-gray-50 p-3 rounded-lg border border-gray-150">
          <input
            type="text"
            placeholder="YYYY/MM/DD"
            value={newDateFormat}
            onChange={(e) => setNewDateFormat(e.target.value)}
            className="border border-gray-300 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 flex-1 bg-white text-gray-800"
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-xs font-semibold transition-colors"
          >
            Add Format
          </button>
        </form>
      </div>

      {/* Required Fields Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <div>
          <h3 className="text-base font-semibold text-gray-900">Required Fields</h3>
          <p className="text-xs text-gray-500">Transaction records must contain these fields</p>
        </div>

        <div className="grid grid-cols-2 gap-3 bg-gray-50 p-4 rounded-lg border border-gray-150">
          {["order_id", "product_id", "amount", "payment_mode", "country_code", "phone"].map((field) => {
            const isChecked = requiredFields.includes(field);
            return (
              <label key={field} className="flex items-center space-x-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleToggleRequiredField(field)}
                  className="rounded text-blue-600 focus:ring-blue-500 h-4.5 w-4.5 border-gray-300"
                />
                <span className="text-xs font-medium text-gray-700">{field}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Payment Modes Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <div>
          <h3 className="text-base font-semibold text-gray-900">Allowed Payment Modes</h3>
          <p className="text-xs text-gray-500">Transaction payment types whitelisted for validation</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {paymentModes.map((mode) => (
            <span
              key={mode}
              className="inline-flex items-center bg-gray-100 border border-gray-200 rounded-full pl-3 pr-2 py-1 text-xs font-semibold text-gray-750"
            >
              <span>{mode}</span>
              <button
                type="button"
                onClick={() => handleRemovePaymentMode(mode)}
                className="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
              >
                &times;
              </button>
            </span>
          ))}
        </div>

        <form onSubmit={handleAddPaymentMode} className="flex gap-2 items-center bg-gray-50 p-3 rounded-lg border border-gray-150">
          <input
            type="text"
            placeholder="e.g. UPI, credit_card"
            value={newPaymentMode}
            onChange={(e) => setNewPaymentMode(e.target.value)}
            className="border border-gray-300 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 flex-1 bg-white text-gray-800"
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-xs font-semibold transition-colors"
          >
            Add Mode
          </button>
        </form>
      </div>
    </div>
  );
}

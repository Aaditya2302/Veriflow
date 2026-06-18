import React, { useState } from 'react';
import { uploadCSV, detectColumns } from '../services/api';
import UploadSection from '../components/UploadSection';
import ConfigPanel from '../components/ConfigPanel';
import ResultsDashboard from '../components/ResultsDashboard';
import DownloadSection from '../components/DownloadSection';
import ColumnMappingUI from '../components/ColumnMappingUI';
import { saveWorkflowState, restoreWorkflowState, clearWorkflowState, } from '../services/workflowPersistence';
export default function Home() {
  const [file, setFile] = useState(null);
  const [config, setConfig] = useState({
    countryRules: { IN: 10, SG: 8, US: 10 },
    dateFormats: ["YYYY-MM-DD", "DD/MM/YYYY", "MM-DD-YYYY", "YYYY-MM-DD HH:mm:ss"],
    requiredFields: ["order_id", "product_id", "amount", "payment_mode", "country_code", "phone"],
    paymentModes: ["UPI", "card", "cash", "netbanking", "wallet"]
  });

  const [uploadStage, setUploadStage] = useState('idle');
  // stages: 'idle' → 'detecting' → 'rejected' → 'mapping' → 'validating' → 'results'

  const [detectionResult, setDetectionResult] = useState(null);
  const [confirmedMapping, setConfirmedMapping] = useState(null);
  const [previousMapping, setPreviousMapping] = useState(null);
  const [useSavedMapping, setUseSavedMapping] = useState(false);
  const [validationResults, setValidationResults] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [toasts, setToasts] = useState([]);
  React.useEffect(() => {
    const saved = restoreWorkflowState();

    if (!saved) return;

    setUploadStage(saved.uploadStage || 'idle');
    setConfirmedMapping(saved.confirmedMapping || null);
    setPreviousMapping(saved.previousMapping || null);
    setUseSavedMapping(saved.useSavedMapping || false);
    setDetectionResult(saved.detectionResult || null);
    setValidationResults(saved.validationResults || null);

    if (saved.fileMetadata) {
      setFile(saved.fileMetadata);
    }
  }, []);
  React.useEffect(() => {
    saveWorkflowState({
      uploadStage,
      confirmedMapping,
      previousMapping,
      useSavedMapping,
      detectionResult,
      validationResults,
      file,
    });
  }, [
    uploadStage,
    confirmedMapping,
    previousMapping,
    useSavedMapping,
    detectionResult,
    validationResults,
    file,
  ]);

  // Toast Helper
  const showToast = (message, type = 'success') => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) {
      setFile(null);
      setValidationResults(null);
      setErrorMsg('');
      setUploadStage('idle');
      return;
    }

    setFile(selectedFile);
    setValidationResults(null);
    setErrorMsg('');

    if (useSavedMapping && previousMapping) {
      showToast('✓ CSV file loaded', 'info');
    } else {
      runDetection(selectedFile);
    }
  };

  const handleConfigChange = (newConfig) => {
    setConfig(newConfig);
  };

  const runDetection = async (selectedFile) => {
    setUploadStage('detecting');
    setDetectionResult(null);
    setErrorMsg('');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await detectColumns(formData);
      setDetectionResult(response.data);
      setUploadStage('mapping');
    } catch (err) {
      console.error('Column Detection Error:', err);
      const errResponse = err.response?.data;
      if (errResponse && errResponse.error === 'INVALID_DATASET_TYPE') {
        setDetectionResult(errResponse);
        setUploadStage('rejected');
        showToast('File rejected — not a transaction dataset', 'error');
      } else {
        const msg = errResponse?.error || 'Failed to analyze CSV columns.';
        setErrorMsg(msg);
        setUploadStage('idle');
        showToast(`Error: ${msg}`, 'error');
      }
    }
  };

  const runValidationWithMapping = async (selectedFile, mapping) => {
    setUploadStage('validating');
    setErrorMsg('');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('confirmedMapping', JSON.stringify(mapping));
      formData.append('countryRules', JSON.stringify(config.countryRules));
      formData.append('dateFormats', JSON.stringify(config.dateFormats));
      formData.append('requiredFields', JSON.stringify(config.requiredFields));
      formData.append('paymentModes', JSON.stringify(config.paymentModes));

      const response = await uploadCSV(formData);
      setValidationResults(response.data);
      setConfirmedMapping(mapping);
      setPreviousMapping(mapping);
      setUploadStage('results');
      showToast('File validated successfully', 'success');
    } catch (err) {
      console.error('Validation API Error:', err);

      let serverError =
        err.response?.data?.error ||
        'Validation failed. Please verify the CSV format.';

      if (serverError === 'No CSV file uploaded') {
        serverError =
          'The uploaded CSV file cannot be restored after a browser refresh. Please upload the file again before continuing validation.';
      }

      setErrorMsg(serverError);
      setUploadStage('idle');

      showToast(
        'Please upload the CSV again after refresh.',
        'info'
      );
    }
  };

  const handleRunValidationClick = () => {
    if (!file) return;
    if (useSavedMapping && previousMapping) {
      runValidationWithMapping(file, previousMapping);
    }
  };

  const resetUpload = () => {
    clearWorkflowState();
    setFile(null);
    setDetectionResult(null);
    setValidationResults(null);
    setErrorMsg('');
    setUploadStage('idle');
  };

  // Helper to categorize errors for validation summary
  const getSummaryCategories = (transactions) => {
    const counts = {
      phone: 0,
      payment: 0,
      date: 0,
      orderId: 0,
      amount: 0,
      email: 0,
      required: 0,
      other: 0
    };

    transactions.forEach(t => {
      if (t.isValid) return;
      t.errors.forEach(err => {
        const lower = err.toLowerCase();
        if (lower.includes('phone') || lower.includes('country')) {
          counts.phone++;
        } else if (lower.includes('payment')) {
          counts.payment++;
        } else if (lower.includes('date')) {
          counts.date++;
        } else if (lower.includes('order_id') || lower.includes('orderid')) {
          counts.orderId++;
        } else if (lower.includes('amount')) {
          counts.amount++;
        } else if (lower.includes('email')) {
          counts.email++;
        } else if (lower.includes('missing required field')) {
          counts.required++;
        } else {
          counts.other++;
        }
      });
    });

    return counts;
  };

  return (
    <div className="py-8 px-6 max-w-7xl mx-auto space-y-8 animate-fade-in relative">
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => {
          let bg = 'bg-blue-600';
          if (t.type === 'success') bg = 'bg-green-600';
          if (t.type === 'error') bg = 'bg-red-600';
          return (
            <div
              key={t.id}
              className={`px-4 py-3 text-white text-xs font-semibold rounded-md shadow-lg flex items-center justify-between gap-3 animate-fade-in pointer-events-auto border border-white/10 ${bg}`}
            >
              <span>{t.message}</span>
              <button
                onClick={() => removeToast(t.id)}
                className="text-white hover:text-gray-200 font-bold cursor-pointer text-sm"
              >
                x
              </button>
            </div>
          );
        })}
      </div>

      {/* 1. Page Heading */}
      <div className="flex flex-col space-y-1 bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Validate your transaction data</h1>
        <p className="text-s text-gray-500 max-w-2xl font-normal leading-relaxed">
          Upload transaction files, validate data quality, detect issues automatically, and export clean datasets ready for processing.        </p>
      </div>

      {/* Error Alert Banner */}
      {errorMsg && (
        <div className="bg-red-50 border-l-4 border-red-650 p-4 rounded shadow-sm text-xs font-semibold text-red-700 flex items-start space-x-2">
          <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="font-bold">Validation Error</p>
            <p className="mt-0.5 font-medium">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* 2. Stages Views */}

      {/* Stage: Idle */}
      {uploadStage === 'idle' && (
        <div className="space-y-6">
          {useSavedMapping && previousMapping && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between text-xs text-blue-750 font-semibold shadow-sm">
              <div className="flex items-center space-x-2">
                <span>⚙️</span>
                <span>Uploading with saved column mapping active. New files will skip mapping.</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setUseSavedMapping(false);
                  setConfirmedMapping(null);
                  setPreviousMapping(null);
                  showToast('Saved mapping cleared', 'info');
                }}
                className="text-blue-600 hover:text-blue-800 underline cursor-pointer font-bold"
              >
                Reset mapping
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Upload Area */}
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4 shadow-sm">
                <h2 className="text-base font-semibold text-gray-900">Upload Transaction CSV</h2>
                <UploadSection onFileSelect={handleFileSelect} />
              </div>

              {/* Show Run Validation only when using saved mapping */}
              {useSavedMapping && previousMapping && (
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={handleRunValidationClick}
                    disabled={!file}
                    className={`w-full sm:w-64 py-3 px-6 rounded-md text-sm font-semibold text-white transition-all shadow-md duration-200 ${file
                      ? 'bg-blue-600 hover:bg-blue-700 active:scale-[0.98] cursor-pointer'
                      : 'bg-gray-300 cursor-not-allowed opacity-80'
                      }`}
                  >
                    Run Validation
                  </button>
                </div>
              )}
            </div>

            {/* Right Column: Configurations */}
            <div className="lg:col-span-5">
              <ConfigPanel config={config} onChange={handleConfigChange} />
            </div>
          </div>
        </div>
      )}

      {/* Stage: Detecting */}
      {uploadStage === 'detecting' && (
        <div className="bg-white rounded-lg border border-gray-200 p-12 shadow-sm text-center flex flex-col items-center justify-center space-y-4">
          <svg className="animate-spin h-10 w-10 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-gray-800">Analyzing your file...</h3>
            <p className="text-xs text-gray-500 font-normal">Detecting dataset schema and headers</p>
          </div>
        </div>
      )}

      {/* Stage: Rejected */}
      {uploadStage === 'rejected' && detectionResult && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 md:p-8">
          <div className="flex items-start gap-4">

            {/* Icon */}
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
              <span className="text-xl">!</span>
            </div>

            <div className="flex-1">

              {/* Heading */}
              <h3 className="text-slate-900 font-semibold text-xl mb-2">
                We couldn't detect a transaction dataset
              </h3>

              {/* Description */}
              <p className="text-slate-600 text-sm md:text-base leading-relaxed mb-6">
                This file doesn't appear to contain transaction records.
                Veriflow is designed to process datasets that include order,
                amount, and payment information.
              </p>

              <hr className="border-slate-200 mb-6" />

              {/* Missing Fields */}
              <div className="mb-6">
                <h4 className="text-slate-900 font-semibold mb-3">
                  What's missing?
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

                  {detectionResult.details?.missingGroups?.order && (
                    <div className="bg-white border border-amber-200 rounded-lg p-4">
                      <p className="font-medium text-slate-900">
                        Order Identifier
                      </p>
                      <p className="text-sm text-slate-500 mt-1">
                        e.g. order_id, txn_id, invoice_id
                      </p>
                    </div>
                  )}

                  {detectionResult.details?.missingGroups?.amount && (
                    <div className="bg-white border border-amber-200 rounded-lg p-4">
                      <p className="font-medium text-slate-900">
                        Amount Field
                      </p>
                      <p className="text-sm text-slate-500 mt-1">
                        e.g. amount, price, total
                      </p>
                    </div>
                  )}

                  {detectionResult.details?.missingGroups?.payment && (
                    <div className="bg-white border border-amber-200 rounded-lg p-4">
                      <p className="font-medium text-slate-900">
                        Payment Mode
                      </p>
                      <p className="text-sm text-slate-500 mt-1">
                        e.g. payment_mode, payment_method
                      </p>
                    </div>
                  )}

                </div>
              </div>

              {/* Detected Columns */}
              <div className="mb-6">
                <h4 className="text-slate-900 font-semibold mb-2">
                  Detected columns
                </h4>

                <div className="bg-white border border-slate-200 rounded-lg px-4 py-3">
                  <p className="text-sm text-slate-700 font-mono break-all">
                    {detectionResult.details?.foundHeaders?.join(', ')}
                  </p>
                </div>
              </div>

              {/* CTA */}
              <button
                type="button"
                onClick={resetUpload}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer"
              >
                Upload another file
              </button>

            </div>
          </div>
        </div>
      )}

      {/* Stage: Mapping */}
      {uploadStage === 'mapping' && detectionResult && (
        <ColumnMappingUI
          headers={detectionResult.headers}
          suggestedMapping={detectionResult.suggestedMapping}
          sampleValues={detectionResult.sampleValues}
          onConfirm={(mapping) => runValidationWithMapping(file, mapping)}
          onCancel={resetUpload}
        />
      )}

      {/* Stage: Validating */}
      {uploadStage === 'validating' && (
        <div className="bg-white rounded-lg border border-gray-200 p-12 shadow-sm text-center flex flex-col items-center justify-center space-y-4">
          <svg className="animate-spin h-10 w-10 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-gray-800">Processing and validating your file...</h3>
            <p className="text-xs text-gray-500 font-normal">Streaming CSV rows and applying integrity rules</p>
          </div>
        </div>
      )}

      {/* Stage: Results */}
      {uploadStage === 'results' && validationResults && (
        <div className="space-y-8 animate-fade-in">
          {/* Close results / Validate another button */}
          <div className="flex justify-between items-center bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex-wrap gap-4">
            <div className="flex flex-col space-y-0.5">
              <span className="text-s text-gray-500">Currently viewing results for</span>
              <span className="text-sm font-semibold text-gray-900">{file?.name || 'Uploaded File'}</span>
            </div>

            <div className="flex items-center gap-3">
              {confirmedMapping && (
                <button
                  type="button"
                  onClick={() => {
                    setUseSavedMapping(true);
                    setFile(null);
                    setValidationResults(null);
                    setErrorMsg('');
                    setUploadStage('idle');
                  }}
                  className="bg-blue-50 border border-blue-200 hover:bg-blue-100/75 text-blue-750 px-4 py-2 rounded-md text-sm font-semibold shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <span>Upload another file with same mapping</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  clearWorkflowState();
                  setUseSavedMapping(false);
                  setConfirmedMapping(null);
                  setFile(null);
                  setValidationResults(null);
                  setErrorMsg('');
                  setUploadStage('idle');
                }}
                className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-md text-sm font-semibold shadow-sm transition-colors cursor-pointer"
              >
                Validate Another File
              </button>
            </div>
          </div>

          {/* Validation Summary Card */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Validation Summary
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Overview of validation results and detected data quality issues.
              </p>
            </div>

            <hr className="border-gray-200 mb-4" />

            <div className="space-y-3">
              <p className="text-green-700 font-medium text-sm">
                {validationResults.validRows} records successfully validated
              </p>

              {validationResults.invalidRows > 0 ? (
                <>
                  <p className="text-red-700 font-medium text-sm">
                    {validationResults.invalidRows} records require attention
                  </p>

                  <ul className="space-y-2 text-sm text-gray-600 pl-5 list-disc">
                    {Object.entries(getSummaryCategories(validationResults.transactions))
                      .filter(([_, count]) => count > 0)
                      .map(([category, count]) => {
                        let text = '';
                        if (category === 'phone') text = 'Invalid phone number';
                        if (category === 'payment') text = 'Missing or invalid payment mode';
                        if (category === 'date') text = 'Invalid date format';
                        if (category === 'orderId') text = 'Duplicate or missing order ID';
                        if (category === 'amount') text = 'Invalid amount';
                        if (category === 'email') text = 'Invalid email format';
                        if (category === 'required') text = 'Missing required fields';
                        if (category === 'other') text = 'Other validation issues';

                        return (
                          <li key={category}>
                            {count} records — {text}
                          </li>
                        );
                      })}
                  </ul>

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-4">
                    <p className="text-sm text-amber-800">
                      Review and correct the invalid records, then upload the updated dataset for validation.
                    </p>
                  </div>
                </>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-green-800">
                    All records passed validation and are ready for export.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Exporters */}
          <DownloadSection
            transactions={validationResults.transactions}
            filename={file?.name || 'export.csv'}
            onDownloadStart={showToast}
          />

          {/* Results dashboard metrics & table */}
          <ResultsDashboard results={validationResults} />
        </div>
      )}
    </div>
  );
}

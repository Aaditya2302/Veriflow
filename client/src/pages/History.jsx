import React, { useState, useEffect } from 'react';
import { getHistory, getUploadDetail } from '../services/api';
import ValidationTable from '../components/ValidationTable';

export default function History() {
  const [historyList, setHistoryList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedUploadId, setExpandedUploadId] = useState(null);
  const [expandedDetails, setExpandedDetails] = useState(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch history list on load
  const fetchHistory = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const response = await getHistory();
      setHistoryList(response.data);
    } catch (err) {
      console.error('Error fetching upload history:', err);
      setErrorMsg('Failed to load validation history logs from server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Handle row details toggle
  const toggleDetails = async (uploadId) => {
    if (expandedUploadId === uploadId) {
      // Collapse
      setExpandedUploadId(null);
      setExpandedDetails(null);
      return;
    }

    setExpandedUploadId(uploadId);
    setIsDetailLoading(true);
    setExpandedDetails(null);
    try {
      const response = await getUploadDetail(uploadId);
      setExpandedDetails(response.data);
    } catch (err) {
      console.error('Error fetching details for upload:', uploadId, err);
      alert('Failed to load transaction details for this batch.');
      setExpandedUploadId(null);
    } finally {
      setIsDetailLoading(false);
    }
  };

  // Helper to format date
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  };

  return (
    <div className="py-8 px-6 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Page Heading */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex flex-col space-y-1">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Validation History</h1>
          <p className="text-sm text-gray-500 font-normal leading-relaxed">
            Review past file uploads, monitor historical success rates, and audit transactional errors.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchHistory}
          className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-md text-xs font-semibold shadow-sm transition-colors flex items-center space-x-1.5 self-start md:self-center cursor-pointer"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.213 6h-2.207" />
          </svg>
          <span>Refresh</span>
        </button>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded text-xs font-semibold text-red-700">
          {errorMsg}
        </div>
      )}

      {/* Loading indicator */}
      {isLoading ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center flex flex-col items-center justify-center space-y-4">
          <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-xs font-semibold text-gray-500">Loading history records...</span>
        </div>
      ) : historyList.length === 0 ? (
        // Empty State
        <div className="bg-white rounded-lg border border-gray-200 p-16 text-center space-y-4 shadow-sm">
          <div className="p-3 bg-gray-50 rounded-full text-gray-400 w-12 h-12 mx-auto flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-gray-800">No uploads yet</h3>
            <p className="text-xs text-gray-500 font-normal">Go validate some transaction files to see them here!</p>
          </div>
        </div>
      ) : (
        // History Cards List
        <div className="space-y-4">
          {historyList.map((upload) => {
            const successRate = upload.totalRows > 0 ? ((upload.validRows / upload.totalRows) * 100) : 0;
            const isExpanded = expandedUploadId === upload._id;

            return (
              <div
                key={upload._id}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm transition-all duration-200 hover:border-gray-300"
              >
                {/* Header Information Card Row */}
                <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  {/* Left Column: Filename & Upload Time */}
                  <div className="flex-1 space-y-2 min-w-0">
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-blue-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <h3 className="text-sm font-bold text-gray-900 truncate" title={upload.originalName}>
                        {upload.originalName}
                      </h3>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide border uppercase ${
                        upload.status === 'completed'
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : upload.status === 'processing'
                          ? 'bg-blue-50 text-blue-700 border-blue-200 animate-pulse'
                          : 'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {upload.status}
                      </span>
                    </div>
                    
                    <p className="text-[11px] text-gray-500 font-semibold">
                      Uploaded at: <span className="font-normal text-gray-700">{formatDate(upload.uploadedAt)}</span>
                    </p>
                  </div>

                  {/* Middle Column: Rows Metadata */}
                  <div className="grid grid-cols-3 gap-6 text-center shrink-0">
                    <div>
                      <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Total</span>
                      <span className="text-sm font-bold text-gray-900">{upload.totalRows}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider text-green-650">Valid</span>
                      <span className="text-sm font-bold text-green-650">{upload.validRows}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider text-red-650">Invalid</span>
                      <span className="text-sm font-bold text-red-650">{upload.invalidRows}</span>
                    </div>
                  </div>

                  {/* Right Column: Progress bar Success Rate & Button */}
                  <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 shrink-0 w-full md:w-auto">
                    <div className="space-y-1 w-full md:w-36">
                      <div className="flex justify-between text-[11px] font-bold">
                        <span className="text-gray-500">Success Rate</span>
                        <span className="text-blue-600">{successRate.toFixed(1)}%</span>
                      </div>
                      {/* Custom Success Rate Bar */}
                      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden border border-gray-150">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${successRate}%` }}
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleDetails(upload._id)}
                      disabled={upload.status !== 'completed'}
                      className={`px-4 py-2 rounded-md text-xs font-semibold shadow-sm border transition-colors flex items-center justify-center space-x-1 cursor-pointer w-full md:w-auto ${
                        isExpanded
                          ? 'bg-gray-100 text-gray-700 border-gray-300'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
                      }`}
                    >
                      <span>{isExpanded ? 'Hide Details' : 'View Details'}</span>
                      <svg
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Collapsible Details Area */}
                {isExpanded && (
                  <div className="border-t border-gray-200 bg-gray-50 p-6 space-y-4">
                    {isDetailLoading ? (
                      <div className="flex items-center justify-center py-8 space-x-2">
                        <svg className="animate-spin h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span className="text-xs text-gray-500 font-semibold">Loading detail table...</span>
                      </div>
                    ) : expandedDetails ? (
                      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-inner">
                        <ValidationTable transactions={expandedDetails.transactions} />
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 text-center">Failed to load detailed logs.</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

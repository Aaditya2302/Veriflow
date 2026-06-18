import React, { useState } from 'react';
import Papa from 'papaparse';
import JSZip from 'jszip';

export default function DownloadSection({ transactions = [], filename = 'transactions', onDownloadStart }) {
  const [isZipping, setIsZipping] = useState(false);

  const validTransactions = transactions.filter(t => t.isValid);
  const invalidTransactions = transactions.filter(t => !t.isValid);

  const baseName = filename.replace(/\.csv$/i, '');

  // 1. Download Valid Rows
  const downloadValid = () => {
    if (validTransactions.length === 0) {
      alert('No valid rows available to download.');
      return;
    }

    if (onDownloadStart) {
      onDownloadStart('↓ Download started', 'info');
    }

    const dataToExport = validTransactions.map(t => {
      const { _originalData, ...cleanData } = t.rowData || {};
      return cleanData;
    });
    const csvContent = Papa.unparse(dataToExport);

    triggerDownload(csvContent, `${baseName}_valid.csv`, 'text/csv');
  };

  // 2. Download Error Report
  const downloadErrors = () => {
    if (invalidTransactions.length === 0) {
      alert('No invalid rows found. Error report is empty!');
      return;
    }

    if (onDownloadStart) {
      onDownloadStart('↓ Download started', 'info');
    }

    const dataToExport = invalidTransactions.map(t => {
      const { _originalData, ...cleanData } = t.rowData || {};
      return {
        ...cleanData,
        validation_errors: t.errors.join(' | ')
      };
    });
    const csvContent = Papa.unparse(dataToExport);

    triggerDownload(csvContent, `${baseName}_error_report.csv`, 'text/csv');
  };

  // 3. Download Chunked ZIP (Valid rows in batches of 1000)
  const downloadZip = async () => {
    if (validTransactions.length === 0) {
      alert('No valid rows available for chunked export.');
      return;
    }

    if (onDownloadStart) {
      onDownloadStart('↓ Download started', 'info');
    }

    setIsZipping(true);
    try {
      const zip = new JSZip();
      const rawValidRows = validTransactions.map(t => {
        const { _originalData, ...cleanData } = t.rowData || {};
        return cleanData;
      });
      const chunkSize = 1000;
      const totalChunks = Math.ceil(rawValidRows.length / chunkSize);

      for (let i = 0; i < totalChunks; i++) {
        const chunk = rawValidRows.slice(i * chunkSize, (i + 1) * chunkSize);
        const csvContent = Papa.unparse(chunk);
        zip.file(`chunk_${i + 1}.csv`, csvContent);
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${baseName}_valid_chunks.zip`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to generate zip:', err);
      alert('An error occurred generating the ZIP bundle.');
    } finally {
      setIsZipping(false);
    }
  };

  const triggerDownload = (content, fileName, mimeType) => {
    const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4 shadow-sm">
      <div>
        <h3 className="text-base font-semibold text-gray-900">Export Options</h3>
        <p className="text-sm text-gray-500">Download validation outputs in your preferred format</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Valid CSV Download */}
        <button
          type="button"
          onClick={downloadValid}
          disabled={validTransactions.length === 0}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-md text-sm font-semibold shadow-sm transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Download Valid Rows ({validTransactions.length})</span>
        </button>

        {/* Error CSV Download */}
        <button
          type="button"
          onClick={downloadErrors}
          disabled={invalidTransactions.length === 0}
          className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-md text-sm font-semibold shadow-sm transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>Download Error Report ({invalidTransactions.length})</span>
        </button>

        {/* Chunked ZIP Download */}
        <button
          type="button"
          onClick={downloadZip}
          disabled={validTransactions.length === 0 || isZipping}
          className="bg-gray-800 hover:bg-gray-950 text-white px-4 py-2.5 rounded-md text-sm font-semibold shadow-sm transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isZipping ? (
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          )}
          <span>{isZipping ? 'Bundling...' : `Download ZIP (1000 rows/file)`}</span>
        </button>
      </div>
    </div>
  );
}

import React, { useState, useRef, useEffect } from 'react';
import Papa from 'papaparse';

export default function UploadSection({ onFileSelect }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState([]);
  const [previewHeaders, setPreviewHeaders] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Clear preview and file when component mounts or file changes to null from parent
  useEffect(() => {
    if (!file) {
      setPreview([]);
      setPreviewHeaders([]);
    }
  }, [file]);

  const handleFile = (selectedFile) => {
    if (!selectedFile) return;

    // Check extension
    const extension = selectedFile.name.split('.').pop().toLowerCase();
    if (extension !== 'csv') {
      alert('Only CSV files are allowed.');
      return;
    }

    setFile(selectedFile);
    onFileSelect(selectedFile);

    // Read and parse first 5 rows using PapaParse
    Papa.parse(selectedFile, {
      header: true,
      preview: 5,
      skipEmptyLines: 'greedy',
      complete: (results) => {
        if (results.data && results.data.length > 0) {
          setPreviewHeaders(Object.keys(results.data[0]));
          setPreview(results.data);
        } else {
          setPreview([]);
          setPreviewHeaders([]);
        }
      },
      error: (error) => {
        console.error('Error previewing file:', error);
      }
    });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const triggerBrowse = () => {
    fileInputRef.current.click();
  };

  const handleInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const handleRemoveFile = (e) => {
    e.stopPropagation();
    setFile(null);
    setPreview([]);
    setPreviewHeaders([]);
    onFileSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Helper to format file size
  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Dropzone Container */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={triggerBrowse}
        className={`border-2 border-dashed rounded-lg p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 ${
          isDragging
            ? 'border-blue-500 bg-blue-50/50 scale-[1.01]'
            : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/20'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleInputChange}
          accept=".csv"
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-3">
          {/* File Upload Icon */}
          <div className="p-3 bg-blue-50 rounded-full text-blue-600">
            <svg className="w-7 h-7 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>

          {file ? (
            <div className="space-y-1">
              <p className="text-sm sm:text-base font-semibold text-gray-900 break-all">{file.name}</p>
              <p className="text-xs text-gray-500">{formatBytes(file.size)}</p>
              <button
                type="button"
                onClick={handleRemoveFile}
                className="mt-2 text-xs font-semibold text-red-600 hover:text-red-800 transition-colors px-2.5 py-1 bg-red-50 hover:bg-red-100 rounded-md inline-flex items-center space-x-1"
              >
                <span>Remove File</span>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="space-y-1">
              <p className="text-sm sm:text-base font-medium text-gray-700">
                Drag and drop your CSV file here, or{' '}
                <span className="text-blue-600 font-semibold hover:underline">browse</span>
              </p>
              <p className="text-xs text-gray-500 font-normal">Supports standard CSV files up to 50MB</p>
            </div>
          )}
        </div>
      </div>

      {/* CSV Preview Section */}
      {preview.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">File Preview (First 5 Rows)</h3>
            <span className="text-xs text-gray-500 hidden sm:inline">Only showing structure</span>
          </div>

          <div className="overflow-x-auto -mx-4 sm:mx-0 rounded sm:border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200 text-xs">
              <thead className="bg-gray-50">
                <tr>
                  {previewHeaders.map((header) => (
                    <th
                      key={header}
                      scope="col"
                      className="px-3 sm:px-4 py-2.5 text-left font-semibold text-gray-700 tracking-wider whitespace-nowrap"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {preview.map((row, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    {previewHeaders.map((header) => (
                      <td key={header} className="px-3 sm:px-4 py-2 text-gray-600 max-w-[200px] truncate whitespace-nowrap">
                        {row[header] !== undefined && row[header] !== null ? String(row[header]) : ''}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

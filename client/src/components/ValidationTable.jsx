import React, { useState, useEffect } from 'react';

export default function ValidationTable({ transactions = [] }) {
  const [filter, setFilter] = useState('all'); // 'all' | 'valid' | 'invalid'
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 50;

  // Reset page to 1 when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchTerm]);

  // Apply filters and searches
  const filteredTransactions = transactions.filter(t => {
    // 1. Status Filter
    if (filter === 'valid' && !t.isValid) return false;
    if (filter === 'invalid' && t.isValid) return false;

    // 2. Search Text Filter (checks Order ID, Phone, and Country Code)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const orderId = String(t.rowData?.order_id || '').toLowerCase();
      const phone = String(t.rowData?.phone || '').toLowerCase();
      const country = String(t.rowData?.country_code || '').toLowerCase();
      const errorMsg = t.errors.join(' ').toLowerCase();

      return orderId.includes(term) || phone.includes(term) || country.includes(term) || errorMsg.includes(term);
    }

    return true;
  });

  // Pagination calculation
  const totalRows = filteredTransactions.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedTransactions = filteredTransactions.slice(startIndex, startIndex + rowsPerPage);

  // Helper to extract date field value
  const getDateValue = (rowData) => {
    if (!rowData) return '';
    const dateKey = Object.keys(rowData).find(k => k.toLowerCase().includes('date'));
    return dateKey ? rowData[dateKey] : '';
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Status Tab Filters */}
        <div className="inline-flex rounded-lg border border-gray-200 p-1 bg-white shadow-sm space-x-1">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all duration-150 ${
              filter === 'all'
                ? 'bg-blue-600 text-white shadow'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            All Rows ({transactions.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('valid')}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all duration-150 ${
              filter === 'valid'
                ? 'bg-green-600 text-white shadow'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            Valid Only ({transactions.filter(t => t.isValid).length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('invalid')}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all duration-150 ${
              filter === 'invalid'
                ? 'bg-red-600 text-white shadow'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            Invalid Only ({transactions.filter(t => !t.isValid).length})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search by ID, phone, country..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-1.5 bg-white border border-gray-300 rounded-md text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 w-full text-gray-800"
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-xs">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left font-bold text-gray-550 uppercase tracking-wider w-16">Row #</th>
              <th scope="col" className="px-4 py-3 text-left font-bold text-gray-550 uppercase tracking-wider">Order ID</th>
              <th scope="col" className="px-4 py-3 text-left font-bold text-gray-550 uppercase tracking-wider">Phone</th>
              <th scope="col" className="px-4 py-3 text-left font-bold text-gray-550 uppercase tracking-wider">Country</th>
              <th scope="col" className="px-4 py-3 text-left font-bold text-gray-550 uppercase tracking-wider">Amount</th>
              <th scope="col" className="px-4 py-3 text-left font-bold text-gray-550 uppercase tracking-wider">Payment Mode</th>
              <th scope="col" className="px-4 py-3 text-left font-bold text-gray-550 uppercase tracking-wider">Date</th>
              <th scope="col" className="px-4 py-3 text-left font-bold text-gray-550 uppercase tracking-wider w-24">Status</th>
              <th scope="col" className="px-4 py-3 text-left font-bold text-gray-550 uppercase tracking-wider">Errors</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedTransactions.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-12 text-center text-gray-500 font-medium">
                  No transaction records match the filter criteria.
                </td>
              </tr>
            ) : (
              paginatedTransactions.map((t, idx) => (
                <tr
                  key={t._id || idx}
                  className={`transition-colors duration-100 hover:bg-blue-50/10 ${
                    t.isValid ? (idx % 2 === 0 ? 'bg-white' : 'bg-gray-50') : 'bg-red-50/20'
                  }`}
                >
                  <td className="px-4 py-3 font-semibold text-gray-500">{t.rowIndex}</td>
                  <td className="px-4 py-3 font-semibold text-gray-950">{t.rowData?.order_id || 'N/A'}</td>
                  <td className="px-4 py-3 text-gray-700 font-mono">{t.rowData?.phone || 'N/A'}</td>
                  <td className="px-4 py-3 text-gray-750 font-bold">{t.rowData?.country_code || 'N/A'}</td>
                  <td className="px-4 py-3 font-semibold text-gray-800">
                    {t.rowData?.amount !== undefined ? Number(t.rowData.amount).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : 'N/A'}
                  </td>
                  <td className="px-4 py-3 text-gray-700 capitalize">{t.rowData?.payment_mode || 'N/A'}</td>
                  <td className="px-4 py-3 text-gray-700">{getDateValue(t.rowData) || 'N/A'}</td>
                  <td className="px-4 py-3">
                    {t.isValid ? (
                      <span className="inline-flex bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-semibold">
                        Valid
                      </span>
                    ) : (
                      <span className="inline-flex bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-semibold">
                        Invalid
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-red-650 max-w-xs break-words font-medium">
                    {t.errors && t.errors.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {t.errors.map((err, errIdx) => (
                          <span
                            key={errIdx}
                            className="bg-red-50 text-red-700 border border-red-100 px-2 py-0.5 rounded text-[10px] font-semibold inline-block"
                          >
                            {err}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400 font-normal">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-lg shadow-sm">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-xs font-medium text-gray-750 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-xs font-medium text-gray-750 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-xs text-gray-650">
                Showing <span className="font-semibold text-gray-900">{startIndex + 1}</span> to{' '}
                <span className="font-semibold text-gray-900">
                  {Math.min(startIndex + rowsPerPage, totalRows)}
                </span>{' '}
                of <span className="font-semibold text-gray-900">{totalRows}</span> rows
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <button
                  type="button"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center rounded-l-md px-2.5 py-1.5 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Previous</span>
                  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                  </svg>
                </button>
                
                {/* Page Number Badges */}
                <span className="relative inline-flex items-center px-4 py-1.5 text-xs font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 bg-gray-50">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  type="button"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center rounded-r-md px-2.5 py-1.5 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Next</span>
                  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

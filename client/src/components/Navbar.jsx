import React from 'react';
import { Link } from './Router';
import { ShieldCheck } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {/* Enterprise shield icon */}
          <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" strokeWidth={2.2} />
          <span className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">Veriflow</span>
        </div>

        <nav className="flex space-x-4 sm:space-x-6">
          <Link
            to="/"
            className={({ isActive }) =>
              `text-sm font-medium transition-colors duration-150 ${
                isActive
                  ? 'text-blue-600 border-b-2 border-blue-600 pb-1'
                  : 'text-gray-500 hover:text-gray-900'
              }`
            }
          >
            Validate
          </Link>
          <Link
            to="/history"
            className={({ isActive }) =>
              `text-sm font-medium transition-colors duration-150 ${
                isActive
                  ? 'text-blue-600 border-b-2 border-blue-600 pb-1'
                  : 'text-gray-500 hover:text-gray-900'
              }`
            }
          >
            History
          </Link>
        </nav>
      </div>
    </header>
  );
}

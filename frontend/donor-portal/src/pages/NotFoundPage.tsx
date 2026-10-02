/**
 * 404 Not Found Page
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#FBFBFA] flex items-center justify-center p-6 text-center">
      <div className="bg-white border border-neutral-200/90 rounded-2xl p-8 max-w-md w-full shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-neutral-100 text-neutral-600 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold text-neutral-900 mb-2">Page Not Found</h1>
        <p className="text-sm text-neutral-600 mb-6">
          The requested page could not be located in the Donor Portal.
        </p>
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#B3203A] hover:bg-[#991B32] rounded-lg transition-colors shadow-xs outline-none cursor-pointer"
        >
          <Home className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>
      </div>
    </div>
  );
};

export default NotFoundPage;

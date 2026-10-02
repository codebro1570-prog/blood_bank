import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-lg p-6 sm:p-8 text-center shadow-xs">
        <div className="w-12 h-12 rounded-lg bg-teal-50 border border-teal-200 text-[#0F6B63] flex items-center justify-center mx-auto mb-4">
          <FileQuestion className="w-6 h-6" aria-hidden="true" />
        </div>
        <span className="font-mono text-xs uppercase px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
          HTTP 404
        </span>
        <h1 className="mt-3 text-lg font-bold text-slate-900 tracking-tight">
          Page Not Found
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          The requested clinical resource or blood desk route does not exist.
        </p>
        <div className="mt-6">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#0F6B63] hover:bg-[#0A4B45] rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F6B63]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

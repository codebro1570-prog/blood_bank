import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center antialiased">
      <div className="max-w-md w-full bg-white p-8 rounded border border-slate-200 shadow-sm">
        <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="font-mono text-xs text-slate-400 mb-1">404 · NOT FOUND</div>
        <h1 className="text-lg font-bold text-slate-900 mb-2">Endpoint or View Not Found</h1>
        <p className="text-xs text-slate-500 mb-6">
          The requested route does not exist within the Blood Line operations console.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Dashboard</span>
        </Link>
      </div>
    </div>
  );
};

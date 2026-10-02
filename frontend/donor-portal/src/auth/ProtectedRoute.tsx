/**
 * ProtectedRoute: Enforces role = 'DONOR'
 * Redirects unauthenticated users to /login
 * Displays 403 Not Allowed for non-DONOR roles
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';
import ForbiddenPage from '../pages/ForbiddenPage';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FBFBFA] flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-[#B3203A]/20 border-t-[#B3203A] rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-500">Checking credentials...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user.role !== 'DONOR') {
    return <ForbiddenPage />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;

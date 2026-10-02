import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, adminOnly = false }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-slate-300 border-t-[#B3203A] rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-medium tracking-wide uppercase">Authenticating Portal Session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Accepted roles are STAFF and ADMIN
  if (user.role !== 'STAFF' && user.role !== 'ADMIN') {
    return <Navigate to="/forbidden" replace />;
  }

  // Guard for admin-only routes
  if (adminOnly && user.role !== 'ADMIN') {
    return <Navigate to="/forbidden" replace />;
  }

  return <>{children}</>;
};

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSuperAdminAuth } from '@/contexts/SuperAdminAuthContext';

interface SuperAdminProtectedRouteProps {
  children: React.ReactNode;
}

export const SuperAdminProtectedRoute: React.FC<SuperAdminProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useSuperAdminAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/super-admin/login" replace />;
  }

  return <>{children}</>;
};

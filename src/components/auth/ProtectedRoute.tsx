import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/types/auth";

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
  children?: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  allowedRoles,
  children,
}) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>; // Or a more sophisticated loading spinner
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If allowedRoles are specified, check if the user's role is permitted
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Redirect to a safe page like the dashboard if the role does not match
    return <Navigate to="/dashboard" replace />;
  }

  // This handles nested routes. If the component has children (like a layout),
  // it renders them. Otherwise, it renders the next route in the hierarchy.
  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;

import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/types/auth";
import NotFound from "@/pages/NotFound";

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
  children?: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  allowedRoles,
  children,
}) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div>Loading...</div>; // Or a more sophisticated loading spinner
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If allowedRoles are specified, check if the user's role is permitted
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // If trying to access dashboard without permission, show 404
    if (location.pathname === "/dashboard") {
      return <NotFound />;
    }

    // Otherwise redirect to user's home page based on role
    const getHomePath = () => {
      switch (user.role) {
        case "admin":
        case "manager":
          return "/dashboard";
        case "waiter":
          return "/tables";
        case "chef":
          return "/kitchen";
        case "cashier":
          const cashierLayoutMode =
            (user?.restaurant?.featureFlags?.cashier_layout_mode as string) ||
            "both";
          if (cashierLayoutMode === "manage_orders") {
            return "/cashier";
          } else if (cashierLayoutMode === "pos_only") {
            return "/pos";
          } else {
            return "/pos";
          }
        default:
          return "/dashboard";
      }
    };

    return <Navigate to={getHomePath()} replace />;
  }

  // This handles nested routes. If the component has children (like a layout),
  // it renders them. Otherwise, it renders the next route in the hierarchy.
  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;

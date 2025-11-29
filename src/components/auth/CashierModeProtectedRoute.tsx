// src/components/auth/CashierModeProtectedRoute.tsx
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface CashierModeProtectedRouteProps {
  children: React.ReactNode;
  requiredMode: "manage_orders" | "pos_only" | "both";
}

/**
 * Protects routes based on cashier interface mode configuration
 * Only allows access if the user's cashier mode matches the required mode
 */
export const CashierModeProtectedRoute: React.FC<
  CashierModeProtectedRouteProps
> = ({ children, requiredMode }) => {
  const { user } = useAuth();
  const location = useLocation();

  // If user is admin or manager, always allow access
  if (user?.role === "admin" || user?.role === "manager") {
    return <>{children}</>;
  }

  // Get cashier layout mode from feature flags
  const cashierLayoutMode =
    (user?.restaurant?.featureFlags?.cashier_layout_mode as string) || "both";

  // Check access based on required mode and user's configured mode
  const hasAccess = (): boolean => {
    if (cashierLayoutMode === "both") return true;

    if (
      requiredMode === "manage_orders" &&
      cashierLayoutMode === "manage_orders"
    ) {
      return true;
    }

    if (requiredMode === "pos_only" && cashierLayoutMode === "pos_only") {
      return true;
    }

    return false;
  };

  if (!hasAccess()) {
    // Redirect to the allowed page or 404
    if (cashierLayoutMode === "manage_orders") {
      return <Navigate to="/cashier" replace />;
    } else if (cashierLayoutMode === "pos_only") {
      return <Navigate to="/pos" replace />;
    }
    return <Navigate to="/404" replace />;
  }

  return <>{children}</>;
};

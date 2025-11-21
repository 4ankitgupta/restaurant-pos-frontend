import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useFeature } from "@/hooks/useFeature";

interface FeatureProtectedRouteProps {
  children: ReactNode;
  feature: string;
  fallbackPath?: string;
}

export const FeatureProtectedRoute = ({
  children,
  feature,
  fallbackPath = "/dashboard",
}: FeatureProtectedRouteProps) => {
  const hasFeature = useFeature(feature);

  if (!hasFeature) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
};

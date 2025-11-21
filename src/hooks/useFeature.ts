import { useAuth } from "@/contexts/AuthContext";

/**
 * Custom hook to check if a specific feature is enabled for the current user's restaurant
 * @param featureKey - The key of the feature to check (e.g., "ai_chat", "inventory")
 * @returns true if the feature is enabled, false otherwise
 */
export const useFeature = (featureKey: string): boolean => {
  const { user } = useAuth();

  if (!user?.restaurant?.featureFlags) {
    return false;
  }

  return user.restaurant.featureFlags[featureKey] === true;
};

export type UserRole = "admin" | "manager" | "cashier" | "waiter" | "chef";

// Backend role mapping
export const BACKEND_ROLES = {
  ADMIN: "admin",
  MANAGER: "manager",
  CASHIER: "cashier",
  WAITER: "waiter",
  KITCHEN_STAFF: "chef",
} as const;

// Cashier layout mode options
export type CashierLayoutMode = "manage_orders" | "pos_only" | "both";

// Feature flags interface
export interface FeatureFlags extends Record<string, boolean | string> {
  ai_chat?: boolean;
  inventory_management?: boolean;
  reports?: boolean;
  attendance?: boolean;
  advanced_ordering?: boolean;
  cashier_layout_mode?: CashierLayoutMode;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  restaurant?: {
    id: string;
    name: string;
    featureFlags: FeatureFlags;
  };
}

export interface AuthContext {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export type AuthResponse = {
  user: User;
  accessToken: string;
};

export type SuperAdmin = {
  id: string;
  email: string;
  name: string;
};

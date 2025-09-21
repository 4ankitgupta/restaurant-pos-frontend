export type UserRole = "admin" | "cashier" | "waiter" | "chef";

// Backend role mapping
export const BACKEND_ROLES = {
  ADMIN: "admin",
  MANAGER: "admin",
  CASHIER: "cashier",
  WAITER: "waiter",
  KITCHEN_STAFF: "chef",
} as const;

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface AuthContext {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

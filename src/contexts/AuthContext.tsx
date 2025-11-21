import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import {
  User,
  AuthContext as AuthContextType,
  BACKEND_ROLES,
} from "@/types/auth";
import { apiService, ApiError } from "@/services/apiService";
import { toast } from "@/hooks/use-toast";

// Updated interface for the context
interface IAuthContext extends AuthContextType {
  login: (email: string, password: string) => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<IAuthContext | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start loading until session is checked

  useEffect(() => {
    const checkUserSession = () => {
      try {
        const storedUser = localStorage.getItem("user");
        const accessToken = localStorage.getItem("accessToken");

        if (storedUser && accessToken) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error("Failed to parse auth data from localStorage", error);
        localStorage.clear();
      } finally {
        setIsLoading(false); // Finished checking
      }
    };

    checkUserSession();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await apiService.login(email, password);

      const { user: userData, tokens } = response.data;

      const frontendRole =
        BACKEND_ROLES[userData.role as keyof typeof BACKEND_ROLES] || "waiter";

      const userToStore: User = {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        role: frontendRole,
        avatar: `https://ui-avatars.com/api/?name=${userData.name.replace(
          /\s/g,
          "+"
        )}&background=f97316&color=fff`,
        // Include restaurant data with feature flags
        restaurant: userData.restaurant
          ? {
              id: userData.restaurant.id,
              name: userData.restaurant.name,
              featureFlags: userData.restaurant.featureFlags || {},
            }
          : undefined,
      };

      localStorage.setItem("accessToken", tokens.accessToken);
      localStorage.setItem("refreshToken", tokens.refreshToken);
      localStorage.setItem("user", JSON.stringify(userToStore));

      setUser(userToStore);

      toast({
        title: "Login successful",
        description: response.message,
      });
    } catch (error) {
      const apiError = error as ApiError;

      toast({
        title: "Login failed",
        description:
          apiError.message || "Please check your credentials and try again.",
        variant: "destructive",
      });

      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    setUser(null);

    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
  };

  const isAuthenticated = !!user;

  const value: IAuthContext = {
    user,
    login,
    logout,
    isAuthenticated,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

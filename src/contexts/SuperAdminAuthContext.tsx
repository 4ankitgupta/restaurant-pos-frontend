// src/contexts/SuperAdminAuthContext.tsx

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { superAdminApi } from "@/services/superAdminApiService";
import { SuperAdmin } from "@/types/auth"; // <-- IMPORT THE NEW TYPE
import { AxiosError } from "axios"; // <-- Import AxiosError

type SuperAdminAuthContextType = {
  admin: SuperAdmin | null; // <-- USE THE NEW TYPE
  adminToken: string | null;
  isAdminLoading: boolean;
  login: (email: string, password: string) => Promise<void>; // <-- Make async
  logout: () => void;
};

const SuperAdminAuthContext = createContext<
  SuperAdminAuthContextType | undefined
>(undefined);

type SuperAdminAuthProviderProps = {
  children: ReactNode;
};

export const SuperAdminAuthProvider: React.FC<SuperAdminAuthProviderProps> = ({
  children,
}) => {
  const [admin, setAdmin] = useState<SuperAdmin | null>(null); // <-- USE THE NEW TYPE
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [isAdminLoading, setIsAdminLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    const adminData = localStorage.getItem("admin");

    if (token && adminData !== "undefined") {
      setAdminToken(token);
      setAdmin(JSON.parse(adminData));
    }
    setIsAdminLoading(false);
  }, []);

  // --- REPLACE THE LOGIN FUNCTION WITH THIS ---
  const login = async (email: string, password: string) => {
    try {
      const response = await superAdminApi.login(email, password);

      const {
        accessToken,
        admin: adminData,
      }: { accessToken: string; admin: SuperAdmin } = response;

      localStorage.setItem("adminToken", accessToken);
      localStorage.setItem("admin", JSON.stringify(adminData));

      setAdminToken(accessToken);
      setAdmin(adminData);
    } catch (err) {
      const error = err as AxiosError;
      console.error("Super admin login failed:", error);
      // Re-throw the error so the login page can catch it
      if (error.response?.data) {
        throw new Error((error.response.data as { message: string }).message);
      }
      throw new Error("An unknown error occurred during login.");
    }
  };
  // --- END OF REPLACEMENT ---

  // --- UPDATE THE LOGOUT FUNCTION ---
  const logout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("admin"); // <-- Also remove admin data
    setAdminToken(null);
    setAdmin(null); // <-- Also clear admin state
  };
  // --- END OF UPDATE ---

  return (
    <SuperAdminAuthContext.Provider
      value={{ admin, adminToken, isAdminLoading, login, logout }}
    >
      {children}
    </SuperAdminAuthContext.Provider>
  );
};

export const useSuperAdminAuth = () => {
  const context = useContext(SuperAdminAuthContext);
  if (context === undefined) {
    throw new Error(
      "useSuperAdminAuth must be used within a SuperAdminAuthProvider"
    );
  }
  return context;
};

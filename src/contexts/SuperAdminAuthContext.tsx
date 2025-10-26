import React, { createContext, useContext, useState, useEffect } from 'react';
import { superAdminApi } from '@/services/superAdminApiService';
import { toast } from '@/hooks/use-toast';

interface SuperAdminUser {
  id: string;
  email: string;
  name?: string;
}

interface SuperAdminAuthContextType {
  user: SuperAdminUser | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const SuperAdminAuthContext = createContext<SuperAdminAuthContextType | undefined>(undefined);

export const SuperAdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<SuperAdminUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing token on mount
    const storedToken = localStorage.getItem('superAdminToken');
    const storedUser = localStorage.getItem('superAdminUser');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await superAdminApi.login(email, password);
      
      setToken(response.token);
      setUser(response.user);
      
      localStorage.setItem('superAdminToken', response.token);
      localStorage.setItem('superAdminUser', JSON.stringify(response.user));
      
      toast({
        title: "Success",
        description: "Logged in successfully",
      });
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('superAdminToken');
    localStorage.removeItem('superAdminUser');
    
    toast({
      title: "Logged Out",
      description: "You have been logged out successfully",
    });
  };

  return (
    <SuperAdminAuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isAuthenticated: !!token,
        isLoading,
      }}
    >
      {children}
    </SuperAdminAuthContext.Provider>
  );
};

export const useSuperAdminAuth = () => {
  const context = useContext(SuperAdminAuthContext);
  if (context === undefined) {
    throw new Error('useSuperAdminAuth must be used within SuperAdminAuthProvider');
  }
  return context;
};

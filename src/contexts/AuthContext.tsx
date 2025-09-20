import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, UserRole, AuthContext as AuthContextType, BACKEND_ROLES } from '@/types/auth';
import { apiService, ApiError } from '@/services/apiService';
import { toast } from '@/hooks/use-toast';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check for existing auth data on app load
    const storedUser = localStorage.getItem('user');
    const accessToken = localStorage.getItem('accessToken');
    
    if (storedUser && accessToken) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
      } catch (error) {
        // Clear invalid stored data
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      }
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await apiService.login(email, password);
      
      const { user: userData, tokens } = response.data;
      
      // Map backend role to frontend role
      const frontendRole = BACKEND_ROLES[userData.role as keyof typeof BACKEND_ROLES] || 'waiter';
      
      const user: User = {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        role: frontendRole,
        avatar: `https://ui-avatars.com/api/?name=${userData.name}&background=f97316&color=fff`
      };

      // Store tokens and user data
      localStorage.setItem('accessToken', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
      
      setUser(user);
      
      toast({
        title: "Login successful",
        description: response.message,
      });
    } catch (error) {
      const apiError = error as ApiError;
      
      toast({
        title: "Login failed",
        description: apiError.message || "Please check your credentials and try again.",
        variant: "destructive",
      });
      
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
    
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
  };

  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
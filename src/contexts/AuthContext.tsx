import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, UserRole, AuthContext as AuthContextType } from '@/types/auth';

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

  const login = async (email: string, password: string, role: UserRole) => {
    // Mock authentication - replace with actual API call
    const mockUser: User = {
      id: '1',
      name: role === 'admin' ? 'John Admin' : 
            role === 'cashier' ? 'Sarah Cashier' :
            role === 'waiter' ? 'Mike Waiter' : 'Chef David',
      email,
      role,
      avatar: `https://ui-avatars.com/api/?name=${role}&background=f97316&color=fff`
    };
    
    setUser(mockUser);
  };

  const logout = () => {
    setUser(null);
  };

  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
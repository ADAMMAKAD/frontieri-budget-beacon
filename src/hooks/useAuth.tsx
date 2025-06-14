
import React, { useState, useEffect, createContext, useContext } from 'react';
import { apiService } from '@/services/api';

interface User {
  id: string;
  email: string;
  full_name: string;
  department: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, department: string, role?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        apiService.setToken(token);
        const response = await apiService.getCurrentUser();
        if (response.data) {
          setUser(response.data);
        } else {
          apiService.clearToken();
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      apiService.clearToken();
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string, department: string, role?: string) => {
    try {
      const response = await apiService.register({
        email,
        password,
        full_name: fullName,
        department,
        role: role || 'user'
      });

      if (response.error) {
        return { error: { message: response.error } };
      }

      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const response = await apiService.login(email, password);
      
      if (response.error) {
        return { error: { message: response.error } };
      }

      if (response.data) {
        apiService.setToken(response.data.token);
        setUser(response.data.user);
      }

      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const signOut = async () => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      apiService.clearToken();
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

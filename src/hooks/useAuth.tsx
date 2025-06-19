
import React, { useState, useEffect, createContext, useContext } from 'react';
import { apiClient } from '@/lib/api';

interface User {
  id: string;
  email: string;
  full_name?: string;
  department?: string;
  role?: string;
  team_id?: string;
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
    console.log('🔐 AuthProvider - Checking initial session');
    
    // Check for existing session
    const checkSession = async () => {
      try {
        const response = await apiClient.get('/auth/me');
        if (response.user) {
          console.log('✅ User session found, setting user data...');
          setUser(response.user);
        } else {
          console.log('❌ No user session found');
          setUser(null);
        }
      } catch (error) {
        console.log('❌ No valid session, clearing user state');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);



  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    department: string,
    role?: string
  ) => {
    console.log('📝 Signing up user:', email);
    
    try {
      const response = await apiClient.post('/auth/register', {
        email,
        password,
        fullName,
        department,
        role: role || 'user'
      });
      
      console.log('📝 Sign up successful');
      return { error: null };
    } catch (error: any) {
      console.log('📝 Sign up error:', error.response?.data?.message || error.message);
      return { error: error.response?.data || error };
    }
  };

  const signIn = async (email: string, password: string) => {
    console.log('🔑 Signing in user:', email);
    
    try {
      const user = await apiClient.signIn(email, password);
      
      if (user) {
        setUser(user);
        console.log('🔑 Sign in successful');
        return { error: null };
      } else {
        console.log('🔑 Sign in failed: No user data in response');
        return { error: 'Login failed - no user data received' };
      }
    } catch (error: any) {
      console.log('🔑 Sign in error:', error.message);
      return { error: error };
    }
  };

  const signOut = async () => {
    console.log('🚪 Signing out user');
    
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.error('Error during logout:', error);
    }
    
    setUser(null);
    // Clear any stored tokens
    localStorage.removeItem('auth_token');
    
    console.log('✅ Sign out completed');
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

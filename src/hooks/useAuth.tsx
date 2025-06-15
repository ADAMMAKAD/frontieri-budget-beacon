
import React, { useState, useEffect, createContext, useContext } from 'react';
import { apiService } from '@/services/api';

interface User {
  id: string;
  email: string;
  full_name: string;
  department: string;
  role: string;
  team_id?: string;
  user_metadata?: {
    full_name?: string;
    department?: string;
  };
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
          // Transform the response data to match our User interface
          const userData = {
            id: response.data.id,
            email: response.data.email,
            full_name: response.data.firstName + ' ' + response.data.lastName,
            department: response.data.team?.name || 'Unknown',
            role: response.data.role.toLowerCase(),
            team_id: response.data.team?.id,
            user_metadata: {
              full_name: response.data.firstName + ' ' + response.data.lastName,
              department: response.data.team?.name || 'Unknown'
            }
          };
          setUser(userData);
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
      console.log('Attempting to sign in with:', { email });
      const response = await apiService.login(email, password);

      console.log('Sign in response:', response);

      if (response.error) {
        console.log('Sign in error from API:', response.error);
        return { error: { message: response.error } };
      }

      // Corrected: Unwrap the actual user+token directly from response.data
      const rawUserData = response.data?.user;
      const rawToken = response.data?.token;

      if (rawUserData && rawToken) {
        console.log('Setting token and user data...');
        apiService.setToken(rawToken);

        // Transform the response data to match our User interface
        const userData = {
          id: rawUserData.id,
          email: rawUserData.email,
          full_name: (rawUserData.firstName || '') + ' ' + (rawUserData.lastName || ''),
          department: (rawUserData.team && rawUserData.team.name) || 'Unknown',
          role: (rawUserData.role || 'user').toLowerCase(),
          team_id: rawUserData.team?.id || null,
          user_metadata: {
            full_name: (rawUserData.firstName || '') + ' ' + (rawUserData.lastName || ''),
            department: (rawUserData.team && rawUserData.team.name) || 'Unknown'
          }
        };

        console.log('Transformed user data:', userData);
        setUser(userData);
        console.log('User signed in successfully:', userData);
        return { error: null };
      } else {
        console.log('Invalid response structure after API login:', response);
        return { error: { message: 'Invalid response from server' } };
      }
    } catch (error) {
      console.error('Sign in error:', error);
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

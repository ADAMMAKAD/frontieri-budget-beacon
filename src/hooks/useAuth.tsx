
import React, { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

interface AuthUser {
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
  user: AuthUser | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, department: string, role?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('Setting up auth state listener...');
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        setSession(session);
        
        if (session?.user) {
          try {
            console.log('Fetching user profile for:', session.user.id);
            
            // Fetch user profile from profiles table
            const { data: profile, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (error && error.code !== 'PGRST116') {
              console.error('Error fetching profile:', error);
            }

            if (profile) {
              console.log('Profile found:', profile);
              setUser({
                id: session.user.id,
                email: session.user.email || '',
                full_name: profile.full_name || '',
                department: profile.department || '',
                role: profile.role || 'user',
                team_id: profile.team_id
              });
            } else {
              console.log('No profile found, creating default user object');
              setUser({
                id: session.user.id,
                email: session.user.email || '',
                full_name: session.user.user_metadata?.full_name || '',
                department: session.user.user_metadata?.department || '',
                role: 'user',
                team_id: undefined
              });
            }
          } catch (error) {
            console.error('Exception while fetching profile:', error);
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              full_name: session.user.user_metadata?.full_name || '',
              department: session.user.user_metadata?.department || '',
              role: 'user',
              team_id: undefined
            });
          }
        } else {
          console.log('No session, clearing user');
          setUser(null);
        }
        setLoading(false);
      }
    );

    // Check for existing session
    const getInitialSession = async () => {
      try {
        console.log('Checking for existing session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setLoading(false);
          return;
        }
        
        console.log('Initial session check:', session?.user?.email || 'No session');
        // The onAuthStateChange handler will be called automatically
      } catch (error) {
        console.error('Exception during session check:', error);
        setLoading(false);
      }
    };

    getInitialSession();

    return () => {
      console.log('Cleaning up auth subscription');
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, fullName: string, department: string, role?: string) => {
    try {
      console.log('Attempting signup for:', email);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: fullName,
            department,
            role: role || 'user'
          }
        }
      });

      if (error) {
        console.error('Signup error:', error);
        return { error: { message: error.message } };
      }

      console.log('Signup successful:', data);
      return { error: null };
    } catch (error) {
      console.error('Signup exception:', error);
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Attempting signin for:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error('Signin error:', error);
        return { error: { message: error.message } };
      }

      console.log('Login successful:', data.user?.email);
      return { error: null };
    } catch (error) {
      console.error('Signin exception:', error);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      console.log('Attempting signout...');
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Signout error:', error);
      } else {
        console.log('Signout successful');
      }
    } catch (error) {
      console.error('Signout exception:', error);
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

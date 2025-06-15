
import React, { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
    // First, check for existing session immediately
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting session:', error);
          setLoading(false);
          return;
        }
        
        if (session?.user) {
          await fetchProfile(session.user);
        }
        setLoading(false);
      } catch (error) {
        console.error('Error in getInitialSession:', error);
        setLoading(false);
      }
    };

    getInitialSession();

    // Setup auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session?.user?.email);
      
      if (session?.user) {
        await fetchProfile(session.user);
      } else {
        setUser(null);
      }
      
      if (!loading) {
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (authUser: any) => {
    try {
      console.log('Fetching profile for user:', authUser.id);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
      }

      // If no profile exists, create one
      if (!data && authUser) {
        console.log('No profile found, creating new profile...');
        const newProfile = {
          id: authUser.id,
          full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
          department: authUser.user_metadata?.department || 'General',
          role: authUser.email === 'admin@gmail.com' ? 'admin' : 'user'
        };

        const { error: insertError } = await supabase
          .from('profiles')
          .insert([newProfile])
          .select()
          .single();

        if (insertError) {
          console.error('Error creating profile:', insertError);
        } else {
          console.log('Profile created successfully');
        }

        setUser({
          id: authUser.id,
          email: authUser.email ?? '',
          full_name: newProfile.full_name,
          department: newProfile.department,
          role: newProfile.role,
          team_id: '',
        });
      } else {
        // Profile exists, use it
        setUser({
          id: authUser.id,
          email: authUser.email ?? '',
          full_name: data?.full_name ?? authUser.email?.split('@')[0] ?? 'User',
          department: data?.department ?? 'General',
          role: data?.role ?? (authUser.email === 'admin@gmail.com' ? 'admin' : 'user'),
          team_id: data?.team_id ?? '',
        });
      }
    } catch (error) {
      console.error('Error in fetchProfile:', error);
      // Still set basic user info even if profile operations fail
      setUser({
        id: authUser.id,
        email: authUser.email ?? '',
        full_name: authUser.email?.split('@')[0] ?? 'User',
        department: 'General',
        role: authUser.email === 'admin@gmail.com' ? 'admin' : 'user',
      });
    }
  };

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    department: string,
    role?: string
  ) => {
    try {
      let { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, department, role: role || 'user' },
          emailRedirectTo: `${window.location.origin}/`
        }
      });
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      let { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
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

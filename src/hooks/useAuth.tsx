
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
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('Initializing auth...');
        
        // Get initial session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
        }

        if (session?.user && mounted) {
          console.log('Found existing session for:', session.user.email);
          await fetchProfile(session.user);
        }

        if (mounted) {
          setLoading(false);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      console.log('Auth state change:', event, session?.user?.email);
      
      if (session?.user) {
        await fetchProfile(session.user);
      } else {
        setUser(null);
      }
    });

    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (authUser: any) => {
    try {
      console.log('Fetching profile for user:', authUser.id);
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
      }

      // Create or update profile if needed
      if (!profile && authUser) {
        console.log('No profile found, creating new profile...');
        
        const isAdmin = authUser.email === 'admin@gmail.com';
        const newProfile = {
          id: authUser.id,
          full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
          department: authUser.user_metadata?.department || 'General',
          role: isAdmin ? 'admin' : 'user',
          email: authUser.email
        };

        const { error: insertError } = await supabase
          .from('profiles')
          .insert([newProfile]);

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
      } else if (profile) {
        // Profile exists, use it
        setUser({
          id: authUser.id,
          email: (profile.email || authUser.email) ?? '',
          full_name: profile.full_name ?? (authUser.email?.split('@')[0] ?? 'User'),
          department: profile.department ?? 'General',
          role: profile.role ?? (authUser.email === 'admin@gmail.com' ? 'admin' : 'user'),
          team_id: profile.team_id ?? '',
        });
      } else {
        // Fallback user object
        setUser({
          id: authUser.id,
          email: authUser.email ?? '',
          full_name: authUser.email?.split('@')[0] ?? 'User',
          department: 'General',
          role: authUser.email === 'admin@gmail.com' ? 'admin' : 'user',
        });
      }
    } catch (error) {
      console.error('Error in fetchProfile:', error);
      // Set basic user info even if profile operations fail
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
      const { error } = await supabase.auth.signUp({
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
      const { error } = await supabase.auth.signInWithPassword({ email, password });
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

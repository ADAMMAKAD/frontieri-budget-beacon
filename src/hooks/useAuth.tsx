
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
  error: string | null;
  signUp: (email: string, password: string, fullName: string, department: string, role?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('🔄 Initializing auth...');
        setError(null);
        
        // Test Supabase connection first
        try {
          console.log('🔍 Testing Supabase connection...');
          const { data, error: healthError } = await supabase.from('profiles').select('count').limit(1);
          if (healthError) {
            console.error('❌ Supabase connection test failed:', healthError);
            console.error('❌ Full error details:', JSON.stringify(healthError, null, 2));
            setError(`Database connection error: ${healthError.message}`);
            setLoading(false);
            return;
          } else {
            console.log('✅ Supabase connection test passed');
          }
        } catch (connectionError) {
          console.error('❌ Supabase connection test error:', connectionError);
          setError(`Connection test failed: ${connectionError instanceof Error ? connectionError.message : 'Unknown error'}`);
          setLoading(false);
          return;
        }
        
        // Get initial session
        console.log('🔍 Getting initial session...');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('❌ Session error:', sessionError);
          console.error('❌ Full session error details:', JSON.stringify(sessionError, null, 2));
          setError(`Session error: ${sessionError.message}`);
        }

        if (session?.user && mounted) {
          console.log('✅ Found existing session for:', session.user.email);
          try {
            await fetchProfile(session.user);
          } catch (profileError) {
            console.error('❌ Profile fetch error during init:', profileError);
            // Use basic user info as fallback
            setUser({
              id: session.user.id,
              email: session.user.email ?? '',
              full_name: session.user.email?.split('@')[0] ?? 'User',
              department: 'General',
              role: session.user.email === 'admin@gmail.com' ? 'admin' : 'user',
            });
          }
        } else {
          console.log('ℹ️ No existing session found');
        }

        if (mounted) {
          console.log('🏁 Setting loading to false in initializeAuth');
          setLoading(false);
        }
      } catch (error) {
        console.error('💥 Auth initialization error:', error);
        if (mounted) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          setError(`Auth initialization failed: ${errorMessage}`);
          setLoading(false);
        }
      }
    };

    // Set up auth state listener
    console.log('🎧 Setting up auth state listener...');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) {
        console.log('⚠️ Component unmounted, skipping auth state change');
        return;
      }

      console.log('🔄 Auth state change:', event, session?.user?.email);
      setError(null);
      
      try {
        if (session?.user) {
          console.log('👤 User found in auth state change, fetching profile...');
          try {
            await fetchProfile(session.user);
          } catch (profileError) {
            console.error('❌ Profile fetch error in auth change:', profileError);
            // Set basic user info as fallback
            setUser({
              id: session.user.id,
              email: session.user.email ?? '',
              full_name: session.user.email?.split('@')[0] ?? 'User',
              department: 'General',
              role: session.user.email === 'admin@gmail.com' ? 'admin' : 'user',
            });
          }
        } else {
          console.log('🚫 No user in auth state change, clearing user');
          setUser(null);
        }
        
        // Always set loading to false after handling auth state change
        if (mounted) {
          console.log('🏁 Setting loading to false in auth state change');
          setLoading(false);
        }
      } catch (error) {
        console.error('💥 Error in auth state change handler:', error);
        if (mounted) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          setError(`Auth state change failed: ${errorMessage}`);
          setLoading(false);
        }
      }
    });

    initializeAuth();

    return () => {
      console.log('🧹 Cleaning up auth provider');
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (authUser: any) => {
    try {
      console.log('📋 Fetching profile for user:', authUser.id, authUser.email);
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('❌ Error fetching profile:', error);
        console.error('❌ Full profile error details:', JSON.stringify(error, null, 2));
        throw error;
      }

      // Create or update profile if needed
      if (!profile && authUser) {
        console.log('➕ No profile found, creating new profile...');
        
        const isAdmin = authUser.email === 'admin@gmail.com';
        const newProfile = {
          id: authUser.id,
          full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
          department: authUser.user_metadata?.department || 'General',
          role: isAdmin ? 'admin' : 'user'
        };

        console.log('➕ Creating profile with data:', newProfile);

        const { error: insertError } = await supabase
          .from('profiles')
          .insert([newProfile]);

        if (insertError) {
          console.error('❌ Error creating profile:', insertError);
          console.error('❌ Full insert error details:', JSON.stringify(insertError, null, 2));
          throw insertError;
        } else {
          console.log('✅ Profile created successfully');
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
        console.log('✅ Profile found, setting user data:', profile);
        // Profile exists, use it
        setUser({
          id: authUser.id,
          email: authUser.email ?? '',
          full_name: profile.full_name ?? authUser.email?.split('@')[0] ?? 'User',
          department: profile.department ?? 'General',
          role: profile.role ?? (authUser.email === 'admin@gmail.com' ? 'admin' : 'user'),
          team_id: profile.team_id ?? '',
        });
      } else {
        console.log('⚠️ Using fallback user object');
        // Fallback user object
        setUser({
          id: authUser.id,
          email: authUser.email ?? '',
          full_name: authUser.email?.split('@')[0] ?? 'User',
          department: 'General',
          role: authUser.email === 'admin@gmail.com' ? 'admin' : 'user',
        });
      }
      
      console.log('🎉 Profile fetch completed successfully');
    } catch (error) {
      console.error('💥 Error in fetchProfile:', error);
      console.error('💥 Full fetchProfile error details:', JSON.stringify(error, null, 2));
      // Set basic user info even if profile operations fail
      setUser({
        id: authUser.id,
        email: authUser.email ?? '',
        full_name: authUser.email?.split('@')[0] ?? 'User',
        department: 'General',
        role: authUser.email === 'admin@gmail.com' ? 'admin' : 'user',
      });
      
      throw error; // Re-throw to be caught by caller
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
      console.log('📝 Attempting sign up for:', email);
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, department, role: role || 'user' },
          emailRedirectTo: `${window.location.origin}/`
        }
      });
      
      if (error) {
        console.error('❌ Sign up error:', error);
        console.error('❌ Full sign up error details:', JSON.stringify(error, null, 2));
      }
      
      return { error };
    } catch (error) {
      console.error('❌ Sign up error:', error);
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('🔑 Attempting sign in for:', email);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        console.error('❌ Sign in error:', error);
        console.error('❌ Full sign in error details:', JSON.stringify(error, null, 2));
      }
      
      return { error };
    } catch (error) {
      console.error('❌ Sign in error:', error);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      console.log('🚪 Attempting sign out');
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('❌ Error signing out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, signUp, signIn, signOut }}>
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

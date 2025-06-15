
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
    // Setup Supabase auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchProfile(session.user);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    // Initial fetch
    supabase.auth.getSession().then(({ data }) => {
      const session = data.session;
      if (session?.user) {
        fetchProfile(session.user);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Pass the user record from auth (for email) and combine with profile
  const fetchProfile = async (authUser: any) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle();

    if (data) {
      setUser({
        id: authUser.id,
        email: authUser.email ?? '',
        full_name: data.full_name ?? '',
        department: data.department ?? '',
        role: data.role ?? '',
        team_id: data.team_id ?? '',
      });
    } else {
      setUser({
        id: authUser.id,
        email: authUser.email ?? '',
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
    let { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, department, role: role || 'user' },
        emailRedirectTo: `${window.location.origin}/`
      }
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    let { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
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


import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useRole = () => {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isProjectAdmin, setIsProjectAdmin] = useState(false);
  const [userTeamId, setUserTeamId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchUserRole();
    } else {
      setUserRole(null);
      setIsAdmin(false);
      setIsProjectAdmin(false);
      setUserTeamId(null);
      setLoading(false);
    }
  }, [user]);

  const fetchUserRole = async () => {
    try {
      // Fetch user role and team info
      const [roleResult, profileResult] = await Promise.all([
        supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user?.id)
          .maybeSingle(),
        supabase
          .from('profiles')
          .select('team_id')
          .eq('id', user?.id)
          .maybeSingle()
      ]);

      if (roleResult.error && roleResult.error.code !== 'PGRST116') {
        console.error('Error fetching user role:', roleResult.error);
        setUserRole('user');
        setIsAdmin(false);
        setIsProjectAdmin(false);
      } else if (roleResult.data) {
        setUserRole(roleResult.data.role);
        setIsAdmin(roleResult.data.role === 'admin');
        setIsProjectAdmin(roleResult.data.role === 'project_admin' || roleResult.data.role === 'admin');
      } else {
        setUserRole('user');
        setIsAdmin(false);
        setIsProjectAdmin(false);
      }

      if (profileResult.error) {
        console.error('Error fetching user profile:', profileResult.error);
        setUserTeamId(null);
      } else if (profileResult.data) {
        setUserTeamId(profileResult.data.team_id);
      }
    } catch (error) {
      console.error('Error in fetchUserRole:', error);
      setUserRole('user');
      setIsAdmin(false);
      setIsProjectAdmin(false);
      setUserTeamId(null);
    } finally {
      setLoading(false);
    }
  };

  const hasRole = (role: string) => {
    return userRole === role || isAdmin;
  };

  const canAccessProject = (projectTeamId?: string | null, projectManagerId?: string | null) => {
    if (isAdmin) return true;
    if (projectManagerId === user?.id) return true;
    if (userTeamId && projectTeamId === userTeamId) return true;
    return false;
  };

  return {
    userRole,
    isAdmin,
    isProjectAdmin,
    userTeamId,
    loading,
    hasRole,
    canAccessProject,
    refetch: fetchUserRole
  };
};

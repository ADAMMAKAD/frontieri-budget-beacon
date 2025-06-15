
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

export const useRole = () => {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isProjectAdmin, setIsProjectAdmin] = useState(false);
  const [userTeamId, setUserTeamId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) {
      return;
    }

    if (user) {
      // Check if user email is admin@gmail.com for admin access
      const isAdminEmail = user.email === 'admin@gmail.com';
      const role = isAdminEmail ? 'admin' : (user.role || 'user');
      
      setUserRole(role);
      setIsAdmin(isAdminEmail || user.role === 'admin');
      setIsProjectAdmin(isAdminEmail || user.role === 'project_admin' || user.role === 'admin');
      setUserTeamId(user.team_id || null);
      setLoading(false);
    } else {
      setUserRole(null);
      setIsAdmin(false);
      setIsProjectAdmin(false);
      setUserTeamId(null);
      setLoading(false);
    }
  }, [user, authLoading]);

  const hasRole = (role: string) => {
    return userRole === role || isAdmin;
  };

  const canAccessProject = (projectTeamId?: string | null, projectManagerId?: string | null) => {
    if (isAdmin) return true;
    if (projectManagerId === user?.id) return true;
    if (userTeamId && projectTeamId === userTeamId) return true;
    return false;
  };

  const canCreateProject = () => {
    return isAdmin;
  };

  const canManageUsers = () => {
    return isAdmin;
  };

  const canAssignProjectAdmin = () => {
    return isAdmin;
  };

  const canManageProjectBudget = (projectManagerId?: string | null) => {
    if (isAdmin) return true;
    if (isProjectAdmin && projectManagerId === user?.id) return true;
    return false;
  };

  const canApproveExpenses = (projectManagerId?: string | null) => {
    if (isAdmin) return true;
    if (isProjectAdmin && projectManagerId === user?.id) return true;
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
    canCreateProject,
    canManageUsers,
    canAssignProjectAdmin,
    canManageProjectBudget,
    canApproveExpenses,
    refetch: () => {}
  };
};


import { useAuth } from './useAuth';

export const useRole = () => {
  const { user, loading: authLoading } = useAuth();
  
  const isAdmin = user?.profile?.role === 'admin';
  const isManager = user?.profile?.role === 'manager' || isAdmin;
  const role = user?.profile?.role || 'user';
  const teamId = user?.profile?.team_id || null;
  
  // Additional role-based permissions
  const isProjectAdmin = isAdmin || user?.profile?.role === 'project_admin';
  
  // Return functions to maintain compatibility with existing code
  const canCreateProject = () => isAdmin || isManager;
  const canAccessProject = (projectTeamId?: string, projectManagerId?: string) => {
    if (isAdmin || isManager || user?.profile?.role === 'project_admin') return true;
    if (projectTeamId && teamId === projectTeamId) return true;
    if (projectManagerId && user?.id === projectManagerId) return true;
    return false;
  };
  const canManageUsers = () => isAdmin;
  
  return {
    isAdmin,
    isManager,
    role,
    teamId,
    user,
    loading: authLoading,
    isProjectAdmin,
    canCreateProject,
    canAccessProject,
    canManageUsers
  };
};


import { useAuth } from './useAuth';

export const useRole = () => {
  const { user } = useAuth();
  
  const isAdmin = user?.profile?.role === 'admin';
  const isManager = user?.profile?.role === 'manager' || isAdmin;
  const role = user?.profile?.role || 'user';
  const teamId = user?.profile?.team_id;
  
  return {
    isAdmin,
    isManager,
    role,
    teamId,
    user
  };
};

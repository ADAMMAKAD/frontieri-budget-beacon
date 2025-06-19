import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole, 
  allowedRoles 
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-orange-500" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to auth if not authenticated
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Check role-based access if specified
  if (requiredRole && user.role !== requiredRole) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-red-50 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-2xl">⚠️</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">
            You don't have permission to access this page.
          </p>
          <p className="text-sm text-gray-500">
            Required role: <span className="font-medium">{requiredRole}</span><br />
            Your role: <span className="font-medium">{user.role || 'user'}</span>
          </p>
        </div>
      </div>
    );
  }

  // Check allowed roles if specified
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = user.role || 'user';
    if (!allowedRoles.includes(userRole)) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-red-50 flex items-center justify-center">
          <div className="text-center p-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-red-600 text-2xl">⚠️</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-4">
              You don't have permission to access this page.
            </p>
            <p className="text-sm text-gray-500">
              Allowed roles: <span className="font-medium">{allowedRoles.join(', ')}</span><br />
              Your role: <span className="font-medium">{userRole}</span>
            </p>
          </div>
        </div>
      );
    }
  }

  // User is authenticated and authorized
  return <>{children}</>;
};

export default ProtectedRoute;
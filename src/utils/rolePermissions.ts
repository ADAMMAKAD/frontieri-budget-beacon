// Role-based access control utility

export type UserRole = 'admin' | 'manager' | 'analyst' | 'user';

export interface Permission {
  resource: string;
  action: 'read' | 'write' | 'delete' | 'admin';
}

// Define role hierarchy (higher roles inherit permissions from lower roles)
const ROLE_HIERARCHY: Record<UserRole, number> = {
  user: 1,
  analyst: 2,
  manager: 3,
  admin: 4,
};

// Define permissions for each role
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  user: [
    { resource: 'dashboard', action: 'read' },
    { resource: 'budget-planning', action: 'read' },
    { resource: 'budget-allocation', action: 'read' },
    { resource: 'budget-tracking', action: 'read' },
    { resource: 'milestones', action: 'read' },
    { resource: 'reporting', action: 'read' },
    { resource: 'expenses', action: 'read' },
    { resource: 'profile', action: 'write' },
    { resource: 'notifications', action: 'read' },
  ],
  analyst: [
    { resource: 'analytics', action: 'read' },
    { resource: 'realtime', action: 'read' },
    { resource: 'ai-optimizer', action: 'read' },
    { resource: 'reporting', action: 'write' },
    { resource: 'expenses', action: 'write' },
  ],
  manager: [
    { resource: 'business-units', action: 'write' },
    { resource: 'project-teams', action: 'write' },
    { resource: 'project-admin', action: 'write' },
    { resource: 'budget-versions', action: 'write' },
    { resource: 'approvals', action: 'write' },
    { resource: 'budget-planning', action: 'write' },
    { resource: 'budget-allocation', action: 'write' },
    { resource: 'milestones', action: 'write' },
  ],
  admin: [
    { resource: 'admin', action: 'admin' },
    { resource: 'user-management', action: 'admin' },
    { resource: 'user-registration', action: 'admin' },
    { resource: 'project-admin', action: 'admin' },
    { resource: 'audit', action: 'admin' },
    { resource: 'system-settings', action: 'admin' },
  ],
};

/**
 * Check if a user role has permission to access a resource with a specific action
 */
export function hasPermission(
  userRole: UserRole | string | undefined,
  resource: string,
  action: 'read' | 'write' | 'delete' | 'admin' = 'read'
): boolean {
  if (!userRole) return false;
  
  const role = userRole as UserRole;
  if (!ROLE_HIERARCHY[role]) return false;

  // Get all permissions for roles at or below the user's role level
  const userRoleLevel = ROLE_HIERARCHY[role];
  const allPermissions: Permission[] = [];

  // Collect permissions from all roles up to and including the user's role
  Object.entries(ROLE_HIERARCHY).forEach(([roleKey, level]) => {
    if (level <= userRoleLevel) {
      allPermissions.push(...ROLE_PERMISSIONS[roleKey as UserRole]);
    }
  });

  // Check if the user has the required permission
  return allPermissions.some(
    (permission) =>
      permission.resource === resource &&
      (permission.action === action || permission.action === 'admin')
  );
}

/**
 * Check if a user role can access admin features
 */
export function isAdmin(userRole: UserRole | string | undefined): boolean {
  return userRole === 'admin';
}

/**
 * Check if a user role can manage resources (manager or admin)
 */
export function canManage(userRole: UserRole | string | undefined): boolean {
  return userRole === 'admin' || userRole === 'manager';
}

/**
 * Check if a user role can analyze data (analyst, manager, or admin)
 */
export function canAnalyze(userRole: UserRole | string | undefined): boolean {
  return userRole === 'admin' || userRole === 'manager' || userRole === 'analyst';
}

/**
 * Get all accessible menu items for a user role
 */
export function getAccessibleMenuItems(userRole: UserRole | string | undefined) {
  const role = userRole as UserRole;
  if (!role) return [];

  const menuItems = [
    { id: 'overview', resource: 'dashboard' },
    { id: 'planning', resource: 'budget-planning' },
    { id: 'allocation', resource: 'budget-allocation' },
    { id: 'tracking', resource: 'budget-tracking' },
    { id: 'milestones', resource: 'milestones' },
    { id: 'reporting', resource: 'reporting' },
    { id: 'audit', resource: 'audit' },
    { id: 'expenses', resource: 'expenses' },
    { id: 'business-units', resource: 'business-units' },
    { id: 'project-teams', resource: 'project-teams' },
    { id: 'project-admin', resource: 'project-admin' },
    { id: 'budget-versions', resource: 'budget-versions' },
    { id: 'approvals', resource: 'approvals' },
    { id: 'notifications', resource: 'notifications' },
    { id: 'analytics', resource: 'analytics' },
    { id: 'realtime', resource: 'realtime' },
    { id: 'ai-optimizer', resource: 'ai-optimizer' },
    { id: 'admin', resource: 'admin' },
    { id: 'user-management', resource: 'user-management' },
    { id: 'user-registration', resource: 'user-registration' },
  ];

  return menuItems.filter((item) => hasPermission(role, item.resource));
}

/**
 * Get user role display name
 */
export function getRoleDisplayName(role: UserRole | string | undefined): string {
  switch (role) {
    case 'admin':
      return 'Administrator';
    case 'manager':
      return 'Manager';
    case 'analyst':
      return 'Analyst';
    case 'user':
      return 'User';
    default:
      return 'User';
  }
}

/**
 * Get role color for UI display
 */
export function getRoleColor(role: UserRole | string | undefined): string {
  switch (role) {
    case 'admin':
      return 'text-red-600 bg-red-50';
    case 'manager':
      return 'text-blue-600 bg-blue-50';
    case 'analyst':
      return 'text-purple-600 bg-purple-50';
    case 'user':
      return 'text-gray-600 bg-gray-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
}
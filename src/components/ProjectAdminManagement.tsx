import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UserPlus, Shield, Trash2, Eye, Settings } from 'lucide-react';

interface ProjectAdmin {
  id: string;
  email: string;
  full_name: string;
  department: string;
  role: string;
  assigned_at: string;
}

interface User {
  id: string;
  email: string;
  full_name: string;
  department: string;
}

interface Permission {
  name: string;
  description: string;
}

interface UserPermissions {
  isProjectAdmin: boolean;
  permissions: string[];
  isSystemAdmin: boolean;
}

interface ProjectAdminManagementProps {
  projectId: string;
  projectName: string;
}

export default function ProjectAdminManagement({ projectId, projectName }: ProjectAdminManagementProps) {
  const [admins, setAdmins] = useState<ProjectAdmin[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [userPermissions, setUserPermissions] = useState<UserPermissions | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, [projectId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchAdmins(),
        fetchUsers(),
        fetchPermissions(),
        fetchUserPermissions()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load project admin data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAdmins = async () => {
    try {
      const response = await apiClient.get(`/api/project-admin/${projectId}/admins`);
      setAdmins(response);
    } catch (error) {
      console.error('Error fetching admins:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await apiClient.get('/api/admin/users');
      setUsers(Array.isArray(response) ? response : response.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    }
  };

  const fetchPermissions = async () => {
    try {
      const response = await apiClient.get('/api/project-admin/permissions-list');
      setPermissions(response);
    } catch (error) {
      console.error('Error fetching permissions:', error);
    }
  };

  const fetchUserPermissions = async () => {
    try {
      const response = await apiClient.get(`/api/project-admin/permissions/${projectId}`);
      setUserPermissions(response);
    } catch (error) {
      console.error('Error fetching user permissions:', error);
    }
  };

  const handleAddAdmin = async () => {
    if (!selectedUserId) {
      toast({
        title: 'Error',
        description: 'Please select a user',
        variant: 'destructive'
      });
      return;
    }

    try {
      await apiClient.post(`/api/project-admin/${projectId}/admins`, {
        userId: selectedUserId
      });
      
      toast({
        title: 'Success',
        description: 'User assigned as project admin successfully'
      });
      
      setIsAddDialogOpen(false);
      setSelectedUserId('');
      await fetchAdmins();
    } catch (error) {
      console.error('Error adding admin:', error);
      toast({
        title: 'Error',
        description: 'Failed to assign project admin',
        variant: 'destructive'
      });
    }
  };

  const handleRemoveAdmin = async (userId: string) => {
    try {
      await apiClient.delete(`/api/project-admin/${projectId}/admins/${userId}`);
      
      toast({
        title: 'Success',
        description: 'Project admin role removed successfully'
      });
      
      await fetchAdmins();
    } catch (error) {
      console.error('Error removing admin:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove project admin',
        variant: 'destructive'
      });
    }
  };

  const getPermissionBadgeColor = (permission: string) => {
    const colorMap: { [key: string]: string } = {
      'approve_expenses': 'bg-green-100 text-green-800',
      'manage_budget': 'bg-blue-100 text-blue-800',
      'manage_team': 'bg-purple-100 text-purple-800',
      'view_analytics': 'bg-yellow-100 text-yellow-800',
      'manage_milestones': 'bg-orange-100 text-orange-800',
      'delete_expenses': 'bg-red-100 text-red-800',
      'export_data': 'bg-indigo-100 text-indigo-800',
      'manage_project_settings': 'bg-gray-100 text-gray-800'
    };
    return colorMap[permission] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* User Permissions Overview */}
      {userPermissions && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Your Permissions for {projectName}
            </CardTitle>
            <CardDescription>
              Your current permissions and role in this project
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="font-medium">Role:</span>
                <Badge variant={userPermissions.isProjectAdmin ? 'default' : 'secondary'}>
                  {userPermissions.isSystemAdmin ? 'System Admin' : 
                   userPermissions.isProjectAdmin ? 'Project Admin' : 'Team Member'}
                </Badge>
              </div>
              
              {userPermissions.permissions.length > 0 && (
                <div>
                  <span className="font-medium mb-2 block">Permissions:</span>
                  <div className="flex flex-wrap gap-2">
                    {userPermissions.permissions.map((permission) => (
                      <Badge 
                        key={permission} 
                        variant="outline"
                        className={getPermissionBadgeColor(permission)}
                      >
                        {permission.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Project Admins Management */}
      {(userPermissions?.isProjectAdmin || userPermissions?.isSystemAdmin) && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Project Admins
                </CardTitle>
                <CardDescription>
                  Manage users with administrative access to this project
                </CardDescription>
              </div>
              
              <div className="flex gap-2">
                <Dialog open={isPermissionsDialogOpen} onOpenChange={setIsPermissionsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      View Permissions
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Project Admin Permissions</DialogTitle>
                      <DialogDescription>
                        Available permissions for project administrators
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      {permissions.map((permission) => (
                        <div key={permission.name} className="border rounded-lg p-3">
                          <div className="font-medium">
                            {permission.name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            {permission.description}
                          </div>
                        </div>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
                
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Admin
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Project Admin</DialogTitle>
                      <DialogDescription>
                        Select a user to assign as project administrator
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a user" />
                        </SelectTrigger>
                        <SelectContent>
                          {users
                            .filter(user => !admins.some(admin => admin.id === user.id))
                            .map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.full_name} ({user.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleAddAdmin}>
                          Add Admin
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {admins.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No project admins assigned yet
              </div>
            ) : (
              <div className="space-y-4">
                {admins.map((admin) => (
                  <div key={admin.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{admin.full_name}</div>
                      <div className="text-sm text-gray-600">{admin.email}</div>
                      {admin.department && (
                        <div className="text-sm text-gray-500">{admin.department}</div>
                      )}
                      <div className="text-xs text-gray-400 mt-1">
                        Admin since: {new Date(admin.assigned_at).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant="default">Project Admin</Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveAdmin(admin.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
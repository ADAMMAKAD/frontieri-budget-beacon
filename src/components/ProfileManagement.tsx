
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { User, Mail, Building, Edit, Save, X } from 'lucide-react';

interface Profile {
  id: string;
  full_name: string;
  department: string;
  role: string;
}

const ProfileManagement = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Partial<Profile>>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();
  const { userRole, isAdmin, loading: roleLoading } = useRole();

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        const profileData: Profile = {
          id: data.id,
          full_name: data.full_name || '',
          department: data.department || '',
          role: userRole || 'user'
        };
        setProfile(profileData);
        setEditedProfile(profileData);
      } else if (user) {
        // No profile row, create new profile using user fields
        const newProfile: Profile = {
          id: user.id,
          full_name: user.full_name || '',
          department: user.department || '',
          role: userRole || 'user'
        };

        // Insert minimal profile
        const { error: insertError } = await supabase
          .from('profiles')
          .insert([newProfile]);

        if (insertError) throw insertError;

        setProfile(newProfile);
        setEditedProfile(newProfile);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update(editedProfile)
        .eq('id', user?.id);

      if (error) throw error;

      setProfile({ ...profile, ...editedProfile } as Profile);
      setIsEditing(false);

      toast({
        title: "Success",
        description: "Profile updated successfully"
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive"
      });
    }
  };

  if (loading || roleLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Profile Management</h2>
          <p className="text-gray-600 mt-1">Manage your personal information</p>
        </div>
        {!isEditing ? (
          <Button 
            onClick={() => setIsEditing(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600"
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit Profile
          </Button>
        ) : (
          <div className="space-x-2">
            <Button onClick={updateProfile} size="sm">
              <Save className="mr-2 h-4 w-4" />
              Save
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsEditing(false);
                setEditedProfile(profile || {});
              }}
              size="sm"
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Personal Information</span>
          </CardTitle>
          <CardDescription>Your account details and contact information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  value={user?.email || ''}
                  disabled
                  className="bg-gray-50"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={isEditing ? (editedProfile.full_name || '') : (profile?.full_name || '')}
                onChange={(e) => isEditing && setEditedProfile(prev => ({ ...prev, full_name: e.target.value }))}
                disabled={!isEditing}
                className={!isEditing ? "bg-gray-50" : ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <div className="flex items-center space-x-2">
                <Building className="h-4 w-4 text-gray-400" />
                <Input
                  id="department"
                  value={isEditing ? (editedProfile.department || '') : (profile?.department || '')}
                  onChange={(e) => isEditing && setEditedProfile(prev => ({ ...prev, department: e.target.value }))}
                  disabled={!isEditing}
                  className={!isEditing ? "bg-gray-50" : ""}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Input
                id="role"
                value={userRole || 'user'}
                disabled
                className="bg-gray-50"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Admin-only section */}
      {isAdmin && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-red-700">
              <User className="h-5 w-5" />
              <span>Administrator Information</span>
            </CardTitle>
            <CardDescription>Additional information for admin users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-red-800 font-medium">Administrator Access</p>
              <p className="text-red-600 text-sm mt-1">
                You have administrator privileges which grant access to user management, 
                system settings, and advanced features.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProfileManagement;

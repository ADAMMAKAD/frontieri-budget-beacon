
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const ProfileManagement = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: user?.profile?.full_name || '',
    department: user?.profile?.department || '',
    email: user?.email || ''
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.profile?.full_name || '',
        department: user.profile?.department || '',
        email: user.email || ''
      });
    }
  }, [user]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          department: formData.department,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user?.id);

      if (error) {
        toast({
          title: "Failed to update profile",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Profile updated",
          description: "Your profile has been updated successfully."
        });
        // Force refresh the page to update the user context
        window.location.reload();
      }
    } catch (error: any) {
      toast({
        title: "Failed to update profile",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setIsEditing(false);
    }
  };

  if (!user) {
    return (
      <div className="p-6">
        <p>Please log in to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Profile Management</h2>
          <Button
            onClick={() => setIsEditing(!isEditing)}
            variant={isEditing ? "outline" : "default"}
            className={!isEditing ? "bg-gradient-to-r from-orange-500 to-orange-600" : ""}
          >
            <Settings className="h-4 w-4 mr-2" />
            {isEditing ? "Cancel" : "Edit Profile"}
          </Button>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="full_name">Full Name</Label>
              {isEditing ? (
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                  placeholder="Enter your full name"
                />
              ) : (
                <p className="mt-1 text-sm text-gray-600">{user.profile?.full_name || 'Not provided'}</p>
              )}
            </div>

            <div>
              <Label htmlFor="department">Department</Label>
              {isEditing ? (
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                  placeholder="Enter your department"
                />
              ) : (
                <p className="mt-1 text-sm text-gray-600">{user.profile?.department || 'Not provided'}</p>
              )}
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <p className="mt-1 text-sm text-gray-600">{user.email}</p>
            </div>

            <div>
              <Label htmlFor="role">Role</Label>
              <p className="mt-1 text-sm text-gray-600">{user.profile?.role || 'User'}</p>
            </div>
          </div>

          {isEditing && (
            <div className="flex space-x-4">
              <Button
                onClick={handleSave}
                className="bg-gradient-to-r from-orange-500 to-orange-600"
                disabled={loading}
              >
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileManagement;

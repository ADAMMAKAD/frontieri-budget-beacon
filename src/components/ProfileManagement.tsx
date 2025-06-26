
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api';
import { User, Mail, Building, Shield, Edit3, Save, X, Sparkles, Camera, Award, Briefcase, Calendar, DollarSign } from 'lucide-react';

interface Profile {
  id: string;
  full_name: string;
  department: string;
  role: string;
}

interface BusinessUnit {
  id: string;
  name: string;
}

interface UserProject {
  id: string;
  name: string;
  description: string;
  total_budget: number;
  spent_budget: number;
  start_date: string;
  end_date: string;
  status: string;
  currency: string;
  created_at: string;
  team_role: string;
  joined_at: string;
  business_unit_name: string;
}

const ProfileManagement = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>([]);
  const [userProjects, setUserProjects] = useState<UserProject[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Partial<Profile>>({});
  const [loading, setLoading] = useState(true);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();


  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchBusinessUnits();
      fetchUserProjects();
    }
  }, [user]);

  const fetchUserProjects = async () => {
    try {
      setProjectsLoading(true);
      const data = await apiClient.getUserProjects(user?.id!);
      setUserProjects(data.projects || []);
    } catch (error) {
      console.error('Error fetching user projects:', error);
      toast({
        title: "Error",
        description: "Failed to load your projects",
        variant: "destructive"
      });
    } finally {
      setProjectsLoading(false);
    }
  };

  const fetchBusinessUnits = async () => {
    try {
      const data = await apiClient.getBusinessUnits();
      setBusinessUnits(data.business_units || []);
    } catch (error) {
      console.error('Error fetching business units:', error);
      // Fallback to hardcoded values if API fails
      setBusinessUnits([
        { id: '1', name: 'Elixone Tech' },
        { id: '2', name: 'Capra communication' },
        { id: '3', name: 'Vasta Talent' },
        { id: '4', name: 'WASH' }
      ]);
    }
  };

  const fetchProfile = async () => {
    try {
      const data = await apiClient.get(`/auth/profile/${user?.id}`);
      
      if (data) {
        const profileData: Profile = {
          id: data.id,
          full_name: data.full_name || '',
          department: data.department || '',
          role: 'user'
        };
        setProfile(profileData);
        setEditedProfile(profileData);
      } else if (user) {
        // Create new profile
        const newProfile: Profile = {
          id: user.id,
          full_name: user.full_name || '',
          department: user.department || '',
          role: 'user'
        };

        await apiClient.post('/auth/profile', newProfile);

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
      await apiClient.updateProfile(user?.id!, editedProfile);

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-yellow-100 text-yellow-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-orange-100 text-orange-800';
      case 'on-hold': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Card className="bg-white/80 backdrop-blur-sm border-orange-200 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 rounded-t-lg">
        <CardTitle className="flex items-center space-x-3 text-orange-700">
          <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg">
            <User className="h-5 w-5 text-white" />
          </div>
          <span>Profile Management</span>
        </CardTitle>
        <CardDescription className="text-orange-600/80">Manage your personal information and professional details</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        <div className="bg-gradient-to-br from-gray-50 to-orange-50/30 rounded-xl p-6 border border-orange-100">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                <User className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Personal Information</h3>
            </div>
            {!isEditing ? (
              <Button 
                onClick={() => setIsEditing(true)} 
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold px-4 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            ) : (
              <div className="space-x-2">
                <Button 
                  onClick={updateProfile} 
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold px-4 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                  size="sm"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
                <Button 
                  onClick={() => {
                    setIsEditing(false);
                    setEditedProfile(profile || {});
                  }} 
                  variant="outline" 
                  className="border-orange-200 hover:bg-orange-50 hover:border-orange-300 text-gray-700"
                  size="sm"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            )}
          </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-orange-600" />
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email Address</Label>
                </div>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="bg-gray-100/60 border-gray-200 h-12 text-gray-600"
                />
                <p className="text-xs text-gray-500">Email cannot be changed for security reasons</p>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-orange-600" />
                  <Label htmlFor="fullName" className="text-sm font-medium text-gray-700">Full Name</Label>
                </div>
                {isEditing ? (
                  <Input
                    id="fullName"
                    value={editedProfile.full_name || ''}
                    onChange={(e) => setEditedProfile(prev => ({ ...prev, full_name: e.target.value }))}
                    className="bg-white border-orange-200 focus:border-orange-400 focus:ring-orange-400/20 h-12"
                    placeholder="Enter your full name"
                  />
                ) : (
                  <Input
                    id="fullName"
                    value={profile?.full_name || ''}
                    disabled
                    className="bg-gray-100/60 border-gray-200 h-12 text-gray-600"
                  />
                )}
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Building className="h-4 w-4 text-orange-600" />
                  <Label htmlFor="department" className="text-sm font-medium text-gray-700">Business Unit</Label>
                </div>
                {isEditing ? (
                  <Select
                    value={editedProfile.department || ''}
                    onValueChange={(value) => setEditedProfile(prev => ({ ...prev, department: value }))}
                  >
                    <SelectTrigger className="bg-white border-orange-200 focus:border-orange-400 focus:ring-orange-400/20 h-12">
                      <SelectValue placeholder="Select your business unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {businessUnits.map((unit) => (
                        <SelectItem key={unit.id} value={unit.name}>
                          🏢 {unit.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id="department"
                    value={profile?.department || ''}
                    disabled
                    className="bg-gray-100/60 border-gray-200 h-12 text-gray-600"
                  />
                )}
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-orange-600" />
                  <Label htmlFor="role" className="text-sm font-medium text-gray-700">Role & Permissions</Label>
                </div>
                <Input
                  id="role"
                  value={profile?.role || 'user'}
                  disabled
                  className="bg-gray-100/60 border-gray-200 h-12 text-gray-600"
                />
                <p className="text-xs text-gray-500">Role is managed by system administrators</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6 border border-orange-200 mt-6">
            <h4 className="font-semibold text-orange-700 mb-3 flex items-center space-x-2">
              <Sparkles className="h-4 w-4" />
              <span>Profile Insights</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-white/60 rounded-lg border border-orange-200">
                <div className="flex items-center space-x-2 mb-2">
                  <Award className="h-4 w-4 text-orange-600" />
                  <p className="text-sm font-medium text-gray-700">Profile Completion</p>
                </div>
                <p className="text-xs text-gray-500">95% - Almost complete!</p>
              </div>
              <div className="p-4 bg-white/60 rounded-lg border border-orange-200">
                <div className="flex items-center space-x-2 mb-2">
                  <User className="h-4 w-4 text-orange-600" />
                  <p className="text-sm font-medium text-gray-700">Account Status</p>
                </div>
                <p className="text-xs text-gray-500">Active & Verified</p>
              </div>
              <div className="p-4 bg-white/60 rounded-lg border border-orange-200">
                <div className="flex items-center space-x-2 mb-2">
                  <Camera className="h-4 w-4 text-orange-600" />
                  <p className="text-sm font-medium text-gray-700">Profile Photo</p>
                </div>
                <p className="text-xs text-gray-500">Add photo for better recognition</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* My Projects Section */}
      <Card className="bg-white/80 backdrop-blur-sm border-orange-200 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 rounded-t-lg">
          <CardTitle className="flex items-center space-x-3 text-orange-700">
            <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg">
              <Briefcase className="h-5 w-5 text-white" />
            </div>
            <span>My Projects</span>
          </CardTitle>
          <CardDescription className="text-orange-600/80">
            Projects where you are a team member
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {projectsLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
            </div>
          ) : userProjects.length === 0 ? (
            <div className="text-center p-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-orange-100 to-red-100 rounded-full flex items-center justify-center">
                <Briefcase className="h-8 w-8 text-orange-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Projects Yet</h3>
              <p className="text-gray-600">You haven't been assigned to any projects yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {userProjects.map((project) => (
                <div key={project.id} className="bg-gradient-to-br from-gray-50 to-orange-50/30 rounded-xl p-4 border border-orange-100">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-900">{project.name}</h4>
                        <Badge className={`${getStatusColor(project.status)} text-xs font-medium px-2 py-1 rounded-full`}>
                          {project.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{project.description}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Building className="h-3 w-3" />
                          <span>{project.business_unit_name || 'No Business Unit'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Shield className="h-3 w-3" />
                          <span className="capitalize">{project.team_role}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>Joined {formatDate(project.joined_at)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="bg-white/60 rounded-lg p-3 border border-orange-200">
                      <div className="flex items-center gap-2 mb-1">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-gray-700">Total Budget</span>
                      </div>
                      <p className="text-lg font-semibold text-green-600">
                        {formatCurrency(project.total_budget, project.currency)}
                      </p>
                    </div>
                    <div className="bg-white/60 rounded-lg p-3 border border-orange-200">
                      <div className="flex items-center gap-2 mb-1">
                        <DollarSign className="h-4 w-4 text-red-600" />
                        <span className="text-sm font-medium text-gray-700">Spent</span>
                      </div>
                      <p className="text-lg font-semibold text-red-600">
                        {formatCurrency(project.spent_budget || 0, project.currency)}
                      </p>
                    </div>
                    <div className="bg-white/60 rounded-lg p-3 border border-orange-200">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-gray-700">Timeline</span>
                      </div>
                      <p className="text-sm text-blue-600">
                        {formatDate(project.start_date)} - {formatDate(project.end_date)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileManagement;

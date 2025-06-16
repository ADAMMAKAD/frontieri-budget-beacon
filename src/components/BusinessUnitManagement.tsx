
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Building, Plus, Edit, Trash2, Users } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface BusinessUnit {
  id: string;
  name: string;
  description: string | null;
  manager_id: string | null;
  created_at: string;
  updated_at: string;
}

const BusinessUnitManagement = () => {
  const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingUnit, setEditingUnit] = useState<BusinessUnit | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    manager_id: ''
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchBusinessUnits();
  }, []);

  const fetchBusinessUnits = async () => {
    try {
      const { data, error } = await supabase
        .from('business_units')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBusinessUnits(data || []);
    } catch (error) {
      console.error('Error fetching business units:', error);
      toast({
        title: "Error",
        description: "Failed to load business units",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingUnit) {
        const { error } = await supabase
          .from('business_units')
          .update({
            name: formData.name,
            description: formData.description,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingUnit.id);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Business unit updated successfully"
        });
      } else {
        const { error } = await supabase
          .from('business_units')
          .insert([{
            name: formData.name,
            description: formData.description,
            manager_id: user?.id
          }]);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Business unit created successfully"
        });
      }

      setFormData({ name: '', description: '', manager_id: '' });
      setIsEditing(false);
      setEditingUnit(null);
      fetchBusinessUnits();
    } catch (error) {
      console.error('Error saving business unit:', error);
      toast({
        title: "Error",
        description: "Failed to save business unit",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (unit: BusinessUnit) => {
    setEditingUnit(unit);
    setFormData({
      name: unit.name,
      description: unit.description || '',
      manager_id: unit.manager_id || ''
    });
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this business unit?')) return;

    try {
      const { error } = await supabase
        .from('business_units')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Business unit deleted successfully"
      });
      
      fetchBusinessUnits();
    } catch (error) {
      console.error('Error deleting business unit:', error);
      toast({
        title: "Error",
        description: "Failed to delete business unit",
        variant: "destructive"
      });
    }
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Business Unit Management</h2>
          <p className="text-gray-600 mt-1">Manage organizational business units</p>
        </div>
        <Button 
          onClick={() => setIsEditing(true)}
          className="bg-gradient-to-r from-blue-600 to-purple-600"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Business Unit
        </Button>
      </div>

      {isEditing && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building className="h-5 w-5" />
              <span>{editingUnit ? 'Edit Business Unit' : 'Create Business Unit'}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Business Unit Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="flex space-x-2">
                <Button type="submit">
                  {editingUnit ? 'Update' : 'Create'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsEditing(false);
                    setEditingUnit(null);
                    setFormData({ name: '', description: '', manager_id: '' });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Business Units</span>
          </CardTitle>
          <CardDescription>Manage your organization's business units</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {businessUnits.map((unit) => (
                <TableRow key={unit.id}>
                  <TableCell className="font-medium">{unit.name}</TableCell>
                  <TableCell>{unit.description || 'No description'}</TableCell>
                  <TableCell>{new Date(unit.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(unit)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(unit.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default BusinessUnitManagement;

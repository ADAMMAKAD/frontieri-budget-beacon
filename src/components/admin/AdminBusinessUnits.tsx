
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Building2 } from 'lucide-react';

interface BusinessUnit {
  id: string;
  name: string;
  description: string;
  manager_id: string;
  created_at: string;
  updated_at: string;
}

export const AdminBusinessUnits = () => {
  const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<BusinessUnit | null>(null);
  const [unitData, setUnitData] = useState({
    name: '',
    description: ''
  });
  const { toast } = useToast();

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

  const saveBusinessUnit = async () => {
    try {
      if (editingUnit) {
        const { error } = await supabase
          .from('business_units')
          .update(unitData)
          .eq('id', editingUnit.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Business unit updated successfully"
        });
      } else {
        const { error } = await supabase
          .from('business_units')
          .insert([unitData]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Business unit created successfully"
        });
      }

      setDialogOpen(false);
      resetForm();
      fetchBusinessUnits();
    } catch (error: any) {
      console.error('Error saving business unit:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save business unit",
        variant: "destructive"
      });
    }
  };

  const deleteBusinessUnit = async (id: string) => {
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
    } catch (error: any) {
      console.error('Error deleting business unit:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete business unit",
        variant: "destructive"
      });
    }
  };

  const openEditDialog = (unit: BusinessUnit) => {
    setEditingUnit(unit);
    setUnitData({
      name: unit.name,
      description: unit.description || ''
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingUnit(null);
    setUnitData({
      name: '',
      description: ''
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Business Unit Management</h2>
          <p className="text-gray-600">Manage organizational business units and departments</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Add Business Unit
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingUnit ? 'Edit Business Unit' : 'Create New Business Unit'}
              </DialogTitle>
              <DialogDescription>
                {editingUnit ? 'Update business unit details' : 'Add a new business unit to the organization'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={unitData.name}
                  onChange={(e) => setUnitData({ ...unitData, name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={unitData.description}
                  onChange={(e) => setUnitData({ ...unitData, description: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={saveBusinessUnit}>
                {editingUnit ? 'Update' : 'Create'} Business Unit
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Business Units</CardTitle>
          <CardDescription>
            View and manage all business units in the organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Created</TableHead>
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
                        onClick={() => openEditDialog(unit)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteBusinessUnit(unit.id)}
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

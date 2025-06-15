
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, TrendingUp, Calendar, DollarSign, CheckCircle, Clock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface Project {
  id: string;
  name: string;
}

interface BudgetCategory {
  id: string;
  name: string;
  allocated_amount: number;
  spent_amount: number;
}

interface Expense {
  id: string;
  description: string;
  amount: number;
  expense_date: string;
  status: string;
  category_id: string;
  budget_categories: { name: string };
}

const BudgetTracking = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  const [newExpense, setNewExpense] = useState({
    description: '',
    amount: '',
    expense_date: new Date().toISOString().split('T')[0],
    category_id: ''
  });
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchCategories(selectedProject);
      fetchExpenses(selectedProject);
    }
  }, [selectedProject]);

  const fetchProjects = async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('id, name')
      .order('name');

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch projects",
        variant: "destructive"
      });
    } else {
      setProjects(data || []);
      if (data && data.length > 0 && !selectedProject) {
        setSelectedProject(data[0].id);
      }
    }
  };

  const fetchCategories = async (projectId: string) => {
    const { data, error } = await supabase
      .from('budget_categories')
      .select('*')
      .eq('project_id', projectId)
      .order('name');

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch budget categories",
        variant: "destructive"
      });
    } else {
      setCategories(data || []);
    }
  };

  const fetchExpenses = async (projectId: string) => {
    const { data, error } = await supabase
      .from('expenses')
      .select(`
        *,
        budget_categories (name)
      `)
      .eq('project_id', projectId)
      .order('expense_date', { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch expenses",
        variant: "destructive"
      });
    } else {
      setExpenses(data || []);
    }
  };

  const createExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProject || !newExpense.category_id) {
      toast({
        title: "Error",
        description: "Please select a project and category",
        variant: "destructive"
      });
      return;
    }

    const { error } = await supabase
      .from('expenses')
      .insert([{
        project_id: selectedProject,
        category_id: newExpense.category_id,
        description: newExpense.description,
        amount: parseFloat(newExpense.amount),
        expense_date: newExpense.expense_date,
        submitted_by: user?.id
      }]);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create expense",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: "Expense recorded successfully"
      });
      setIsCreating(false);
      setNewExpense({
        description: '',
        amount: '',
        expense_date: new Date().toISOString().split('T')[0],
        category_id: ''
      });
      fetchExpenses(selectedProject);
      
      // Update category spent amount
      const category = categories.find(c => c.id === newExpense.category_id);
      if (category) {
        const newSpentAmount = category.spent_amount + parseFloat(newExpense.amount);
        await supabase
          .from('budget_categories')
          .update({ spent_amount: newSpentAmount })
          .eq('id', newExpense.category_id);
        
        fetchCategories(selectedProject);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const totalSpent = categories.reduce((sum, cat) => sum + cat.spent_amount, 0);
  const totalAllocated = categories.reduce((sum, cat) => sum + cat.allocated_amount, 0);

  // Filter projects to ensure no empty IDs
  const validProjects = projects.filter(project => project.id && project.id.trim() !== '');

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Budget Tracking</h2>
          <p className="text-gray-600 mt-1">Track expenses and monitor budget performance</p>
        </div>
        <Button 
          onClick={() => setIsCreating(true)}
          className="bg-gradient-to-r from-blue-600 to-purple-600"
          disabled={!selectedProject}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Expense
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Project</CardTitle>
          <CardDescription>Choose a project to track its expenses</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger>
              <SelectValue placeholder="Select a project" />
            </SelectTrigger>
            <SelectContent>
              {validProjects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedProject && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Allocated</p>
                  <p className="text-2xl font-bold">${totalAllocated.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Spent</p>
                  <p className="text-2xl font-bold">${totalSpent.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>Record New Expense</CardTitle>
            <CardDescription>Add a new expense to track against your budget</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={createExpense} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expenseDescription">Description</Label>
                  <Input
                    id="expenseDescription"
                    value={newExpense.description}
                    onChange={(e) => setNewExpense(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Expense description"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expenseAmount">Amount</Label>
                  <Input
                    id="expenseAmount"
                    type="number"
                    step="0.01"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expenseDate">Expense Date</Label>
                  <Input
                    id="expenseDate"
                    type="date"
                    value={newExpense.expense_date}
                    onChange={(e) => setNewExpense(prev => ({ ...prev, expense_date: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expenseCategory">Category</Label>
                  <Select value={newExpense.category_id} onValueChange={(value) => setNewExpense(prev => ({ ...prev, category_id: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name} (${category.allocated_amount.toLocaleString()} allocated)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button type="submit" className="bg-gradient-to-r from-blue-600 to-purple-600">
                  Record Expense
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsCreating(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {expenses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Expenses</CardTitle>
            <CardDescription>Latest expense records for the selected project</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {expenses.map((expense) => (
                <div key={expense.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium">{expense.description}</h4>
                      <Badge className={getStatusColor(expense.status)}>
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(expense.status)}
                          <span>{expense.status}</span>
                        </div>
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {expense.budget_categories?.name} • {new Date(expense.expense_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-lg">${expense.amount.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedProject && expenses.length === 0 && !isCreating && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No expenses recorded</h3>
          <p className="text-gray-600 mb-4">Start tracking expenses for this project</p>
          <Button 
            onClick={() => setIsCreating(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Expense
          </Button>
        </div>
      )}
    </div>
  );
};

export default BudgetTracking;

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { 
  Plus, 
  Search, 
  Filter, 
  DollarSign, 
  Receipt, 
  TrendingUp, 
  Calendar, 
  FileText, 
  CheckCircle, 
  Clock, 
  XCircle, 
  BarChart3,
  PieChart,
  Download,
  Upload,
  Eye,
  Edit,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  CreditCard,
  Target,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Building2
} from 'lucide-react';

interface Expense {
  id: string;
  description: string;
  amount: number;
  status: string;
  expense_date: string;
  project_id: string;
  category_id: string;
  created_at: string;
  updated_at: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  budget: number;
  status: string;
  start_date: string;
  end_date: string;
  currency: string;
}

interface BudgetCategory {
  id: string;
  name: string;
  description: string;
  budget_limit: number;
  color: string;
}

const ExpenseManagement = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [formData, setFormData] = useState({
    description: '',
    amount: 0,
    project_id: '',
    category_id: '',
    expense_date: new Date().toISOString().split('T')[0]
  });
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [userProjectAdminRoles, setUserProjectAdminRoles] = useState<string[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchData();
    fetchUserProjectAdminRoles();
  }, [user]);

  const fetchUserProjectAdminRoles = async () => {
    if (!user?.id) return;
    try {
      // Get projects where user has expense approval permission
      const response = await apiClient.getProjects();
      const allProjects = response.projects || [];
      const adminProjectIds = [];
      
      for (const project of allProjects) {
        try {
          const permissions = await apiClient.getUserProjectPermissions(project.id.toString());
          if (permissions.permissions.includes('approve_expenses') || permissions.isSystemAdmin) {
            adminProjectIds.push(project.id);
          }
        } catch (error) {
          // If we can't check permissions, skip this project
          console.warn(`Could not check permissions for project ${project.id}:`, error);
        }
      }
      
      setUserProjectAdminRoles(adminProjectIds);
    } catch (error) {
      console.error('Error fetching user project admin roles:', error);
      // Fallback to old method
      try {
        const response = await apiClient.get(`/api/project-teams?user_id=${user.id}`);
        const adminProjects = response.project_teams
          ?.filter((pt: any) => pt.role === 'admin')
          ?.map((pt: any) => pt.project_id) || [];
        setUserProjectAdminRoles(adminProjects);
      } catch (fallbackError) {
        console.error('Fallback method also failed:', fallbackError);
      }
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [expensesRes, projectsRes, categoriesRes] = await Promise.all([
        apiClient.get('/api/expenses'),
        apiClient.get('/api/projects'),
        apiClient.get('/api/budget-categories')
      ]);
      
      console.log('📊 Fetched expenses:', expensesRes);
      console.log('📋 Fetched projects:', projectsRes);
      console.log('🏷️ Fetched categories:', categoriesRes);
      
      // Extract data from API responses based on their actual structure
      setExpenses(expensesRes.expenses || expensesRes.data || []);
      setProjects(projectsRes.projects || projectsRes.data || []);
      setCategories(categoriesRes.data || categoriesRes.categories || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const submitExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.description || !formData.amount || !formData.project_id || !formData.category_id) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    try {
      if (isEditing && editingExpense) {
        // Update existing expense
        await apiClient.put(`/api/expenses/${editingExpense.id}`, {
          description: formData.description,
          amount: formData.amount,
          project_id: formData.project_id,
          category_id: formData.category_id,
          expense_date: formData.expense_date
        });
        
        toast({
          title: 'Success',
          description: 'Expense updated successfully'
        });
      } else {
        // Create new expense
        await apiClient.post('/api/expenses', {
          description: formData.description,
          amount: formData.amount,
          project_id: formData.project_id,
          category_id: formData.category_id,
          expense_date: formData.expense_date,
          status: 'pending'
        });
        
        toast({
          title: 'Success',
          description: 'Expense created successfully'
        });
      }
      
      await fetchData();
      resetForm();
    } catch (error) {
      console.error('Error saving expense:', error);
      toast({
        title: 'Error',
        description: `Failed to ${isEditing ? 'update' : 'create'} expense`,
        variant: 'destructive'
      });
    }
  };

  const resetForm = () => {
    setFormData({
      description: '',
      amount: 0,
      project_id: '',
      category_id: '',
      expense_date: new Date().toISOString().split('T')[0]
    });
    setIsCreating(false);
    setIsEditing(false);
    setEditingExpense(null);
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({
      description: expense.description,
      amount: expense.amount,
      project_id: expense.project_id,
      category_id: expense.category_id,
      expense_date: expense.expense_date.split('T')[0]
    });
    setIsEditing(true);
    setIsCreating(true);
  };

  const handleDelete = async (expenseId: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) {
      return;
    }

    try {
      await apiClient.delete(`/api/expenses/${expenseId}`);
      await fetchData();
      toast({
        title: 'Success',
        description: 'Expense deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete expense',
        variant: 'destructive'
      });
    }
  };

  const handleApproveExpense = async (expenseId: string, status: 'approved' | 'rejected') => {
    try {
      await apiClient.approveExpenseAsProjectAdmin(expenseId, status);
      await fetchData();
      toast({
        title: 'Success',
        description: `Expense ${status} successfully`
      });
    } catch (error) {
      console.error('Error updating expense status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update expense status',
        variant: 'destructive'
      });
    }
  };

  const canApproveExpense = (expense: Expense) => {
    return userProjectAdminRoles.includes(expense.project_id) && expense.status === 'pending';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredExpenses = (expenses || []).filter(expense => {
    const project = (projects || []).find(p => p.id === expense.project_id);
    const projectName = project?.name || '';
    
    const matchesSearch = 
      expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.amount.toString().includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || expense.status === statusFilter;
    const matchesProject = projectFilter === 'all' || expense.project_id === projectFilter;

    return matchesSearch && matchesStatus && matchesProject;
  });

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setProjectFilter('all');
  };

  const totalExpenses = (expenses || []).reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
  const pendingExpenses = (expenses || []).filter(exp => exp.status === 'pending').length;
  const approvedExpenses = (expenses || []).filter(exp => exp.status === 'approved').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="relative overflow-hidden bg-white rounded-2xl shadow-xl border border-slate-200/60">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-indigo-600/5"></div>
          <div className="relative p-8">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg">
                    <Wallet className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                      Expense Management
                    </h1>
                    <p className="text-slate-600 font-medium">Track and manage your project expenses</p>
                  </div>
                </div>
              </div>
              <Button 
                onClick={() => setIsCreating(true)}
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-3 rounded-xl font-semibold"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add Expense
              </Button>
            </div>
          </div>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-700 font-semibold text-sm uppercase tracking-wide">Total Expenses</p>
                  <p className="text-3xl font-bold text-blue-900">{formatCurrency(totalExpenses)}</p>
                </div>
                <div className="p-3 bg-blue-600 rounded-xl shadow-lg">
                  <DollarSign className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-700 font-semibold text-sm uppercase tracking-wide">Pending</p>
                  <p className="text-3xl font-bold text-yellow-900">{pendingExpenses}</p>
                </div>
                <div className="p-3 bg-yellow-600 rounded-xl shadow-lg">
                  <Clock className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-700 font-semibold text-sm uppercase tracking-wide">Approved</p>
                  <p className="text-3xl font-bold text-green-900">{approvedExpenses}</p>
                </div>
                <div className="p-3 bg-green-600 rounded-xl shadow-lg">
                  <CheckCircle className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="shadow-lg border-slate-200">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <Input
                    placeholder="Search expenses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-40 border-slate-300">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={projectFilter} onValueChange={setProjectFilter}>
                  <SelectTrigger className="w-full sm:w-48 border-slate-300">
                    <SelectValue placeholder="Project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Projects</SelectItem>
                    {(projects || []).map(project => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                variant="outline" 
                onClick={clearFilters}
                className="border-slate-300 hover:bg-slate-50"
              >
                <Filter className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Expenses Table */}
        <Card className="shadow-lg border-slate-200">
          <CardHeader className="bg-slate-50 border-b border-slate-200">
            <CardTitle className="text-slate-900 flex items-center">
              <Receipt className="h-5 w-5 mr-2 text-blue-600" />
              Expenses ({filteredExpenses.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="font-semibold text-slate-700">Description</TableHead>
                    <TableHead className="font-semibold text-slate-700">Amount</TableHead>
                    <TableHead className="font-semibold text-slate-700">Project</TableHead>
                    <TableHead className="font-semibold text-slate-700">Category</TableHead>
                    <TableHead className="font-semibold text-slate-700">Date</TableHead>
                    <TableHead className="font-semibold text-slate-700">Status</TableHead>
                    <TableHead className="font-semibold text-slate-700 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExpenses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12">
                        <div className="flex flex-col items-center space-y-3">
                          <Receipt className="h-12 w-12 text-slate-300" />
                          <p className="text-slate-500 font-medium">No expenses found</p>
                          <p className="text-slate-400 text-sm">Create your first expense to get started</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredExpenses.map((expense) => {
                      const project = (projects || []).find(p => p.id === expense.project_id);
                      const category = (categories || []).find(c => c.id === expense.category_id);
                      
                      return (
                        <TableRow key={expense.id} className="hover:bg-slate-50 transition-colors">
                          <TableCell className="font-medium text-slate-900">
                            {expense.description}
                          </TableCell>
                          <TableCell className="font-semibold text-slate-900">
                            {formatCurrency(expense.amount)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Building2 className="h-4 w-4 text-slate-400" />
                              <span className="text-slate-700">{project?.name || 'Unknown'}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: category?.color || '#6B7280' }}
                              ></div>
                              <span className="text-slate-700">{category?.name || 'Unknown'}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-600">
                            {new Date(expense.expense_date).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Badge className={`${getStatusColor(expense.status)} font-medium`}>
                              {expense.status.charAt(0).toUpperCase() + expense.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end space-x-2">
                              {canApproveExpense(expense) && (
                                <>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                    onClick={() => handleApproveExpense(expense.id, 'approved')}
                                    title="Approve expense"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => handleApproveExpense(expense.id, 'rejected')}
                                    title="Reject expense"
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                onClick={() => handleEdit(expense)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleDelete(expense.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Create/Edit Expense Modal */}
        {isCreating && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
                <CardTitle className="flex items-center">
                  {isEditing ? <Edit className="h-5 w-5 mr-2" /> : <Plus className="h-5 w-5 mr-2" />}
                  {isEditing ? 'Edit Expense' : 'Create New Expense'}
                </CardTitle>
                <CardDescription className="text-orange-100">
                  {isEditing ? 'Update expense details' : 'Add a new expense to track your project costs'}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={submitExpense} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <Label htmlFor="description" className="text-slate-700 font-medium">Description *</Label>
                      <Textarea
                        id="description"
                        placeholder="Enter expense description..."
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        className="mt-2 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                        rows={3}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="amount" className="text-slate-700 font-medium">Amount *</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.amount || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                        className="mt-2 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="expense_date" className="text-slate-700 font-medium">Date *</Label>
                      <Input
                        id="expense_date"
                        type="date"
                        value={formData.expense_date}
                        onChange={(e) => setFormData(prev => ({ ...prev, expense_date: e.target.value }))}
                        className="mt-2 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="project_id" className="text-slate-700 font-medium">Project *</Label>
                      <Select 
                        value={formData.project_id} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, project_id: value }))}
                      >
                        <SelectTrigger className="mt-2 border-slate-300">
                          <SelectValue placeholder="Select project" />
                        </SelectTrigger>
                        <SelectContent>
                          {(projects || []).map(project => (
                            <SelectItem key={project.id} value={project.id}>
                              {project.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="category_id" className="text-slate-700 font-medium">Category *</Label>
                      <Select 
                        value={formData.category_id} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
                      >
                        <SelectTrigger className="mt-2 border-slate-300">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {(categories || []).map(category => (
                            <SelectItem key={category.id} value={category.id}>
                              <div className="flex items-center space-x-2">
                                <div 
                                  className="w-3 h-3 rounded-full" 
                                  style={{ backgroundColor: category.color }}
                                ></div>
                                <span>{category.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-4 pt-6 border-t border-slate-200">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={resetForm}
                      className="border-slate-300 hover:bg-slate-50"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg"
                    >
                      {isEditing ? <Edit className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                      {isEditing ? 'Update Expense' : 'Create Expense'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpenseManagement;

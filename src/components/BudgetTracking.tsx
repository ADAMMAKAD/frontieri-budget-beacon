
import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, TrendingUp, Calendar, DollarSign, CheckCircle, Clock, Search, Filter, X, SortAsc, SortDesc, BarChart3, PieChart, Target, AlertTriangle, Zap, Eye, Download, RefreshCw, Activity, Grid3X3, List } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Project {
  id: string;
  name: string;
}

interface BudgetCategory {
  id: string;
  name: string;
  allocated_amount: number;
  total_spent: number;
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
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const { formatCurrency } = useCurrency();
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');
  const [amountFromFilter, setAmountFromFilter] = useState('');
  const [amountToFilter, setAmountToFilter] = useState('');
  const [sortBy, setSortBy] = useState('expense_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
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

  // Apply filters and search whenever expenses or filter criteria change
  useEffect(() => {
    applyFiltersAndSearch();
  }, [expenses, searchTerm, statusFilter, categoryFilter, dateFromFilter, dateToFilter, amountFromFilter, amountToFilter, sortBy, sortOrder]);

  const fetchProjects = async () => {
    try {
      const response = await apiClient.getProjects();
      const projects = response.projects || [];
      setProjects(projects);
      if (projects.length > 0 && !selectedProject) {
        setSelectedProject(projects[0].id);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch projects",
        variant: "destructive"
      });
    }
  };

  const fetchCategories = async (projectId: string) => {
    try {
      const response = await apiClient.getBudgetCategories(projectId);
      const categories = response.data || response.categories || response || [];
      setCategories(Array.isArray(categories) ? categories : []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch budget categories",
        variant: "destructive"
      });
    }
  };

  const fetchExpenses = async (projectId: string) => {
    try {
      const response = await apiClient.getExpenses({ project_id: projectId });
      setExpenses(response.expenses || response.data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch expenses",
        variant: "destructive"
      });
    }
  };

  const applyFiltersAndSearch = () => {
    let filtered = [...expenses];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(expense => 
        expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.budget_categories?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(expense => expense.status === statusFilter);
    }

    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(expense => expense.category_id === categoryFilter);
    }

    // Apply date range filter
    if (dateFromFilter) {
      filtered = filtered.filter(expense => expense.expense_date >= dateFromFilter);
    }
    if (dateToFilter) {
      filtered = filtered.filter(expense => expense.expense_date <= dateToFilter);
    }

    // Apply amount range filter
    if (amountFromFilter) {
      filtered = filtered.filter(expense => expense.amount >= parseFloat(amountFromFilter));
    }
    if (amountToFilter) {
      filtered = filtered.filter(expense => expense.amount <= parseFloat(amountToFilter));
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'description':
          aValue = a.description.toLowerCase();
          bValue = b.description.toLowerCase();
          break;
        case 'amount':
          aValue = a.amount;
          bValue = b.amount;
          break;
        case 'expense_date':
          aValue = new Date(a.expense_date);
          bValue = new Date(b.expense_date);
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'category':
          aValue = a.budget_categories?.name || '';
          bValue = b.budget_categories?.name || '';
          break;
        default:
          aValue = a.expense_date;
          bValue = b.expense_date;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredExpenses(filtered);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setCategoryFilter('all');
    setDateFromFilter('');
    setDateToFilter('');
    setAmountFromFilter('');
    setAmountToFilter('');
    setSortBy('expense_date');
    setSortOrder('desc');
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

    try {
      await apiClient.createExpense({
        project_id: selectedProject,
        category_id: newExpense.category_id,
        description: newExpense.description,
        amount: parseFloat(newExpense.amount),
        expense_date: newExpense.expense_date,
        submitted_by: user?.id
      });

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
        const newSpentAmount = category.total_spent + parseFloat(newExpense.amount);
        await apiClient.updateBudgetCategory(newExpense.category_id, {
          total_spent: newSpentAmount
        });
        fetchCategories(selectedProject);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create expense",
        variant: "destructive"
      });
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

  const totalSpent = categories.reduce((sum, cat) => sum + (parseFloat(cat.total_spent) || 0), 0);
  const totalAllocated = categories.reduce((sum, cat) => sum + (parseFloat(cat.allocated_amount) || 0), 0);

  // Filter projects to ensure no empty IDs
  const validProjects = projects.filter(project => project.id && project.id.trim() !== '');

  const hasActiveFilters = searchTerm || statusFilter !== 'all' || categoryFilter !== 'all' || 
    dateFromFilter || dateToFilter || amountFromFilter || amountToFilter;

  // Handle expense selection for modal
  const handleExpenseClick = (expense: Expense) => {
    setSelectedExpense(expense);
    setIsExpenseModalOpen(true);
  };

  // Grid View Component
  const GridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {filteredExpenses.map((expense, index) => (
        <Card 
          key={expense.id} 
          className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0 shadow-md bg-gradient-to-br from-white to-gray-50/50 overflow-hidden cursor-pointer"
          style={{ animationDelay: `${index * 100}ms` }}
          onClick={() => handleExpenseClick(expense)}
        >
          {/* Status indicator bar */}
          <div className={`h-1 w-full ${
            expense.status === 'approved' ? 'bg-gradient-to-r from-green-400 to-green-600' :
            expense.status === 'pending' ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
            'bg-gradient-to-r from-red-400 to-red-600'
          }`} />
          
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg font-bold text-gray-900 group-hover:text-orange-600 transition-colors line-clamp-2">
                  {expense.description}
                </CardTitle>
                <CardDescription className="mt-2 text-sm text-gray-600">
                  {expense.budget_categories?.name}
                </CardDescription>
              </div>
              <Badge className={`${getStatusColor(expense.status)} text-xs font-medium px-2 py-1 rounded-full`}>
                {expense.status}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-gray-900 group-hover:text-orange-700">
                  {formatCurrency(expense.amount)}
                </span>
                <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-orange-100 transition-colors">
                  <DollarSign className="h-4 w-4 text-gray-600 group-hover:text-orange-600" />
                </div>
              </div>
              
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Calendar className="h-3 w-3" />
                <span>{new Date(expense.expense_date).toLocaleDateString()}</span>
              </div>
              
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button size="sm" variant="ghost" className="flex-1">
                  <Eye className="h-3 w-3 mr-1" />
                  View
                </Button>
                <Button size="sm" variant="ghost">
                  <Download className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  // List View Component
  const ListView = () => (
    <div className="space-y-4">
      {filteredExpenses.map((expense, index) => (
        <div 
          key={expense.id} 
          className="group flex items-center justify-between p-6 border border-gray-200 rounded-xl hover:shadow-lg hover:border-orange-200 transition-all duration-300 bg-white hover:bg-gradient-to-r hover:from-orange-50/50 hover:to-transparent cursor-pointer"
          style={{ animationDelay: `${index * 50}ms` }}
          onClick={() => handleExpenseClick(expense)}
        >
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-orange-100 transition-colors">
                <DollarSign className="h-4 w-4 text-gray-600 group-hover:text-orange-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className="font-semibold text-gray-900 group-hover:text-orange-900">{expense.description}</h4>
                  <Badge className={`${getStatusColor(expense.status)} transition-all duration-200`}>
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(expense.status)}
                      <span className="capitalize">{expense.status}</span>
                    </div>
                  </Badge>
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                    <span>{expense.budget_categories?.name}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(expense.expense_date).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="text-right space-y-1">
            <p className="font-bold text-xl text-gray-900 group-hover:text-orange-700">{formatCurrency(expense.amount)}</p>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity">
                <Eye className="h-3 w-3" />
              </Button>
              <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity">
                <Download className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50/30 p-6 space-y-8">
      {/* Enhanced Header with Analytics */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
            Budget Tracking
          </h1>
          <p className="text-gray-600 text-lg">Advanced expense monitoring and budget analytics</p>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Activity className="h-4 w-4 text-orange-500" />
              <span>Real-time tracking</span>
            </div>
            <div className="flex items-center gap-1">
              <Zap className="h-4 w-4 text-orange-500" />
              <span>Live analytics</span>
            </div>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className={hasActiveFilters ? 'border-orange-500 text-orange-600' : ''}
          >
            <Filter className="mr-2 h-4 w-4" />
            Filters
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-2 px-1 py-0 text-xs">
                {filteredExpenses.length}
              </Badge>
            )}
          </Button>
          <Button 
            onClick={() => setIsCreating(true)}
            className="bg-gradient-to-r from-orange-600 to-red-600"
            disabled={!selectedProject}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Expense
          </Button>
        </div>
      </div>

      {/* Enhanced Project Selection */}
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 rounded-t-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Target className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <CardTitle className="text-xl text-gray-900">Project Selection</CardTitle>
              <CardDescription className="text-gray-600">Choose a project to access advanced budget tracking</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger className="h-12 border-gray-200 focus:border-orange-500 focus:ring-orange-500/20">
                <SelectValue placeholder="Select a project to begin tracking" />
              </SelectTrigger>
              <SelectContent>
                {validProjects.map((project) => (
                  <SelectItem key={project.id} value={project.id} className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      {project.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedProject && (
              <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-lg">
                <CheckCircle className="h-4 w-4" />
                <span>Project selected - tracking enabled</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Search and Filter Panel */}
      {showFilters && (
        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Search & Filters</CardTitle>
              <div className="flex space-x-2">
                {hasActiveFilters && (
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    <X className="mr-1 h-3 w-3" />
                    Clear All
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => setShowFilters(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by description or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filter Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Date From</Label>
                <Input
                  type="date"
                  value={dateFromFilter}
                  onChange={(e) => setDateFromFilter(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Date To</Label>
                <Input
                  type="date"
                  value={dateToFilter}
                  onChange={(e) => setDateToFilter(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Amount From</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Min amount"
                  value={amountFromFilter}
                  onChange={(e) => setAmountFromFilter(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Amount To</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Max amount"
                  value={amountToFilter}
                  onChange={(e) => setAmountToFilter(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Sort By</Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expense_date">Date</SelectItem>
                    <SelectItem value="description">Description</SelectItem>
                    <SelectItem value="amount">Amount</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                    <SelectItem value="category">Category</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Sort Order</Label>
                <Button
                  variant="outline"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="w-full justify-start"
                >
                  {sortOrder === 'asc' ? (
                    <><SortAsc className="mr-2 h-4 w-4" /> Ascending</>
                  ) : (
                    <><SortDesc className="mr-2 h-4 w-4" /> Descending</>
                  )}
                </Button>
              </div>
            </div>

            {/* Results Summary */}
            <div className="flex items-center justify-between pt-2 border-t">
              <p className="text-sm text-gray-600">
                Showing {filteredExpenses.length} of {expenses.length} expenses
              </p>
              {hasActiveFilters && (
                <Badge variant="secondary">
                  {Object.entries({
                    search: searchTerm,
                    status: statusFilter !== 'all' ? statusFilter : null,
                    category: categoryFilter !== 'all' ? 'category' : null,
                    dateRange: dateFromFilter || dateToFilter ? 'date range' : null,
                    amountRange: amountFromFilter || amountToFilter ? 'amount range' : null
                  }).filter(([_, value]) => value).length} active filters
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Analytics Dashboard */}
      {selectedProject && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200 hover:shadow-lg transition-all duration-300 group">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-orange-100 rounded-full group-hover:bg-orange-200 transition-colors">
                    <DollarSign className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-orange-600">Total Allocated</p>
                    <p className="text-2xl font-bold text-orange-700">{formatCurrency(totalAllocated)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <Target className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-orange-200">
                <p className="text-xs text-orange-600">Budget allocation across categories</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-red-50 to-pink-50 border-red-200 hover:shadow-lg transition-all duration-300 group">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-red-100 rounded-full group-hover:bg-red-200 transition-colors">
                    <TrendingUp className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-red-600">Total Spent</p>
                    <p className="text-2xl font-bold text-red-700">{formatCurrency(totalSpent)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <BarChart3 className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-red-200">
                <p className="text-xs text-red-600">Actual expenses recorded</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 hover:shadow-lg transition-all duration-300 group">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-green-100 rounded-full group-hover:bg-green-200 transition-colors">
                    <PieChart className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-600">Remaining</p>
                    <p className="text-2xl font-bold text-green-700">{formatCurrency(totalAllocated - totalSpent)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-green-200">
                <p className="text-xs text-green-600">Available budget balance</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200 hover:shadow-lg transition-all duration-300 group">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-purple-100 rounded-full group-hover:bg-purple-200 transition-colors">
                    <Activity className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-purple-600">Utilization</p>
                    <p className="text-2xl font-bold text-purple-700">{totalAllocated > 0 ? Math.round((totalSpent / totalAllocated) * 100) : 0}%</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    {totalSpent / totalAllocated > 0.8 ? 
                      <AlertTriangle className="h-6 w-6 text-purple-600" /> :
                      <TrendingUp className="h-6 w-6 text-purple-600" />
                    }
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-purple-200">
                <div className="w-full bg-purple-200 rounded-full h-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((totalSpent / totalAllocated) * 100, 100)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-purple-600 mt-2">Budget utilization rate</p>
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
                          {category.name} ({formatCurrency(category.allocated_amount)} allocated)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button type="submit" className="bg-gradient-to-r from-orange-600 to-red-600">
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

      {filteredExpenses.length > 0 && (
        <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-orange-50/50 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <CardTitle className="text-xl text-gray-900">Expense Analytics</CardTitle>
                  <CardDescription className="text-gray-600">
                    {hasActiveFilters ? 
                      `Filtered results (${filteredExpenses.length} of ${expenses.length})` : 
                      `All expense records for the selected project (${expenses.length})`
                    }
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* View Mode Toggle */}
                <div className="flex items-center gap-1 mr-2">
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className={viewMode === 'list' ? 'bg-orange-600 hover:bg-orange-700' : 'border-orange-200 text-orange-600 hover:bg-orange-50'}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className={viewMode === 'grid' ? 'bg-orange-600 hover:bg-orange-700' : 'border-orange-200 text-orange-600 hover:bg-orange-50'}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                </div>
                {!showFilters && hasActiveFilters && (
                  <Button variant="outline" size="sm" onClick={() => setShowFilters(true)} className="border-orange-200 text-orange-600 hover:bg-orange-50">
                    <Filter className="mr-1 h-3 w-3" />
                    Show Filters
                  </Button>
                )}
                <Button variant="outline" size="sm" className="border-orange-200 text-orange-600 hover:bg-orange-50">
                  <RefreshCw className="mr-1 h-3 w-3" />
                  Refresh
                </Button>
                <Button variant="outline" size="sm" className="border-orange-200 text-orange-600 hover:bg-orange-50">
                  <Download className="mr-1 h-3 w-3" />
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {viewMode === 'grid' ? <GridView /> : <ListView />}
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
            className="bg-gradient-to-r from-orange-600 to-red-600"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Expense
          </Button>
        </div>
      )}

      {selectedProject && expenses.length > 0 && filteredExpenses.length === 0 && hasActiveFilters && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No matching expenses found</h3>
          <p className="text-gray-600 mb-4">Try adjusting your search criteria or filters</p>
          <Button variant="outline" onClick={clearFilters}>
            <X className="mr-2 h-4 w-4" />
            Clear Filters
          </Button>
        </div>
      )}

      {/* Expense Detail Modal */}
      <Dialog open={isExpenseModalOpen} onOpenChange={setIsExpenseModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">
              Expense Details
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Complete information about this expense record
            </DialogDescription>
          </DialogHeader>
          
          {selectedExpense && (
            <div className="space-y-6">
              {/* Header Section */}
              <div className="flex items-start justify-between p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {selectedExpense.description}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(selectedExpense.expense_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                      <span>{selectedExpense.budget_categories?.name}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {formatCurrency(selectedExpense.amount)}
                  </div>
                  <Badge className={`${getStatusColor(selectedExpense.status)}`}>
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(selectedExpense.status)}
                      <span className="capitalize">{selectedExpense.status}</span>
                    </div>
                  </Badge>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                      Expense Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Expense ID:</span>
                      <span className="text-sm font-medium text-gray-900">{selectedExpense.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Amount:</span>
                      <span className="text-sm font-medium text-gray-900">{formatCurrency(selectedExpense.amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Date:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {new Date(selectedExpense.expense_date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Status:</span>
                      <Badge className={`${getStatusColor(selectedExpense.status)} text-xs`}>
                        {selectedExpense.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                      Budget Category
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Category:</span>
                      <span className="text-sm font-medium text-gray-900">{selectedExpense.budget_categories?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Category ID:</span>
                      <span className="text-sm font-medium text-gray-900">{selectedExpense.category_id}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button variant="outline" size="sm">
                  Edit
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsExpenseModalOpen(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BudgetTracking;

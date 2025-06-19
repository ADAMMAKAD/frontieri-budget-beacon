
import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Check, X, DollarSign, ChevronLeft, ChevronRight, Edit } from 'lucide-react';

interface Expense {
  id: string;
  description: string;
  amount: number;
  status: string;
  expense_date: string;
  created_at: string;
  submitted_by: string;
  project_id: string;
  projects?: {
    name: string;
  } | null;
  profiles?: {
    full_name: string;
  } | null;
}

export const AdminExpenses = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [editingExpense, setEditingExpense] = useState<string | null>(null);
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user) {
      fetchExpenses();
    }
  }, [user, authLoading]);

  const fetchExpenses = async () => {
    if (!user) {
      console.error('No user found');
      return;
    }

    try {
      // Get expenses with project and user details
      const data = await apiClient.request('/admin/expenses');
      setExpenses(data?.expenses || data?.data || data || []);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      toast({
        title: "Error",
        description: "Failed to load expenses",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateExpenseStatus = async (id: string, status: string) => {
    if (!user) return;

    try {
      await apiClient.request(`/expenses/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });

      toast({
        title: "Success",
        description: `Expense ${status} successfully`
      });

      fetchExpenses();
    } catch (error: any) {
      console.error('Error updating expense status:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update expense status",
        variant: "destructive"
      });
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredExpenses = Array.isArray(expenses) ? expenses.filter(expense => 
    statusFilter === 'all' || expense.status === statusFilter
  ) : [];

  // Pagination logic
  const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentExpenses = filteredExpenses.slice(startIndex, endIndex);

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Reset to first page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

  // Show loading if auth is still loading
  if (authLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  // Show error if no user
  if (!user) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-600">Please log in to access admin expenses.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Expense Management</h2>
          <p className="text-gray-600">Review and manage all expense submissions</p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${Array.isArray(expenses) ? expenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0).toLocaleString() : '0'}
            </div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Array.isArray(expenses) ? expenses.filter(exp => exp.status === 'pending').length : 0}
            </div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved This Month</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${Array.isArray(expenses) ? expenses
                .filter(exp => 
                  exp.status === 'approved' && 
                  new Date(exp.created_at).getMonth() === new Date().getMonth()
                )
                .reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0)
                .toLocaleString() : '0'}
            </div>
            <p className="text-xs text-muted-foreground">Current month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected Expenses</CardTitle>
            <X className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {Array.isArray(expenses) ? expenses.filter(exp => exp.status === 'rejected').length : 0}
            </div>
            <p className="text-xs text-muted-foreground">Total rejected</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Recent Expenses</CardTitle>
              <CardDescription>
                Review and approve expense submissions from all users (Showing {currentExpenses.length} of {filteredExpenses.length} expenses)
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Submitted By</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentExpenses.length > 0 ? (
                currentExpenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell className="font-medium">{expense.description}</TableCell>
                    <TableCell>${expense.amount.toLocaleString()}</TableCell>
                    <TableCell>{expense.submitted_by_name || 'Unknown User'}</TableCell>
                    <TableCell>{expense.project_name || 'No Project Assigned'}</TableCell>
                    <TableCell>
                      <Badge className={getStatusBadgeColor(expense.status)}>
                        {expense.status.charAt(0).toUpperCase() + expense.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(expense.expense_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {editingExpense === expense.id ? (
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              updateExpenseStatus(expense.id, 'approved');
                              setEditingExpense(null);
                            }}
                            className="text-green-600 hover:text-green-700"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              updateExpenseStatus(expense.id, 'rejected');
                              setEditingExpense(null);
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingExpense(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <div className="flex space-x-2">
                          {expense.status === 'pending' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateExpenseStatus(expense.id, 'approved')}
                                className="text-green-600 hover:text-green-700"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => updateExpenseStatus(expense.id, 'rejected')}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingExpense(expense.id)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No expenses found for the selected filter.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

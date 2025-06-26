import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Calendar, DollarSign, User, Building, Tag, Clock } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useCurrency } from '@/contexts/CurrencyContext';
import { toast } from 'sonner';

interface Expense {
  id: string;
  description: string;
  amount: number;
  expense_date: string;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  project_name: string;
  submitted_by_name: string;
  approved_by_name?: string;
  category_name: string;
  created_at: string;
  updated_at: string;
}

const ExpenseDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { formatCurrency } = useCurrency();
  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchExpense = async () => {
      if (!id) {
        setError('No expense ID provided');
        setLoading(false);
        return;
      }

      try {
        const response = await apiClient.getExpense(id);
        setExpense(response.expense);
      } catch (err: any) {
        console.error('Failed to fetch expense:', err);
        if (err.status === 404) {
          setError('Expense not found');
        } else if (err.status === 403) {
          setError('You are not authorized to view this expense');
        } else {
          setError('Failed to load expense details');
        }
        toast.error('Failed to load expense details');
      } finally {
        setLoading(false);
      }
    };

    fetchExpense();
  }, [id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'paid':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading expense details...</p>
        </div>
      </div>
    );
  }

  if (error || !expense) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4 text-gray-800">Error</h1>
          <p className="text-xl text-gray-600 mb-6">{error || 'Expense not found'}</p>
          <Button onClick={() => navigate('/')} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Expense Details</h1>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Primary Details */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl font-semibold text-gray-900">
                      {expense.description}
                    </CardTitle>
                    <p className="text-gray-600 mt-1">Expense ID: {expense.id}</p>
                  </div>
                  <Badge className={getStatusColor(expense.status)}>
                    {expense.status.charAt(0).toUpperCase() + expense.status.slice(1)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Amount */}
                <div className="flex items-center gap-3">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Amount</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(expense.amount)}
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Expense Date */}
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Expense Date</p>
                    <p className="text-lg text-gray-900">{formatDate(expense.expense_date)}</p>
                  </div>
                </div>

                <Separator />

                {/* Project */}
                <div className="flex items-center gap-3">
                  <Building className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Project</p>
                    <p className="text-lg text-gray-900">{expense.project_name}</p>
                  </div>
                </div>

                <Separator />

                {/* Category */}
                <div className="flex items-center gap-3">
                  <Tag className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Category</p>
                    <p className="text-lg text-gray-900">{expense.category_name}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* People */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <User className="h-5 w-5" />
                  People
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Submitted By</p>
                  <p className="text-gray-900">{expense.submitted_by_name}</p>
                </div>
                {expense.approved_by_name && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Approved By</p>
                    <p className="text-gray-900">{expense.approved_by_name}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Created</p>
                  <p className="text-gray-900">{formatDateTime(expense.created_at)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Last Updated</p>
                  <p className="text-gray-900">{formatDateTime(expense.updated_at)}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpenseDetail;
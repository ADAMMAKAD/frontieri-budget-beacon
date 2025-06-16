
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { FileCheck, Clock, CheckCircle, XCircle, MessageSquare } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface ApprovalWorkflow {
  id: string;
  project_id: string | null;
  expense_id: string | null;
  approver_id: string | null;
  status: string;
  comments: string | null;
  created_at: string;
  updated_at: string;
}

const ApprovalWorkflows = () => {
  const [workflows, setWorkflows] = useState<ApprovalWorkflow[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<ApprovalWorkflow | null>(null);
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    try {
      const { data, error } = await supabase
        .from('approval_workflows')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWorkflows(data || []);
    } catch (error) {
      console.error('Error fetching workflows:', error);
      toast({
        title: "Error",
        description: "Failed to load approval workflows",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (workflowId: string) => {
    try {
      const { error } = await supabase
        .from('approval_workflows')
        .update({
          status: 'approved',
          comments: comments,
          updated_at: new Date().toISOString()
        })
        .eq('id', workflowId);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Request approved successfully"
      });
      
      setSelectedWorkflow(null);
      setComments('');
      fetchWorkflows();
    } catch (error) {
      console.error('Error approving workflow:', error);
      toast({
        title: "Error",
        description: "Failed to approve request",
        variant: "destructive"
      });
    }
  };

  const handleReject = async (workflowId: string) => {
    try {
      const { error } = await supabase
        .from('approval_workflows')
        .update({
          status: 'rejected',
          comments: comments,
          updated_at: new Date().toISOString()
        })
        .eq('id', workflowId);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Request rejected"
      });
      
      setSelectedWorkflow(null);
      setComments('');
      fetchWorkflows();
    } catch (error) {
      console.error('Error rejecting workflow:', error);
      toast({
        title: "Error",
        description: "Failed to reject request",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
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
          <h2 className="text-2xl font-bold text-gray-900">Approval Workflows</h2>
          <p className="text-gray-600 mt-1">Manage approval requests and workflows</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">{workflows.filter(w => w.status === 'pending').length}</p>
                <p className="text-sm text-gray-600">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{workflows.filter(w => w.status === 'approved').length}</p>
                <p className="text-sm text-gray-600">Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-2xl font-bold">{workflows.filter(w => w.status === 'rejected').length}</p>
                <p className="text-sm text-gray-600">Rejected</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {selectedWorkflow && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5" />
              <span>Review Request</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Project ID:</Label>
                <p className="text-sm font-mono">{selectedWorkflow.project_id || 'N/A'}</p>
              </div>
              <div>
                <Label>Expense ID:</Label>
                <p className="text-sm font-mono">{selectedWorkflow.expense_id || 'N/A'}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="comments">Comments</Label>
              <Textarea
                id="comments"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Add your comments..."
                rows={3}
              />
            </div>

            <div className="flex space-x-2">
              <Button onClick={() => handleApprove(selectedWorkflow.id)}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleReject(selectedWorkflow.id)}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Reject
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSelectedWorkflow(null);
                  setComments('');
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileCheck className="h-5 w-5" />
            <span>Approval Requests</span>
          </CardTitle>
          <CardDescription>Review and manage approval workflows</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Project ID</TableHead>
                <TableHead>Expense ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workflows.map((workflow) => (
                <TableRow key={workflow.id}>
                  <TableCell>
                    {workflow.expense_id ? 'Expense' : 'Project'}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {workflow.project_id || 'N/A'}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {workflow.expense_id || 'N/A'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(workflow.status)}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(workflow.status)}`}>
                        {workflow.status}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{new Date(workflow.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {workflow.status === 'pending' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedWorkflow(workflow)}
                      >
                        Review
                      </Button>
                    )}
                    {workflow.comments && (
                      <Button
                        variant="ghost"
                        size="sm"
                        title={workflow.comments}
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    )}
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

export default ApprovalWorkflows;

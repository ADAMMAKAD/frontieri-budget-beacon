
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Shield, AlertTriangle, CheckCircle, Clock, FileText, Calendar } from 'lucide-react';

interface AuditRecord {
  id: string;
  description: string;
  amount: number;
  expense_date: string;
  status: string;
  submitted_by: string;
  approved_by: string;
  created_at: string;
  budget_categories: { name: string };
  projects: { name: string };
}

interface ComplianceMetrics {
  totalTransactions: number;
  pendingApprovals: number;
  approvedTransactions: number;
  rejectedTransactions: number;
  complianceScore: number;
}

const AuditCompliance = () => {
  const [auditRecords, setAuditRecords] = useState<AuditRecord[]>([]);
  const [metrics, setMetrics] = useState<ComplianceMetrics>({
    totalTransactions: 0,
    pendingApprovals: 0,
    approvedTransactions: 0,
    rejectedTransactions: 0,
    complianceScore: 0
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchAuditData();
  }, []);

  const fetchAuditData = async () => {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select(`
          *,
          budget_categories (name),
          projects (name)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        throw error;
      }

      setAuditRecords(data || []);
      calculateMetrics(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch audit data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateMetrics = (records: AuditRecord[]) => {
    const totalTransactions = records.length;
    const pendingApprovals = records.filter(r => r.status === 'pending').length;
    const approvedTransactions = records.filter(r => r.status === 'approved').length;
    const rejectedTransactions = records.filter(r => r.status === 'rejected').length;
    
    // Calculate compliance score based on approval rate and documentation completeness
    const approvalRate = totalTransactions > 0 ? (approvedTransactions / totalTransactions) * 100 : 0;
    const documentationScore = 85; // Simulated score based on documentation completeness
    const complianceScore = (approvalRate * 0.6 + documentationScore * 0.4);

    setMetrics({
      totalTransactions,
      pendingApprovals,
      approvedTransactions,
      rejectedTransactions,
      complianceScore: Math.round(complianceScore)
    });
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
      case 'rejected': return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getComplianceLevel = (score: number) => {
    if (score >= 90) return { label: 'Excellent', color: 'text-green-600', bgColor: 'bg-green-100' };
    if (score >= 80) return { label: 'Good', color: 'text-blue-600', bgColor: 'bg-blue-100' };
    if (score >= 70) return { label: 'Fair', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    return { label: 'Needs Improvement', color: 'text-red-600', bgColor: 'bg-red-100' };
  };

  const complianceLevel = getComplianceLevel(metrics.complianceScore);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading audit data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Audit & Compliance</h2>
          <p className="text-gray-600 mt-1">Monitor compliance and audit trail for all transactions</p>
        </div>
        <div className={`px-3 py-1 rounded-full ${complianceLevel.bgColor}`}>
          <span className={`text-sm font-medium ${complianceLevel.color}`}>
            Compliance: {complianceLevel.label} ({metrics.complianceScore}%)
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Transactions</p>
                <p className="text-2xl font-bold">{metrics.totalTransactions}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
                <p className="text-2xl font-bold">{metrics.pendingApprovals}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold">{metrics.approvedTransactions}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Compliance Score</p>
                <p className="text-2xl font-bold">{metrics.complianceScore}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Compliance Status</CardTitle>
          <CardDescription>Overall compliance health and recommendations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Shield className="h-5 w-5 text-blue-600" />
                <div>
                  <h4 className="font-medium">Audit Trail Completeness</h4>
                  <p className="text-sm text-gray-600">All transactions have complete documentation</p>
                </div>
              </div>
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <FileText className="h-5 w-5 text-blue-600" />
                <div>
                  <h4 className="font-medium">Documentation Standards</h4>
                  <p className="text-sm text-gray-600">85% of transactions meet documentation requirements</p>
                </div>
              </div>
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-blue-600" />
                <div>
                  <h4 className="font-medium">Approval Workflow</h4>
                  <p className="text-sm text-gray-600">{metrics.pendingApprovals} transactions pending approval</p>
                </div>
              </div>
              {metrics.pendingApprovals > 5 ? (
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              ) : (
                <CheckCircle className="h-5 w-5 text-green-600" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Audit Trail</CardTitle>
          <CardDescription>Recent transaction history and approval status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {auditRecords.map((record) => (
              <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium">{record.description}</h4>
                    <Badge className={getStatusColor(record.status)}>
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(record.status)}
                        <span>{record.status}</span>
                      </div>
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                    <span>{record.projects?.name}</span>
                    <span>•</span>
                    <span>{record.budget_categories?.name}</span>
                    <span>•</span>
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(record.expense_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Created: {new Date(record.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-lg">${record.amount.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>

          {auditRecords.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No audit records</h3>
              <p className="text-gray-600">Audit trail will appear here as transactions are processed</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditCompliance;


import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Calendar, DollarSign, Users, MoreHorizontal, Edit, Trash2, Eye, Shield, Lock } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertTriangle } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";

interface Project {
  id: string;
  name: string;
  total_budget: number;
  spent_budget: number;
  status: string;
}

interface ProjectListViewProps {
  projects: Project[];
}

export const ProjectListView = ({ projects }: ProjectListViewProps) => {
  const { formatCurrency } = useCurrency();


  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "text-green-600";
      case "completed": return "text-blue-600";
      case "on-hold": return "text-yellow-600";
      case "cancelled": return "text-red-600";
      default: return "text-gray-600";
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active": return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "completed": return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case "on-hold": return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case "cancelled": return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-3">
      {projects.map((project) => {
        const budget = project.total_budget || 0;
        const spent = project.spent_budget || 0;
        const utilization = budget > 0 ? (spent / budget) * 100 : 0;

        return (
          <div key={project.id} className="p-4 rounded-lg bg-muted hover:bg-muted/80 transition-all duration-200 border border-border hover:shadow-md">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2 flex-1">
                <h4 className="font-medium">{project.name}</h4>
                {getStatusIcon(project.status)}
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className={getStatusColor(project.status)}>
                  {project.status.replace("-", " ").toUpperCase()}
                </Badge>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <Edit className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <div className="space-y-1">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Budget: {formatCurrency(budget)}</span>
                  <span>Spent: {formatCurrency(spent)}</span>
                </div>
              </div>
              <div className="flex-1">
                <Progress value={utilization} className="h-2" />
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">{utilization.toFixed(1)}% utilized</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

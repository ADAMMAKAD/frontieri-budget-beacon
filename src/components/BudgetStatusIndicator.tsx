
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { useCurrency } from '@/contexts/CurrencyContext';

interface BudgetStatusIndicatorProps {
  totalBudget: number;
  spentBudget: number;
  startDate?: string;
  endDate?: string;
  thresholds?: {
    warning: number; // percentage (default 80)
    danger: number;  // percentage (default 100)
  };
  showPercentage?: boolean;
}

export const BudgetStatusIndicator: React.FC<BudgetStatusIndicatorProps> = ({
  totalBudget,
  spentBudget,
  startDate,
  endDate,
  thresholds = { warning: 80, danger: 100 },
  showPercentage = true
}) => {
  const { formatCurrency } = useCurrency();

  const getUtilizationPercentage = () => {
    if (totalBudget <= 0) return 0;
    return (spentBudget / totalBudget) * 100;
  };

  const getTimeProgress = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();
    const total = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
    return Math.max(0, Math.min(100, (elapsed / total) * 100));
  };

  const getBudgetStatus = () => {
    const utilization = getUtilizationPercentage();
    const timeProgress = getTimeProgress();
    
    // If we have timeline data, consider time vs budget burn rate
    if (startDate && endDate && timeProgress > 0) {
      const expectedSpend = (timeProgress / 100) * totalBudget;
      const variance = spentBudget - expectedSpend;
      
      if (utilization >= thresholds.danger) {
        return { status: 'danger', color: 'bg-red-100 text-red-800', label: 'Over Budget' };
      } else if (utilization >= thresholds.warning || variance > totalBudget * 0.1) {
        return { status: 'warning', color: 'bg-yellow-100 text-yellow-800', label: 'At Risk' };
      } else {
        return { status: 'safe', color: 'bg-green-100 text-green-800', label: 'On Track' };
      }
    } else {
      // Simple threshold-based status
      if (utilization >= thresholds.danger) {
        return { status: 'danger', color: 'bg-red-100 text-red-800', label: 'Over Budget' };
      } else if (utilization >= thresholds.warning) {
        return { status: 'warning', color: 'bg-yellow-100 text-yellow-800', label: 'Warning' };
      } else {
        return { status: 'safe', color: 'bg-green-100 text-green-800', label: 'Good' };
      }
    }
  };

  const budgetStatus = getBudgetStatus();
  const utilization = getUtilizationPercentage();

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">
          Spent: {formatCurrency(spentBudget)} of {formatCurrency(totalBudget)}
        </span>
        <Badge className={budgetStatus.color}>
          {budgetStatus.label}
        </Badge>
      </div>
      {showPercentage && (
        <div className="text-xs text-muted-foreground">
          {utilization.toFixed(1)}% of budget utilized
          {startDate && endDate && (
            <span className="ml-2">
              • {getTimeProgress().toFixed(1)}% of timeline elapsed
            </span>
          )}
        </div>
      )}
    </div>
  );
};

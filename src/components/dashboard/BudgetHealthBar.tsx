import { useNavigate } from 'react-router-dom';
import { ArrowRight, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Skeleton } from '../ui/skeleton';
import { formatCurrency } from '../../lib/format';
import type { BudgetWithProgress } from '../../types';
import { cn } from '../../lib/utils';

interface BudgetHealthBarProps {
  budgets: BudgetWithProgress[];
  isLoading?: boolean;
}

export function BudgetHealthBar({ budgets, isLoading }: BudgetHealthBarProps) {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Budget Health</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (budgets.length === 0) {
    return (
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Budget Health</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => navigate('/budgets')}>
            Set Up
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm text-center py-4">
            No budgets set. Create budgets to track your spending.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Budget Health</CardTitle>
        <Button variant="ghost" size="sm" onClick={() => navigate('/budgets')}>
          Manage
          <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {budgets.slice(0, 4).map((budget) => {
            const isOverBudget = budget.is_over_budget;
            const isWarning = budget.percentage >= 0.8 && !isOverBudget;

            return (
              <div key={budget.id}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    {isOverBudget ? (
                      <AlertCircle className="h-4 w-4 text-destructive" />
                    ) : isWarning ? (
                      <AlertTriangle className="h-4 w-4 text-warning" />
                    ) : (
                      <CheckCircle className="h-4 w-4 text-success" />
                    )}
                    <span className="text-sm font-medium">{budget.category_name}</span>
                  </div>
                  <span className={cn(
                    'text-sm',
                    isOverBudget && 'text-destructive',
                    isWarning && 'text-warning'
                  )}>
                    {formatCurrency(budget.spent)} / {formatCurrency(budget.amount)}
                  </span>
                </div>
                <Progress
                  value={Math.min(budget.percentage * 100, 100)}
                  className="h-2"
                  indicatorClassName={cn(
                    isOverBudget && 'bg-destructive',
                    isWarning && 'bg-warning'
                  )}
                />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

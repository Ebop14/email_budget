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
      <Card className="animate-scale-in stagger-6">
        <CardHeader>
          <CardTitle>Budget Health</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-3 w-full rounded-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (budgets.length === 0) {
    return (
      <Card className="animate-scale-in stagger-6">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Budget Health</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => navigate('/budgets')} className="rounded-xl">
            Set Up
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
            No budgets set. Create budgets to track your spending.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="animate-scale-in stagger-6">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Budget Health</CardTitle>
        <Button variant="ghost" size="sm" onClick={() => navigate('/budgets')} className="rounded-xl">
          Manage
          <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-5">
          {budgets.slice(0, 4).map((budget) => {
            const isOverBudget = budget.is_over_budget;
            const isWarning = budget.percentage >= 0.8 && !isOverBudget;

            return (
              <div key={budget.id} className="group">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className={cn(
                      'h-7 w-7 rounded-lg flex items-center justify-center transition-colors',
                      isOverBudget && 'bg-destructive/10 group-hover:bg-destructive/15',
                      isWarning && 'bg-warning/10 group-hover:bg-warning/15',
                      !isOverBudget && !isWarning && 'bg-success/10 group-hover:bg-success/15'
                    )}>
                      {isOverBudget ? (
                        <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                      ) : isWarning ? (
                        <AlertTriangle className="h-3.5 w-3.5 text-warning" />
                      ) : (
                        <CheckCircle className="h-3.5 w-3.5 text-success" />
                      )}
                    </div>
                    <span className="text-sm font-semibold">{budget.category_name}</span>
                  </div>
                  <span className={cn(
                    'text-sm font-medium tabular-nums',
                    isOverBudget && 'text-destructive',
                    isWarning && 'text-warning'
                  )}>
                    {formatCurrency(budget.spent)} / {formatCurrency(budget.amount)}
                  </span>
                </div>
                <Progress
                  value={Math.min(budget.percentage * 100, 100)}
                  className="h-2.5"
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

import { Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { Button } from '../ui/button';
import { formatCurrency } from '../../lib/format';
import type { BudgetWithProgress } from '../../types';
import { cn } from '../../lib/utils';

interface BudgetProgressProps {
  budget: BudgetWithProgress;
  onDelete: (budgetId: string) => void;
}

export function BudgetProgress({ budget, onDelete }: BudgetProgressProps) {
  const percentageDisplay = Math.min(budget.percentage * 100, 100);
  const isOverBudget = budget.is_over_budget;
  const isWarning = budget.percentage >= 0.8 && !isOverBudget;

  return (
    <Card className={cn(
      isOverBudget && 'border-destructive',
      isWarning && 'border-warning'
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: budget.category_color }}
            />
            <CardTitle className="text-base">{budget.category_name}</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={() => onDelete(budget.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground capitalize">{budget.period}</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Spent</span>
            <span className={cn(
              'font-medium',
              isOverBudget && 'text-destructive',
              isWarning && 'text-warning'
            )}>
              {formatCurrency(budget.spent)} / {formatCurrency(budget.amount)}
            </span>
          </div>
          <Progress
            value={percentageDisplay}
            className="h-2"
            indicatorClassName={cn(
              isOverBudget && 'bg-destructive',
              isWarning && 'bg-warning'
            )}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>
              {isOverBudget
                ? `Over by ${formatCurrency(Math.abs(budget.remaining))}`
                : `${formatCurrency(budget.remaining)} remaining`}
            </span>
            <span>{Math.round(budget.percentage * 100)}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

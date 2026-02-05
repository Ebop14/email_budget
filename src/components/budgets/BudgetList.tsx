import { BudgetProgress } from './BudgetProgress';
import { Skeleton } from '../ui/skeleton';
import type { BudgetWithProgress } from '../../types';

interface BudgetListProps {
  budgets: BudgetWithProgress[];
  isLoading?: boolean;
  onDelete: (budgetId: string) => void;
}

export function BudgetList({ budgets, isLoading, onDelete }: BudgetListProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  if (budgets.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-12">
        <p>No budgets set yet.</p>
        <p className="text-sm mt-1">Create a budget to start tracking your spending.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {budgets.map((budget) => (
        <BudgetProgress key={budget.id} budget={budget} onDelete={onDelete} />
      ))}
    </div>
  );
}

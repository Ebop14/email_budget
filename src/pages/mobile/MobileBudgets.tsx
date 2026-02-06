import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { MobileHeader } from '../../components/mobile/MobileHeader';
import { BottomSheet } from '../../components/mobile/BottomSheet';
import { BudgetEditor } from '../../components/budgets/BudgetEditor';
import { Progress } from '../../components/ui/progress';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';
import { useBudgets } from '../../hooks/useBudgets';
import { useCategories } from '../../hooks/useCategories';
import { formatCurrency } from '../../lib/format';
import { cn } from '../../lib/utils';
import type { BudgetPeriod } from '../../types';

export function MobileBudgets() {
  const [isCreating, setIsCreating] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { budgets, isLoading, setBudget, deleteBudget } = useBudgets();
  const { categories } = useCategories();

  const existingCategoryIds = budgets.map((b) => b.category_id);

  const handleSave = async (categoryId: string, amount: number, period: BudgetPeriod) => {
    await setBudget(categoryId, amount, period);
    setIsCreating(false);
  };

  return (
    <>
      <MobileHeader
        title="Budgets"
        actions={
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsCreating(true)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        }
      />

      <div className="flex-1 overflow-auto mobile-scroll p-4">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        ) : budgets.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            <p>No budgets set yet.</p>
            <p className="text-sm mt-1">Tap + to create your first budget.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {budgets.map((budget) => {
              const isOverBudget = budget.is_over_budget;
              const isWarning = budget.percentage >= 0.8 && !isOverBudget;
              const isExpanded = expandedId === budget.id;

              return (
                <div
                  key={budget.id}
                  className={cn(
                    'bg-card rounded-xl border border-border p-4 transition-colors',
                    isOverBudget && 'border-destructive/50',
                    isWarning && 'border-warning/50'
                  )}
                  onClick={() => setExpandedId(isExpanded ? null : budget.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: budget.category_color }}
                      />
                      <span className="text-sm font-medium">{budget.category_name}</span>
                    </div>
                    <span className={cn(
                      'text-sm font-medium',
                      isOverBudget && 'text-destructive',
                      isWarning && 'text-warning'
                    )}>
                      {Math.round(budget.percentage * 100)}%
                    </span>
                  </div>

                  <Progress
                    value={Math.min(budget.percentage * 100, 100)}
                    className="h-3 mb-2"
                    indicatorClassName={cn(
                      isOverBudget && 'bg-destructive',
                      isWarning && 'bg-warning'
                    )}
                  />

                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>
                      {formatCurrency(budget.spent)} / {formatCurrency(budget.amount)}
                    </span>
                    <span className="capitalize">{budget.period}</span>
                  </div>

                  {/* Expanded actions */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {isOverBudget
                          ? `Over by ${formatCurrency(Math.abs(budget.remaining))}`
                          : `${formatCurrency(budget.remaining)} remaining`}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive h-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteBudget(budget.id);
                          setExpandedId(null);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                        Delete
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Budget Bottom Sheet */}
      <BottomSheet
        isOpen={isCreating}
        onClose={() => setIsCreating(false)}
        title="New Budget"
        snapPoints={[70]}
      >
        <div className="p-4">
          <BudgetEditor
            categories={categories}
            existingCategoryIds={existingCategoryIds}
            onSave={handleSave}
            onCancel={() => setIsCreating(false)}
          />
        </div>
      </BottomSheet>
    </>
  );
}

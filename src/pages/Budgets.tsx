import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Button } from '../components/ui/button';
import { BudgetList } from '../components/budgets/BudgetList';
import { BudgetEditor } from '../components/budgets/BudgetEditor';
import { useBudgets } from '../hooks/useBudgets';
import { useCategories } from '../hooks/useCategories';
import type { BudgetPeriod } from '../types';

export function Budgets() {
  const [isCreating, setIsCreating] = useState(false);
  const { budgets, isLoading, setBudget, deleteBudget } = useBudgets();
  const { categories } = useCategories();

  const existingCategoryIds = budgets.map((b) => b.category_id);

  const handleSave = async (categoryId: string, amount: number, period: BudgetPeriod) => {
    await setBudget(categoryId, amount, period);
  };

  return (
    <>
      <Header
        title="Budgets"
        description="Set and track your spending limits"
        actions={
          !isCreating && (
            <Button size="sm" onClick={() => setIsCreating(true)}>
              <Plus className="h-4 w-4 mr-1" />
              New Budget
            </Button>
          )
        }
      />
      <div className="flex-1 overflow-auto p-6">
        {isCreating && (
          <div className="mb-6 max-w-md">
            <BudgetEditor
              categories={categories}
              existingCategoryIds={existingCategoryIds}
              onSave={handleSave}
              onCancel={() => setIsCreating(false)}
            />
          </div>
        )}

        <BudgetList
          budgets={budgets}
          isLoading={isLoading}
          onDelete={deleteBudget}
        />
      </div>
    </>
  );
}

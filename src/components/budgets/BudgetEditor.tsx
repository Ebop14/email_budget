import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { CategoryPicker } from '../transactions/CategoryPicker';
import type { Category, BudgetPeriod } from '../../types';

interface BudgetEditorProps {
  categories: Category[];
  existingCategoryIds: string[];
  onSave: (categoryId: string, amount: number, period: BudgetPeriod) => Promise<void>;
  onCancel: () => void;
}

export function BudgetEditor({
  categories,
  existingCategoryIds,
  onSave,
  onCancel,
}: BudgetEditorProps) {
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [period, setPeriod] = useState<BudgetPeriod>('monthly');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Filter out categories that already have budgets
  const availableCategories = categories.filter(
    (c) => !existingCategoryIds.includes(c.id)
  );

  const handleSave = async () => {
    if (!categoryId) {
      setError('Please select a category');
      return;
    }

    const amountCents = Math.round(parseFloat(amount) * 100);
    if (isNaN(amountCents) || amountCents <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await onSave(categoryId, amountCents, period);
      onCancel();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save budget');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="border rounded-lg p-4 bg-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium">New Budget</h3>
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-2 text-sm bg-destructive/10 text-destructive rounded">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {/* Category */}
        <div>
          <label className="text-sm font-medium mb-1 block">Category</label>
          <CategoryPicker
            categories={availableCategories}
            value={categoryId}
            onChange={setCategoryId}
            placeholder="Select a category"
          />
          {availableCategories.length === 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              All categories already have budgets
            </p>
          )}
        </div>

        {/* Amount */}
        <div>
          <label className="text-sm font-medium mb-1 block">Budget Amount</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              $
            </span>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              min="0"
              step="0.01"
              className="pl-7"
            />
          </div>
        </div>

        {/* Period */}
        <div>
          <label className="text-sm font-medium mb-1 block">Period</label>
          <div className="flex gap-2">
            {(['weekly', 'monthly', 'yearly'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`flex-1 px-3 py-2 rounded-md text-sm font-medium capitalize transition-colors ${
                  period === p
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading || availableCategories.length === 0}
            className="flex-1"
          >
            {isLoading ? 'Saving...' : 'Create Budget'}
          </Button>
        </div>
      </div>
    </div>
  );
}

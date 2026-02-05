import { useState } from 'react';
import { MoreVertical, Trash2 } from 'lucide-react';
import { CategoryPicker } from './CategoryPicker';
import { Button } from '../ui/button';
import { formatCurrency } from '../../lib/format';
import type { TransactionWithCategory, Category } from '../../types';
import { cn } from '../../lib/utils';

interface TransactionRowProps {
  transaction: TransactionWithCategory;
  categories: Category[];
  onCategoryChange: (transactionId: string, categoryId: string | null) => void;
  onDelete?: (transactionId: string) => void;
}

export function TransactionRow({
  transaction,
  categories,
  onCategoryChange,
  onDelete,
}: TransactionRowProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  return (
    <div className="flex items-center gap-4 p-4 bg-card border rounded-lg hover:bg-accent/30 transition-colors">
      {/* Category Color Indicator */}
      <div
        className="w-1 h-12 rounded-full flex-shrink-0"
        style={{ backgroundColor: transaction.category_color || '#6b7280' }}
      />

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium truncate">{transaction.merchant}</p>
          <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
            {transaction.provider}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          {showCategoryPicker ? (
            <div className="w-48">
              <CategoryPicker
                categories={categories}
                value={transaction.category_id || undefined}
                onChange={(categoryId) => {
                  onCategoryChange(transaction.id, categoryId);
                  setShowCategoryPicker(false);
                }}
              />
            </div>
          ) : (
            <button
              onClick={() => setShowCategoryPicker(true)}
              className={cn(
                'text-sm flex items-center gap-1.5 hover:underline',
                transaction.category_name ? 'text-muted-foreground' : 'text-primary'
              )}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: transaction.category_color || '#6b7280' }}
              />
              {transaction.category_name || 'Uncategorized'}
            </button>
          )}
        </div>
      </div>

      {/* Amount */}
      <div className="text-right">
        <p className="font-medium">{formatCurrency(transaction.amount)}</p>
      </div>

      {/* Actions */}
      <div className="relative">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setShowMenu(!showMenu)}
        >
          <MoreVertical className="h-4 w-4" />
        </Button>

        {showMenu && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowMenu(false)}
            />
            <div className="absolute right-0 top-full mt-1 z-50 bg-popover border rounded-md shadow-md py-1 w-32">
              {onDelete && (
                <button
                  onClick={() => {
                    onDelete(transaction.id);
                    setShowMenu(false);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-destructive hover:bg-accent"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

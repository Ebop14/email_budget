import { TransactionRow } from './TransactionRow';
import { Skeleton } from '../ui/skeleton';
import type { TransactionWithCategory, Category } from '../../types';

interface TransactionListProps {
  transactions: TransactionWithCategory[];
  categories: Category[];
  isLoading?: boolean;
  onCategoryChange: (transactionId: string, categoryId: string | null) => void;
  onDelete?: (transactionId: string) => void;
}

export function TransactionList({
  transactions,
  categories,
  isLoading,
  onCategoryChange,
  onDelete,
}: TransactionListProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-12">
        <p>No transactions found.</p>
        <p className="text-sm mt-1">Import receipts to see them here.</p>
      </div>
    );
  }

  // Group transactions by date
  const grouped = transactions.reduce((acc, transaction) => {
    const date = transaction.transaction_date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(transaction);
    return acc;
  }, {} as Record<string, TransactionWithCategory[]>);

  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-6">
      {sortedDates.map((date) => (
        <div key={date}>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">
            {new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </h3>
          <div className="space-y-2">
            {grouped[date].map((transaction) => (
              <TransactionRow
                key={transaction.id}
                transaction={transaction}
                categories={categories}
                onCategoryChange={onCategoryChange}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

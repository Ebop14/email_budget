import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';
import { formatCurrency, formatDateRelative } from '../../lib/format';
import type { TransactionWithCategory } from '../../types';

interface RecentTransactionsProps {
  transactions: TransactionWithCategory[];
  isLoading?: boolean;
}

export function RecentTransactions({ transactions, isLoading }: RecentTransactionsProps) {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <Card className="animate-scale-in stagger-5">
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="animate-scale-in stagger-5">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Recent Transactions</CardTitle>
        <Button variant="ghost" size="sm" onClick={() => navigate('/transactions')} className="rounded-xl">
          View All
          <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
            No transactions yet
          </div>
        ) : (
          <div className="space-y-1">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between py-3 px-3 -mx-3 rounded-xl hover:bg-accent/40 transition-colors duration-200"
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold text-white/90 shrink-0"
                    style={{ backgroundColor: transaction.category_color || '#6b7280' }}
                  >
                    {transaction.merchant.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{transaction.merchant}</p>
                    <p className="text-[11px] text-muted-foreground/70 mt-0.5">
                      {formatDateRelative(transaction.transaction_date)}
                    </p>
                  </div>
                </div>
                <span className="font-semibold text-sm tabular-nums">
                  {formatCurrency(transaction.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

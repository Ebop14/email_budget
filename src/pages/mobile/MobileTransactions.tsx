import { useState } from 'react';
import { Search, SlidersHorizontal, Trash2, Tag } from 'lucide-react';
import { MobileHeader } from '../../components/mobile/MobileHeader';
import { PullToRefresh } from '../../components/mobile/PullToRefresh';
import { SwipeableRow } from '../../components/mobile/SwipeableRow';
import { BottomSheet } from '../../components/mobile/BottomSheet';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';
import { useTransactions } from '../../hooks/useTransactions';
import { useCategories } from '../../hooks/useCategories';
import { formatCurrency, formatDateRelative } from '../../lib/format';
import { SUPPORTED_PROVIDERS } from '../../lib/constants';
import { cn } from '../../lib/utils';
import type { TransactionFilters, Category } from '../../types';

export function MobileTransactions() {
  const {
    transactions,
    filters,
    isLoading,
    setFilters,
    clearFilters,
    fetchTransactions,
    updateCategory,
    deleteTransaction,
  } = useTransactions();
  const { categories } = useCategories();

  const [showFilters, setShowFilters] = useState(false);
  const [recategorizeId, setRecategorizeId] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState(filters.search || '');

  const handleSearch = (value: string) => {
    setSearchValue(value);
    setFilters({ search: value || undefined });
  };

  const handleRecategorize = (transactionId: string) => {
    setRecategorizeId(transactionId);
  };

  const handleCategorySelect = async (categoryId: string) => {
    if (recategorizeId) {
      await updateCategory(recategorizeId, categoryId || null);
      setRecategorizeId(null);
    }
  };

  const handleDelete = async (transactionId: string) => {
    await deleteTransaction(transactionId);
  };

  const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);

  // Group transactions by date
  const grouped = transactions.reduce((acc, tx) => {
    const date = tx.transaction_date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(tx);
    return acc;
  }, {} as Record<string, typeof transactions>);

  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <>
      <MobileHeader
        title="Transactions"
        actions={
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setShowFilters(true)}
          >
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        }
      />

      {/* Sticky search bar */}
      <div className="px-4 py-2 bg-background border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search merchants..."
            value={searchValue}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        {transactions.length > 0 && (
          <p className="text-xs text-muted-foreground mt-1.5">
            {transactions.length} transactions &middot; {formatCurrency(totalAmount)}
          </p>
        )}
      </div>

      <PullToRefresh onRefresh={() => fetchTransactions()}>
        <div className="divide-y divide-border">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center text-muted-foreground py-12 px-4">
              <p>No transactions found.</p>
              <p className="text-sm mt-1">Import receipts to see them here.</p>
            </div>
          ) : (
            sortedDates.map((date) => (
              <div key={date}>
                <div className="px-4 py-2 bg-muted/50 sticky top-0 z-10">
                  <span className="text-xs font-medium text-muted-foreground">
                    {new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                {grouped[date].map((tx) => (
                  <SwipeableRow
                    key={tx.id}
                    onSwipeLeft={() => handleDelete(tx.id)}
                    onSwipeRight={() => handleRecategorize(tx.id)}
                    leftContent={
                      <div className="bg-primary text-primary-foreground px-4 h-full flex items-center gap-1.5">
                        <Tag className="h-4 w-4" />
                        <span className="text-xs font-medium">Category</span>
                      </div>
                    }
                    rightContent={
                      <div className="bg-destructive text-destructive-foreground px-4 h-full flex items-center gap-1.5">
                        <span className="text-xs font-medium">Delete</span>
                        <Trash2 className="h-4 w-4" />
                      </div>
                    }
                  >
                    <div className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {tx.category_color && (
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: tx.category_color }}
                          />
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{tx.merchant}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {tx.category_name && (
                              <span className="text-xs text-muted-foreground">
                                {tx.category_name}
                              </span>
                            )}
                            <span className="text-xs text-muted-foreground">
                              &middot; {formatDateRelative(tx.transaction_date)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <span className="text-sm font-semibold shrink-0 ml-2">
                        {formatCurrency(tx.amount)}
                      </span>
                    </div>
                  </SwipeableRow>
                ))}
              </div>
            ))
          )}
          <div className="h-4" />
        </div>
      </PullToRefresh>

      {/* Filters Bottom Sheet */}
      <BottomSheet
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        title="Filters"
        snapPoints={[70]}
      >
        <div className="p-4 space-y-4">
          {/* Category filter */}
          <div>
            <label className="text-sm font-medium mb-2 block">Category</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setFilters({ categoryId: null })}
                className={cn(
                  'px-3 py-2 rounded-lg text-sm text-left',
                  !filters.categoryId
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground'
                )}
              >
                All Categories
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setFilters({ categoryId: cat.id })}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left',
                    filters.categoryId === cat.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground'
                  )}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="truncate">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Provider filter */}
          <div>
            <label className="text-sm font-medium mb-2 block">Provider</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setFilters({ provider: null })}
                className={cn(
                  'px-3 py-2 rounded-lg text-sm',
                  !filters.provider
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground'
                )}
              >
                All Providers
              </button>
              {SUPPORTED_PROVIDERS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setFilters({ provider: p.id })}
                  className={cn(
                    'px-3 py-2 rounded-lg text-sm',
                    filters.provider === p.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground'
                  )}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Date range */}
          <div>
            <label className="text-sm font-medium mb-2 block">Date Range</label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground">From</label>
                <Input
                  type="date"
                  value={filters.startDate || ''}
                  onChange={(e) => setFilters({ startDate: e.target.value || undefined })}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">To</label>
                <Input
                  type="date"
                  value={filters.endDate || ''}
                  onChange={(e) => setFilters({ endDate: e.target.value || undefined })}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                clearFilters();
                setSearchValue('');
                setShowFilters(false);
              }}
            >
              Clear All
            </Button>
            <Button className="flex-1" onClick={() => setShowFilters(false)}>
              Apply
            </Button>
          </div>
        </div>
      </BottomSheet>

      {/* Recategorize Bottom Sheet */}
      <BottomSheet
        isOpen={!!recategorizeId}
        onClose={() => setRecategorizeId(null)}
        title="Change Category"
        snapPoints={[60]}
      >
        <div className="p-4">
          <div className="grid grid-cols-2 gap-2">
            {categories.map((cat: Category) => (
              <button
                key={cat.id}
                onClick={() => handleCategorySelect(cat.id)}
                className="flex items-center gap-2 px-3 py-3 rounded-lg bg-secondary text-secondary-foreground hover:bg-accent text-sm text-left"
              >
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
                <span className="truncate">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>
      </BottomSheet>
    </>
  );
}

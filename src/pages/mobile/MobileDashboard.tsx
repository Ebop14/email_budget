import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { MobileHeader } from '../../components/mobile/MobileHeader';
import { PullToRefresh } from '../../components/mobile/PullToRefresh';
import { Button } from '../../components/ui/button';
import { Progress } from '../../components/ui/progress';
import { Skeleton } from '../../components/ui/skeleton';
import { useDashboard } from '../../hooks/useDashboard';
import { useBudgets } from '../../hooks/useBudgets';
import { formatCurrency, formatDateRelative } from '../../lib/format';
import { MONTHS } from '../../lib/constants';
import { cn } from '../../lib/utils';

export function MobileDashboard() {
  const navigate = useNavigate();
  const {
    stats,
    isLoading,
    selectedMonth,
    goToPreviousMonth,
    goToNextMonth,
    refresh,
  } = useDashboard();
  const { budgets } = useBudgets();

  const monthLabel = MONTHS[selectedMonth.month - 1] + ' ' + selectedMonth.year;

  const budgetHealthColor = () => {
    if (!stats) return 'bg-success';
    if (stats.budget_health === 'over') return 'bg-destructive';
    if (stats.budget_health === 'warning') return 'bg-warning';
    return 'bg-success';
  };

  const budgetHealthLabel = () => {
    if (!stats) return 'On Track';
    if (stats.budget_health === 'over') return 'Over Budget';
    if (stats.budget_health === 'warning') return 'Warning';
    return 'On Track';
  };

  // Calculate total budget & spent
  const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
  const totalSpent = stats?.total_spent ?? 0;
  const budgetPercent = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;

  return (
    <>
      <MobileHeader
        title="Dashboard"
        actions={
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goToPreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs font-medium min-w-[80px] text-center">
              {MONTHS[selectedMonth.month - 1]?.slice(0, 3)} {selectedMonth.year}
            </span>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goToNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        }
      />
      <PullToRefresh onRefresh={refresh}>
        <div className="p-4 space-y-4">
          {/* Hero Card */}
          <div className="bg-card rounded-xl p-5 border border-border">
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-40" />
                <Skeleton className="h-3 w-full" />
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">{monthLabel}</p>
                <p className="text-3xl font-bold mt-1">
                  {formatCurrency(stats?.total_spent ?? 0)}
                </p>

                {totalBudget > 0 && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={cn(
                        'text-xs font-medium px-2 py-0.5 rounded-full',
                        stats?.budget_health === 'over'
                          ? 'bg-destructive/10 text-destructive'
                          : stats?.budget_health === 'warning'
                          ? 'bg-warning/10 text-warning'
                          : 'bg-success/10 text-success'
                      )}>
                        {budgetHealthLabel()}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatCurrency(totalBudget)} budget
                      </span>
                    </div>
                    <Progress
                      value={budgetPercent}
                      className="h-2.5"
                      indicatorClassName={budgetHealthColor()}
                    />
                  </div>
                )}
              </>
            )}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-card rounded-xl p-4 border border-border">
              {isLoading ? (
                <Skeleton className="h-12 w-full" />
              ) : (
                <>
                  <p className="text-2xl font-bold">{stats?.transaction_count ?? 0}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Transactions</p>
                </>
              )}
            </div>
            <div className="bg-card rounded-xl p-4 border border-border">
              {isLoading ? (
                <Skeleton className="h-12 w-full" />
              ) : (
                <>
                  <p className="text-2xl font-bold">{stats?.category_count ?? 0}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Categories</p>
                </>
              )}
            </div>
          </div>

          {/* Category Chips (horizontal scroll) */}
          {stats && stats.category_spending.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-2">Spending by Category</h3>
              <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 mobile-scroll">
                {stats.category_spending.map((cat) => (
                  <button
                    key={cat.category_id}
                    onClick={() => navigate(`/transactions?category=${cat.category_id}`)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card border border-border shrink-0 text-sm"
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: cat.category_color }}
                    />
                    <span className="whitespace-nowrap">{cat.category_name}</span>
                    <span className="text-muted-foreground whitespace-nowrap">
                      {formatCurrency(cat.total)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Recent Transactions */}
          {stats && stats.recent_transactions.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium">Recent Transactions</h3>
                <button
                  onClick={() => navigate('/transactions')}
                  className="text-xs text-primary flex items-center gap-0.5"
                >
                  See all
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
              <div className="bg-card rounded-xl border border-border divide-y divide-border">
                {stats.recent_transactions.slice(0, 5).map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {tx.category_color && (
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: tx.category_color }}
                        />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{tx.merchant}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateRelative(tx.transaction_date)}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-medium shrink-0 ml-2">
                      {formatCurrency(tx.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Budget Summary */}
          {budgets.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium">Budgets</h3>
                <button
                  onClick={() => navigate('/budgets')}
                  className="text-xs text-primary flex items-center gap-0.5"
                >
                  Manage
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
              <div className="bg-card rounded-xl border border-border divide-y divide-border">
                {budgets.slice(0, 4).map((budget) => (
                  <div key={budget.id} className="px-4 py-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{budget.category_name}</span>
                      <span className={cn(
                        'text-xs',
                        budget.is_over_budget && 'text-destructive',
                        budget.percentage >= 0.8 && !budget.is_over_budget && 'text-warning'
                      )}>
                        {formatCurrency(budget.spent)} / {formatCurrency(budget.amount)}
                      </span>
                    </div>
                    <Progress
                      value={Math.min(budget.percentage * 100, 100)}
                      className="h-2"
                      indicatorClassName={cn(
                        budget.is_over_budget && 'bg-destructive',
                        budget.percentage >= 0.8 && !budget.is_over_budget && 'bg-warning'
                      )}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bottom padding for scroll */}
          <div className="h-4" />
        </div>
      </PullToRefresh>
    </>
  );
}

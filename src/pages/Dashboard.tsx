import { ChevronLeft, ChevronRight, Receipt, Layers, TrendingUp } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Button } from '../components/ui/button';
import { SummaryCard } from '../components/dashboard/SummaryCard';
import { CategoryChart } from '../components/dashboard/CategoryChart';
import { TopMerchants } from '../components/dashboard/TopMerchants';
import { RecentTransactions } from '../components/dashboard/RecentTransactions';
import { BudgetHealthBar } from '../components/dashboard/BudgetHealthBar';
import { useDashboard } from '../hooks/useDashboard';
import { useBudgets } from '../hooks/useBudgets';
import { formatCurrency } from '../lib/format';
import { MONTHS } from '../lib/constants';

export function Dashboard() {
  const {
    stats,
    isLoading,
    selectedMonth,
    goToPreviousMonth,
    goToNextMonth,
  } = useDashboard();

  const { budgets, isLoading: budgetsLoading } = useBudgets();

  const monthLabel = MONTHS[selectedMonth.month - 1] + ' ' + selectedMonth.year;

  const getBudgetHealthLabel = (health: string) => {
    switch (health) {
      case 'over':
        return 'Over Budget';
      case 'warning':
        return 'Warning';
      default:
        return 'Good';
    }
  };

  const getBudgetHealthTrend = (health: string): 'up' | 'down' | 'neutral' => {
    switch (health) {
      case 'over':
        return 'down';
      case 'warning':
        return 'neutral';
      default:
        return 'up';
    }
  };

  return (
    <>
      <Header
        title="Dashboard"
        description="Your spending at a glance"
        actions={
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={goToPreviousMonth} className="rounded-xl">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-semibold min-w-[130px] text-center tracking-wide">
              {monthLabel}
            </span>
            <Button variant="ghost" size="icon" onClick={goToNextMonth} className="rounded-xl">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        }
      />
      <div className="flex-1 overflow-auto p-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <SummaryCard
            title="Total Spent"
            value={stats ? formatCurrency(stats.total_spent) : '$0.00'}
            subtitle={monthLabel}
            icon={<TrendingUp className="h-5 w-5" />}
            isLoading={isLoading}
          />
          <SummaryCard
            title="Transactions"
            value={stats?.transaction_count.toString() || '0'}
            subtitle="This month"
            icon={<Receipt className="h-5 w-5" />}
            isLoading={isLoading}
          />
          <SummaryCard
            title="Categories"
            value={stats?.category_count.toString() || '0'}
            subtitle="With spending"
            icon={<Layers className="h-5 w-5" />}
            isLoading={isLoading}
          />
          <SummaryCard
            title="Budget Health"
            value={stats ? getBudgetHealthLabel(stats.budget_health) : 'Good'}
            trend={stats ? getBudgetHealthTrend(stats.budget_health) : 'up'}
            isLoading={isLoading}
          />
        </div>

        {/* Charts and Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <CategoryChart
            spending={stats?.category_spending || []}
            isLoading={isLoading}
          />
          <TopMerchants
            merchants={stats?.top_merchants || []}
            isLoading={isLoading}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentTransactions
            transactions={stats?.recent_transactions || []}
            isLoading={isLoading}
          />
          <BudgetHealthBar
            budgets={budgets}
            isLoading={budgetsLoading}
          />
        </div>
      </div>
    </>
  );
}

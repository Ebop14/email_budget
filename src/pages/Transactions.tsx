import { Header } from '../components/layout/Header';
import { TransactionList } from '../components/transactions/TransactionList';
import { TransactionFilters } from '../components/transactions/TransactionFilters';
import { useTransactions } from '../hooks/useTransactions';
import { useCategories } from '../hooks/useCategories';
import { formatCurrency } from '../lib/format';

export function Transactions() {
  const {
    transactions,
    filters,
    isLoading,
    setFilters,
    clearFilters,
    updateCategory,
    deleteTransaction,
  } = useTransactions();

  const { categories } = useCategories();

  const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);

  return (
    <>
      <Header
        title="Transactions"
        description={
          transactions.length > 0
            ? `${transactions.length} transactions totaling ${formatCurrency(totalAmount)}`
            : 'View and manage your transactions'
        }
      />
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Filters */}
        <div className="p-6 pb-0">
          <TransactionFilters
            filters={filters}
            categories={categories}
            onFiltersChange={setFilters}
            onClear={clearFilters}
          />
        </div>

        {/* List */}
        <div className="flex-1 overflow-auto p-6">
          <TransactionList
            transactions={transactions}
            categories={categories}
            isLoading={isLoading}
            onCategoryChange={updateCategory}
            onDelete={deleteTransaction}
          />
        </div>
      </div>
    </>
  );
}

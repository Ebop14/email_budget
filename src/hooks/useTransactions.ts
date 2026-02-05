import { useEffect, useCallback } from 'react';
import { useTransactionStore } from '../stores/transactionStore';
import * as tauri from '../lib/tauri';
import type { TransactionFilters } from '../types';

export function useTransactions() {
  const {
    transactions,
    filters,
    isLoading,
    error,
    setTransactions,
    setFilters,
    clearFilters,
    setLoading,
    setError,
  } = useTransactionStore();

  const fetchTransactions = useCallback(async (customFilters?: TransactionFilters) => {
    setLoading(true);
    setError(null);

    try {
      const filtersToUse = customFilters || filters;
      const data = await tauri.getTransactions(filtersToUse);
      setTransactions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [filters, setTransactions, setLoading, setError]);

  const updateCategory = useCallback(async (transactionId: string, categoryId: string | null) => {
    try {
      await tauri.updateTransactionCategory(transactionId, categoryId);
      // Update local state
      setTransactions(
        transactions.map((t) =>
          t.id === transactionId ? { ...t, category_id: categoryId } : t
        )
      );
    } catch (err) {
      throw err;
    }
  }, [transactions, setTransactions]);

  const deleteTransaction = useCallback(async (transactionId: string) => {
    try {
      await tauri.deleteTransaction(transactionId);
      setTransactions(transactions.filter((t) => t.id !== transactionId));
    } catch (err) {
      throw err;
    }
  }, [transactions, setTransactions]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return {
    transactions,
    filters,
    isLoading,
    error,
    fetchTransactions,
    setFilters,
    clearFilters,
    updateCategory,
    deleteTransaction,
  };
}

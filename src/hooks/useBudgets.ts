import { useEffect, useCallback } from 'react';
import { useBudgetStore } from '../stores/budgetStore';
import * as tauri from '../lib/tauri';

export function useBudgets() {
  const { budgets, isLoading, error, setBudgets, setLoading, setError } = useBudgetStore();

  const fetchBudgets = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await tauri.getBudgets();
      setBudgets(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [setBudgets, setLoading, setError]);

  const setBudget = useCallback(async (
    categoryId: string,
    amount: number,
    period: 'weekly' | 'monthly' | 'yearly'
  ) => {
    try {
      await tauri.setBudget(categoryId, amount, period);
      await fetchBudgets(); // Refresh to get updated progress
    } catch (err) {
      throw err;
    }
  }, [fetchBudgets]);

  const deleteBudget = useCallback(async (budgetId: string) => {
    try {
      await tauri.deleteBudget(budgetId);
      setBudgets(budgets.filter((b) => b.id !== budgetId));
    } catch (err) {
      throw err;
    }
  }, [budgets, setBudgets]);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  return {
    budgets,
    isLoading,
    error,
    fetchBudgets,
    setBudget,
    deleteBudget,
  };
}

import { create } from 'zustand';
import type { BudgetWithProgress } from '../types';

interface BudgetState {
  budgets: BudgetWithProgress[];
  isLoading: boolean;
  error: string | null;
  setBudgets: (budgets: BudgetWithProgress[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useBudgetStore = create<BudgetState>((set) => ({
  budgets: [],
  isLoading: false,
  error: null,

  setBudgets: (budgets) => set({ budgets }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));

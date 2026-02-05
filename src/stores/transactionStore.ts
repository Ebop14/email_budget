import { create } from 'zustand';
import type { TransactionWithCategory, TransactionFilters } from '../types';

interface TransactionState {
  transactions: TransactionWithCategory[];
  filters: TransactionFilters;
  isLoading: boolean;
  error: string | null;
  setTransactions: (transactions: TransactionWithCategory[]) => void;
  setFilters: (filters: Partial<TransactionFilters>) => void;
  clearFilters: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

const defaultFilters: TransactionFilters = {
  search: '',
  categoryId: null,
  provider: null,
  startDate: undefined,
  endDate: undefined,
  minAmount: undefined,
  maxAmount: undefined,
};

export const useTransactionStore = create<TransactionState>((set) => ({
  transactions: [],
  filters: defaultFilters,
  isLoading: false,
  error: null,

  setTransactions: (transactions) => set({ transactions }),

  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
    })),

  clearFilters: () => set({ filters: defaultFilters }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),
}));

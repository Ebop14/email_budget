import { create } from 'zustand';
import type { Category, CategorySpending } from '../types';

interface CategoryState {
  categories: Category[];
  spending: CategorySpending[];
  isLoading: boolean;
  error: string | null;
  setCategories: (categories: Category[]) => void;
  setSpending: (spending: CategorySpending[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useCategoryStore = create<CategoryState>((set) => ({
  categories: [],
  spending: [],
  isLoading: false,
  error: null,

  setCategories: (categories) => set({ categories }),
  setSpending: (spending) => set({ spending }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));

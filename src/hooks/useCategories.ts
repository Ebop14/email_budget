import { useEffect, useCallback } from 'react';
import { useCategoryStore } from '../stores/categoryStore';
import * as tauri from '../lib/tauri';

export function useCategories() {
  const { categories, spending, isLoading, error, setCategories, setSpending, setLoading, setError } = useCategoryStore();

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await tauri.getCategories();
      setCategories(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [setCategories, setLoading, setError]);

  const fetchSpending = useCallback(async (startDate: string, endDate: string) => {
    try {
      const data = await tauri.getCategorySpending(startDate, endDate);
      setSpending(data);
    } catch (err) {
      console.error('Failed to fetch spending:', err);
    }
  }, [setSpending]);

  const createCategory = useCallback(async (name: string, icon: string, color: string) => {
    try {
      const category = await tauri.createCategory(name, icon, color);
      setCategories([...categories, category]);
      return category;
    } catch (err) {
      throw err;
    }
  }, [categories, setCategories]);

  const updateCategory = useCallback(async (
    categoryId: string,
    name: string,
    icon: string,
    color: string
  ) => {
    try {
      await tauri.updateCategory(categoryId, name, icon, color);
      setCategories(
        categories.map((c) =>
          c.id === categoryId ? { ...c, name, icon, color } : c
        )
      );
    } catch (err) {
      throw err;
    }
  }, [categories, setCategories]);

  const deleteCategory = useCallback(async (categoryId: string) => {
    try {
      await tauri.deleteCategory(categoryId);
      setCategories(categories.filter((c) => c.id !== categoryId));
    } catch (err) {
      throw err;
    }
  }, [categories, setCategories]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return {
    categories,
    spending,
    isLoading,
    error,
    fetchCategories,
    fetchSpending,
    createCategory,
    updateCategory,
    deleteCategory,
  };
}

import { useState, useEffect, useCallback } from 'react';
import * as tauri from '../lib/tauri';
import type { DashboardStats } from '../lib/tauri';

export function useDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return { month: now.getMonth() + 1, year: now.getFullYear() };
  });

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await tauri.getDashboardStats(selectedMonth.month, selectedMonth.year);
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  }, [selectedMonth]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const goToPreviousMonth = useCallback(() => {
    setSelectedMonth((prev) => {
      if (prev.month === 1) {
        return { month: 12, year: prev.year - 1 };
      }
      return { month: prev.month - 1, year: prev.year };
    });
  }, []);

  const goToNextMonth = useCallback(() => {
    setSelectedMonth((prev) => {
      if (prev.month === 12) {
        return { month: 1, year: prev.year + 1 };
      }
      return { month: prev.month + 1, year: prev.year };
    });
  }, []);

  return {
    stats,
    isLoading,
    error,
    selectedMonth,
    goToPreviousMonth,
    goToNextMonth,
    refresh: fetchStats,
  };
}

import { useState, useCallback } from 'react';
import * as tauri from '../lib/tauri';
import type { ParsedTransaction } from '../types';

interface ImportState {
  step: 'select' | 'preview' | 'done';
  isLoading: boolean;
  error: string | null;
  transactions: ParsedTransaction[];
  duplicates: number;
  errors: string[];
  importResult: { imported: number; skipped: number; errors: string[] } | null;
  categoryAssignments: Record<number, string>;
}

export function useImport() {
  const [state, setState] = useState<ImportState>({
    step: 'select',
    isLoading: false,
    error: null,
    transactions: [],
    duplicates: 0,
    errors: [],
    importResult: null,
    categoryAssignments: {},
  });

  const parseFiles = useCallback(async (files: File[]) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Read file contents
      const htmlContents = await Promise.all(
        files.map((file) => file.text())
      );

      // Parse via Tauri
      const result = await tauri.importReceipts(htmlContents);

      setState((prev) => ({
        ...prev,
        step: 'preview',
        isLoading: false,
        transactions: result.transactions,
        duplicates: result.duplicates,
        errors: result.errors,
        categoryAssignments: {},
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : String(err),
      }));
    }
  }, []);

  const setCategoryAssignment = useCallback((index: number, categoryId: string) => {
    setState((prev) => ({
      ...prev,
      categoryAssignments: {
        ...prev.categoryAssignments,
        [index]: categoryId,
      },
    }));
  }, []);

  const confirmImport = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await tauri.confirmImport(
        state.transactions,
        state.categoryAssignments
      );

      setState((prev) => ({
        ...prev,
        step: 'done',
        isLoading: false,
        importResult: result,
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : String(err),
      }));
    }
  }, [state.transactions, state.categoryAssignments]);

  const reset = useCallback(() => {
    setState({
      step: 'select',
      isLoading: false,
      error: null,
      transactions: [],
      duplicates: 0,
      errors: [],
      importResult: null,
      categoryAssignments: {},
    });
  }, []);

  return {
    ...state,
    parseFiles,
    setCategoryAssignment,
    confirmImport,
    reset,
  };
}

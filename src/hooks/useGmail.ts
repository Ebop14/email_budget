import { useEffect, useCallback } from 'react';
import { listen } from '@tauri-apps/api/event';
import { useGmailStore } from '../stores/gmailStore';
import * as tauri from '../lib/tauri';
import type { GmailSyncResult, GmailSyncStatus } from '../types';

export function useGmail() {
  const store = useGmailStore();

  const fetchStatus = useCallback(async () => {
    try {
      const status = await tauri.gmailGetStatus();
      store.setStatus(status);
    } catch (err) {
      console.error('Failed to fetch Gmail status:', err);
    }
  }, [store.setStatus]);

  const fetchFilters = useCallback(async () => {
    try {
      const filters = await tauri.gmailGetSenderFilters();
      store.setFilters(filters);
    } catch (err) {
      console.error('Failed to fetch sender filters:', err);
    }
  }, [store.setFilters]);

  const saveCredentials = useCallback(async (clientId: string, clientSecret: string) => {
    store.setLoading(true);
    store.setError(null);
    try {
      await tauri.gmailSaveCredentials(clientId, clientSecret);
      await fetchStatus();
    } catch (err) {
      store.setError(err instanceof Error ? err.message : String(err));
    } finally {
      store.setLoading(false);
    }
  }, [store.setLoading, store.setError, fetchStatus]);

  const deleteCredentials = useCallback(async () => {
    store.setLoading(true);
    try {
      await tauri.gmailDeleteCredentials();
      await fetchStatus();
    } catch (err) {
      store.setError(err instanceof Error ? err.message : String(err));
    } finally {
      store.setLoading(false);
    }
  }, [store.setLoading, store.setError, fetchStatus]);

  const connect = useCallback(async () => {
    store.setLoading(true);
    store.setError(null);
    try {
      const email = await tauri.gmailConnect();
      await fetchStatus();
      return email;
    } catch (err) {
      store.setError(err instanceof Error ? err.message : String(err));
      throw err;
    } finally {
      store.setLoading(false);
    }
  }, [store.setLoading, store.setError, fetchStatus]);

  const disconnect = useCallback(async () => {
    store.setLoading(true);
    try {
      await tauri.gmailDisconnect();
      await fetchStatus();
    } catch (err) {
      store.setError(err instanceof Error ? err.message : String(err));
    } finally {
      store.setLoading(false);
    }
  }, [store.setLoading, store.setError, fetchStatus]);

  const syncNow = useCallback(async () => {
    store.setSyncStatus('syncing');
    try {
      const result = await tauri.gmailSyncNow();
      store.setLastSyncResult(result);
      store.setSyncStatus('idle');
      await fetchStatus();
      return result;
    } catch (err) {
      store.setSyncStatus({ error: err instanceof Error ? err.message : String(err) });
      throw err;
    }
  }, [store.setSyncStatus, store.setLastSyncResult, fetchStatus]);

  const addFilter = useCallback(async (email: string, label: string) => {
    try {
      await tauri.gmailAddSenderFilter(email, label);
      await fetchFilters();
    } catch (err) {
      store.setError(err instanceof Error ? err.message : String(err));
    }
  }, [store.setError, fetchFilters]);

  const removeFilter = useCallback(async (filterId: string) => {
    try {
      await tauri.gmailRemoveSenderFilter(filterId);
      await fetchFilters();
    } catch (err) {
      store.setError(err instanceof Error ? err.message : String(err));
    }
  }, [store.setError, fetchFilters]);

  const toggleFilter = useCallback(async (filterId: string) => {
    try {
      await tauri.gmailToggleSenderFilter(filterId);
      await fetchFilters();
    } catch (err) {
      store.setError(err instanceof Error ? err.message : String(err));
    }
  }, [store.setError, fetchFilters]);

  // Listen for Tauri events
  useEffect(() => {
    const unlisten: (() => void)[] = [];

    listen<GmailSyncResult>('gmail:sync-result', (event) => {
      store.setLastSyncResult(event.payload);
    }).then((fn) => unlisten.push(fn));

    listen<GmailSyncStatus>('gmail:status-changed', (event) => {
      store.setSyncStatus(event.payload);
    }).then((fn) => unlisten.push(fn));

    listen('gmail:auth-required', () => {
      store.setSyncStatus('auth_required');
      fetchStatus();
    }).then((fn) => unlisten.push(fn));

    return () => {
      unlisten.forEach((fn) => fn());
    };
  }, []);

  // Fetch initial data
  useEffect(() => {
    fetchStatus();
    fetchFilters();
  }, []);

  return {
    status: store.status,
    filters: store.filters,
    syncStatus: store.syncStatus,
    lastSyncResult: store.lastSyncResult,
    isLoading: store.isLoading,
    error: store.error,
    saveCredentials,
    deleteCredentials,
    connect,
    disconnect,
    syncNow,
    addFilter,
    removeFilter,
    toggleFilter,
    fetchStatus,
    fetchFilters,
  };
}

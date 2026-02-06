import { create } from 'zustand';
import type { GmailConnectionStatus, GmailSyncStatus, SenderFilter, GmailSyncResult } from '../types';

interface GmailState {
  status: GmailConnectionStatus | null;
  filters: SenderFilter[];
  syncStatus: GmailSyncStatus;
  lastSyncResult: GmailSyncResult | null;
  isLoading: boolean;
  error: string | null;
  setStatus: (status: GmailConnectionStatus) => void;
  setFilters: (filters: SenderFilter[]) => void;
  setSyncStatus: (status: GmailSyncStatus) => void;
  setLastSyncResult: (result: GmailSyncResult) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useGmailStore = create<GmailState>()((set) => ({
  status: null,
  filters: [],
  syncStatus: 'idle',
  lastSyncResult: null,
  isLoading: false,
  error: null,
  setStatus: (status) => set({ status }),
  setFilters: (filters) => set({ filters }),
  setSyncStatus: (syncStatus) => set({ syncStatus }),
  setLastSyncResult: (lastSyncResult) => set({ lastSyncResult }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));

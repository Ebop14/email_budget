import { useCallback } from 'react';
import { usePlatform } from './usePlatform';
import { invoke } from '@tauri-apps/api/core';

type ImpactStyle = 'light' | 'medium' | 'heavy';
type NotificationType = 'success' | 'warning' | 'error';

export function useHaptics() {
  const { isMobile } = usePlatform();

  const impact = useCallback(
    async (style: ImpactStyle = 'medium') => {
      if (!isMobile) return;
      try {
        await invoke('plugin:haptics|impact', {
          payload: { style },
        });
      } catch {
        // Haptics not available - no-op
      }
    },
    [isMobile]
  );

  const notification = useCallback(
    async (type: NotificationType) => {
      if (!isMobile) return;
      try {
        await invoke('plugin:haptics|notification', {
          payload: { type },
        });
      } catch {
        // Haptics not available - no-op
      }
    },
    [isMobile]
  );

  const selectionChanged = useCallback(async () => {
    if (!isMobile) return;
    try {
      await invoke('plugin:haptics|selection_changed');
    } catch {
      // Haptics not available - no-op
    }
  }, [isMobile]);

  return { impact, notification, selectionChanged };
}

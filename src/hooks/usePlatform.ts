import { useState, useEffect } from 'react';
import { getPlatform } from '../lib/tauri';
import { detectPlatformSync, isMobilePlatform } from '../lib/platform';

interface PlatformInfo {
  platform: 'ios' | 'android' | 'desktop';
  isMobile: boolean;
  isIOS: boolean;
  isReady: boolean;
}

let cachedPlatform: PlatformInfo | null = null;

export function usePlatform(): PlatformInfo {
  const [info, setInfo] = useState<PlatformInfo>(() => {
    if (cachedPlatform) return cachedPlatform;
    const sync = detectPlatformSync();
    return {
      platform: sync,
      isMobile: isMobilePlatform(sync),
      isIOS: sync === 'ios',
      isReady: false,
    };
  });

  useEffect(() => {
    if (cachedPlatform) {
      setInfo(cachedPlatform);
      return;
    }

    getPlatform()
      .then((p) => {
        const platform = p as 'ios' | 'android' | 'desktop';
        const result: PlatformInfo = {
          platform,
          isMobile: isMobilePlatform(platform),
          isIOS: platform === 'ios',
          isReady: true,
        };
        cachedPlatform = result;
        setInfo(result);
      })
      .catch(() => {
        // Fallback to sync detection if Tauri command fails
        const sync = detectPlatformSync();
        const result: PlatformInfo = {
          platform: sync,
          isMobile: isMobilePlatform(sync),
          isIOS: sync === 'ios',
          isReady: true,
        };
        cachedPlatform = result;
        setInfo(result);
      });
  }, []);

  return info;
}

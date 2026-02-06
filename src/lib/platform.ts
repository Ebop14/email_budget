/**
 * Synchronous platform detection fallback using user agent.
 * Used before the async Tauri command resolves.
 */
export function detectPlatformSync(): 'ios' | 'android' | 'desktop' {
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return 'ios';
  if (/android/.test(ua)) return 'android';
  return 'desktop';
}

export function isMobilePlatform(platform: string): boolean {
  return platform === 'ios' || platform === 'android';
}

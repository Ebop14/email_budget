import { cn } from '../../lib/utils';
import type { GmailSyncStatus } from '../../types';

interface GmailSyncBadgeProps {
  isConnected: boolean;
  syncStatus: GmailSyncStatus;
}

export function GmailSyncBadge({ isConnected, syncStatus }: GmailSyncBadgeProps) {
  if (!isConnected) return null;

  let color = 'bg-green-500';
  let title = 'Gmail connected';

  if (syncStatus === 'syncing') {
    color = 'bg-blue-500 animate-pulse';
    title = 'Syncing...';
  } else if (syncStatus === 'rate_limited') {
    color = 'bg-yellow-500';
    title = 'Rate limited';
  } else if (syncStatus === 'auth_required') {
    color = 'bg-red-500';
    title = 'Re-authentication required';
  } else if (typeof syncStatus === 'object' && 'error' in syncStatus) {
    color = 'bg-red-500';
    title = `Error: ${syncStatus.error}`;
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1" title={title}>
      <div className={cn('w-2 h-2 rounded-full', color)} />
      <span className="text-xs text-muted-foreground">Gmail</span>
    </div>
  );
}

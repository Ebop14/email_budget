import { Mail, LogOut, RefreshCw, Play, Square } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import type { GmailConnectionStatus, GmailSyncStatus } from '../../types';

interface GmailConnectCardProps {
  status: GmailConnectionStatus | null;
  syncStatus: GmailSyncStatus;
  onConnect: () => Promise<unknown>;
  onDisconnect: () => Promise<void>;
  onSyncNow: () => Promise<unknown>;
  onStartPolling: () => void;
  onStopPolling: () => void;
  isLoading: boolean;
}

function getSyncStatusBadge(syncStatus: GmailSyncStatus) {
  if (syncStatus === 'idle') return <Badge variant="secondary">Idle</Badge>;
  if (syncStatus === 'syncing') return <Badge variant="default">Syncing...</Badge>;
  if (syncStatus === 'rate_limited') return <Badge variant="warning">Rate Limited</Badge>;
  if (syncStatus === 'auth_required') return <Badge variant="destructive">Re-auth Required</Badge>;
  if (typeof syncStatus === 'object' && 'error' in syncStatus)
    return <Badge variant="destructive">Error</Badge>;
  return null;
}

export function GmailConnectCard({
  status,
  syncStatus,
  onConnect,
  onDisconnect,
  onSyncNow,
  onStartPolling,
  onStopPolling,
  isLoading,
}: GmailConnectCardProps) {
  if (!status?.has_credentials) {
    return null;
  }

  if (!status.is_connected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Gmail Connection
          </CardTitle>
          <CardDescription>Connect your Gmail to auto-import receipts</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={onConnect} disabled={isLoading}>
            <Mail className="h-4 w-4 mr-2" />
            {isLoading ? 'Connecting...' : 'Connect Gmail'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Gmail Connection
        </CardTitle>
        <CardDescription>Connected and auto-importing receipts</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">{status.email}</p>
            <p className="text-xs text-muted-foreground">
              {status.last_sync_at
                ? `Last sync: ${new Date(status.last_sync_at).toLocaleString()}`
                : 'Never synced'}
            </p>
          </div>
          {getSyncStatusBadge(syncStatus)}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onSyncNow}
            disabled={isLoading || syncStatus === 'syncing'}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
            Sync Now
          </Button>

          {status.is_polling ? (
            <Button variant="outline" size="sm" onClick={onStopPolling}>
              <Square className="h-4 w-4 mr-1" />
              Stop Auto-Sync
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={onStartPolling}>
              <Play className="h-4 w-4 mr-1" />
              Start Auto-Sync
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={onDisconnect}
            disabled={isLoading}
            className="text-destructive hover:text-destructive"
          >
            <LogOut className="h-4 w-4 mr-1" />
            Disconnect
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

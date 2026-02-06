import { useEffect, useState } from 'react';
import { listen } from '@tauri-apps/api/event';
import { CheckCircle, X } from 'lucide-react';
import type { GmailSyncResult } from '../../types';

export function GmailSyncNotification() {
  const [notification, setNotification] = useState<GmailSyncResult | null>(null);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    const unlisten = listen<GmailSyncResult>('gmail:sync-result', (event) => {
      const result = event.payload;
      if (result.new_transactions > 0) {
        setNotification(result);
        timeout = setTimeout(() => setNotification(null), 5000);
      }
    });

    return () => {
      unlisten.then((fn) => fn());
      clearTimeout(timeout);
    };
  }, []);

  if (!notification) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="bg-card border shadow-lg rounded-lg p-4 flex items-start gap-3 max-w-sm">
        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium">Gmail Sync</p>
          <p className="text-xs text-muted-foreground">
            Imported {notification.new_transactions} new transaction
            {notification.new_transactions !== 1 ? 's' : ''} from Gmail
          </p>
        </div>
        <button
          onClick={() => setNotification(null)}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

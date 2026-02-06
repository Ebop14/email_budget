import { MobileHeader } from '../../components/mobile/MobileHeader';
import { GmailCredentialsForm } from '../../components/gmail/GmailCredentialsForm';
import { GmailConnectCard } from '../../components/gmail/GmailConnectCard';
import { SenderFilterList } from '../../components/gmail/SenderFilterList';
import { useSettingsStore } from '../../stores/settingsStore';
import { useGmail } from '../../hooks/useGmail';
import { SUPPORTED_PROVIDERS } from '../../lib/constants';
import { cn } from '../../lib/utils';
import * as tauri from '../../lib/tauri';

export function MobileSettings() {
  const { theme, setTheme, selectedProviders, toggleProvider } = useSettingsStore();
  const {
    status,
    filters,
    syncStatus,
    isLoading,
    saveCredentials,
    deleteCredentials,
    connect,
    disconnect,
    syncNow,
    addFilter,
    removeFilter,
    toggleFilter,
  } = useGmail();

  return (
    <>
      <MobileHeader title="Settings" />
      <div className="flex-1 overflow-auto mobile-scroll p-4 space-y-4">
        {/* Appearance */}
        <div className="bg-card rounded-xl border border-border p-4">
          <h3 className="text-sm font-medium mb-3">Appearance</h3>
          <div className="flex rounded-lg overflow-hidden border border-border">
            {(['light', 'dark', 'system'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={cn(
                  'flex-1 py-2.5 text-sm font-medium capitalize transition-colors',
                  theme === t
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card text-foreground'
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Gmail Integration */}
        <div className="space-y-4">
          <GmailCredentialsForm
            hasCredentials={status?.has_credentials ?? false}
            onSave={saveCredentials}
            onDelete={deleteCredentials}
            isLoading={isLoading}
          />

          <GmailConnectCard
            status={status}
            syncStatus={syncStatus}
            onConnect={connect}
            onDisconnect={disconnect}
            onSyncNow={syncNow}
            onStartPolling={() => tauri.gmailStartPolling()}
            onStopPolling={() => tauri.gmailStopPolling()}
            isLoading={isLoading}
          />

          {status?.is_connected && (
            <SenderFilterList
              filters={filters}
              onAdd={addFilter}
              onRemove={removeFilter}
              onToggle={toggleFilter}
            />
          )}
        </div>

        {/* Providers */}
        <div className="bg-card rounded-xl border border-border p-4">
          <h3 className="text-sm font-medium mb-1">Email Providers</h3>
          <p className="text-xs text-muted-foreground mb-3">
            Select which services you use
          </p>
          <div className="grid grid-cols-2 gap-2">
            {SUPPORTED_PROVIDERS.map((provider) => (
              <button
                key={provider.id}
                onClick={() => toggleProvider(provider.id)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left',
                  selectedProviders.includes(provider.id)
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground'
                )}
              >
                {provider.name}
              </button>
            ))}
          </div>
        </div>

        {/* About */}
        <div className="bg-card rounded-xl border border-border p-4">
          <h3 className="text-sm font-medium mb-2">About</h3>
          <div className="space-y-1 text-xs text-muted-foreground">
            <p>Email Budget v0.1.0</p>
            <p>Local-first expense tracking via email receipt parsing.</p>
          </div>
        </div>

        <div className="h-4" />
      </div>
    </>
  );
}

import { Header } from '../components/layout/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { useSettingsStore } from '../stores/settingsStore';
import { SUPPORTED_PROVIDERS } from '../lib/constants';
import { cn } from '../lib/utils';

export function Settings() {
  const { theme, setTheme, selectedProviders, toggleProvider } = useSettingsStore();

  return (
    <>
      <Header title="Settings" description="Customize your experience" />
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-2xl space-y-6">
          {/* Appearance */}
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Choose your preferred theme</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                {(['light', 'dark', 'system'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    className={cn(
                      'px-4 py-2 rounded-md text-sm font-medium capitalize transition-colors',
                      theme === t
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Providers */}
          <Card>
            <CardHeader>
              <CardTitle>Email Providers</CardTitle>
              <CardDescription>
                Select which services you use to receive relevant import suggestions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {SUPPORTED_PROVIDERS.map((provider) => (
                  <button
                    key={provider.id}
                    onClick={() => toggleProvider(provider.id)}
                    className={cn(
                      'flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-colors text-left',
                      selectedProviders.includes(provider.id)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    )}
                  >
                    {provider.name}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

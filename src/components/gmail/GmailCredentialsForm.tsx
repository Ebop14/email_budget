import { useState } from 'react';
import { KeyRound, ExternalLink, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

interface GmailCredentialsFormProps {
  hasCredentials: boolean;
  onSave: (clientId: string, clientSecret: string) => Promise<void>;
  onDelete: () => Promise<void>;
  isLoading: boolean;
}

export function GmailCredentialsForm({
  hasCredentials,
  onSave,
  onDelete,
  isLoading,
}: GmailCredentialsFormProps) {
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [isEditing, setIsEditing] = useState(!hasCredentials);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId.trim() || !clientSecret.trim()) return;
    await onSave(clientId.trim(), clientSecret.trim());
    setClientId('');
    setClientSecret('');
    setIsEditing(false);
  };

  if (hasCredentials && !isEditing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            Google Cloud Credentials
          </CardTitle>
          <CardDescription>OAuth credentials are configured</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              Update
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onDelete}
              disabled={isLoading}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Remove
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="h-5 w-5" />
          Google Cloud Credentials
        </CardTitle>
        <CardDescription>
          Enter your Google Cloud OAuth 2.0 credentials to enable Gmail integration.
          <a
            href="https://console.cloud.google.com/apis/credentials"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 ml-1 text-primary hover:underline"
          >
            Get credentials
            <ExternalLink className="h-3 w-3" />
          </a>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-sm font-medium mb-1 block">Client ID</label>
            <Input
              type="text"
              placeholder="xxxxx.apps.googleusercontent.com"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Client Secret</label>
            <Input
              type="password"
              placeholder="GOCSPX-xxxxx"
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
            />
          </div>
          <div className="text-xs text-muted-foreground">
            Create a Desktop app OAuth client in Google Cloud Console.
            Add <code className="bg-muted px-1 rounded">http://localhost:8249/callback</code> as
            an authorized redirect URI.
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={isLoading || !clientId.trim() || !clientSecret.trim()}>
              {isLoading ? 'Saving...' : 'Save Credentials'}
            </Button>
            {hasCredentials && (
              <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

import { useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight, Mail, RefreshCw, Upload as UploadIcon } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { DropZone } from '../components/import/DropZone';
import { ParsePreview } from '../components/import/ParsePreview';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { useImport } from '../hooks/useImport';
import { useCategories } from '../hooks/useCategories';
import { useGmail } from '../hooks/useGmail';

export function Import() {
  const navigate = useNavigate();
  const {
    step,
    isLoading,
    error,
    transactions,
    duplicates,
    errors,
    importResult,
    categoryAssignments,
    parseFiles,
    setCategoryAssignment,
    confirmImport,
    reset,
  } = useImport();

  const { categories } = useCategories();
  const { status, syncStatus, syncNow, lastSyncResult } = useGmail();

  return (
    <>
      <Header
        title="Import Receipts"
        description={
          step === 'select'
            ? 'Auto-import from Gmail or manually upload HTML files'
            : step === 'preview'
            ? 'Review and confirm your transactions'
            : 'Import complete!'
        }
      />
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-2xl mx-auto">
          {error && (
            <div className="mb-4 p-4 bg-destructive/10 text-destructive rounded-lg">
              {error}
            </div>
          )}

          {step === 'select' && (
            <div className="space-y-6">
              {/* Gmail Sync Section */}
              {status?.is_connected && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="h-5 w-5" />
                      Gmail Auto-Import
                    </CardTitle>
                    <CardDescription>
                      Connected as {status.email} — receipts are imported automatically every 30s
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        {status.last_sync_at
                          ? `Last sync: ${new Date(status.last_sync_at).toLocaleString()}`
                          : 'Never synced'}
                      </div>
                      {syncStatus === 'syncing' ? (
                        <Badge variant="default">Syncing...</Badge>
                      ) : (
                        <Badge variant="secondary">Auto-syncing</Badge>
                      )}
                    </div>

                    {lastSyncResult && lastSyncResult.new_transactions > 0 && (
                      <div className="text-sm p-2 bg-green-500/10 text-green-700 dark:text-green-400 rounded">
                        Last sync imported {lastSyncResult.new_transactions} transaction
                        {lastSyncResult.new_transactions !== 1 ? 's' : ''}
                      </div>
                    )}

                    <Button
                      variant="outline"
                      onClick={() => syncNow()}
                      disabled={syncStatus === 'syncing'}
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
                      Sync Now
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Manual Import Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UploadIcon className="h-5 w-5" />
                    {status?.is_connected ? 'Manual Import' : 'Import Receipts'}
                  </CardTitle>
                  {status?.is_connected && (
                    <CardDescription>
                      Upload HTML receipt files directly if they weren't captured by Gmail sync
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <DropZone onFilesSelected={parseFiles} isLoading={isLoading} />
                </CardContent>
              </Card>

              {!status?.is_connected && (
                <div className="text-center text-sm text-muted-foreground">
                  <p>
                    Want automatic import?{' '}
                    <button
                      onClick={() => navigate('/settings')}
                      className="text-primary hover:underline"
                    >
                      Connect Gmail in Settings
                    </button>
                  </p>
                </div>
              )}
            </div>
          )}

          {step === 'preview' && (
            <ParsePreview
              transactions={transactions}
              duplicates={duplicates}
              errors={errors}
              categories={categories}
              categoryAssignments={categoryAssignments}
              onCategoryChange={setCategoryAssignment}
              onConfirm={confirmImport}
              onCancel={reset}
              isLoading={isLoading}
            />
          )}

          {step === 'done' && importResult && (
            <div className="text-center py-8">
              <CheckCircle className="h-16 w-16 text-success mx-auto mb-4" />
              <h2 className="text-2xl font-semibold mb-2">Import Complete!</h2>
              <p className="text-muted-foreground mb-6">
                Successfully imported {importResult.imported} transaction
                {importResult.imported !== 1 ? 's' : ''}.
                {importResult.skipped > 0 && (
                  <> Skipped {importResult.skipped} duplicate{importResult.skipped !== 1 ? 's' : ''}.</>
                )}
              </p>

              {importResult.errors.length > 0 && (
                <div className="mb-6 text-left bg-destructive/10 text-destructive rounded-lg p-4">
                  <p className="font-medium mb-1">Some errors occurred:</p>
                  <ul className="list-disc list-inside text-sm">
                    {importResult.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={reset}>
                  Import More
                </Button>
                <Button onClick={() => navigate('/transactions')}>
                  View Transactions
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

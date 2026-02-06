import { useNavigate } from 'react-router-dom';
import {
  CheckCircle,
  ArrowRight,
  Mail,
  RefreshCw,
  Upload as UploadIcon,
} from 'lucide-react';
import { MobileHeader } from '../../components/mobile/MobileHeader';
import { CameraCapture } from '../../components/import/CameraCapture';
import { ParsePreview } from '../../components/import/ParsePreview';
import { DropZone } from '../../components/import/DropZone';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { useImport } from '../../hooks/useImport';
import { useCamera } from '../../hooks/useCamera';
import { useCategories } from '../../hooks/useCategories';
import { useGmail } from '../../hooks/useGmail';
import { usePlatform } from '../../hooks/usePlatform';

export function MobileImport() {
  const navigate = useNavigate();
  const { isIOS } = usePlatform();
  const {
    step,
    isLoading,
    error: importError,
    transactions,
    duplicates,
    errors,
    importResult,
    categoryAssignments,
    parseFiles,
    setCategoryAssignment,
    confirmImport,
    reset: resetImport,
  } = useImport();

  const {
    isCapturing,
    isProcessing,
    error: cameraError,
    transaction: ocrTransaction,
    captureReceipt,
    reset: resetCamera,
  } = useCamera();

  const { categories } = useCategories();
  const { status, syncStatus, syncNow, lastSyncResult } = useGmail();

  const error = importError || cameraError;

  // When OCR produces a transaction, show it in the same preview flow
  const showOcrPreview = ocrTransaction && step === 'select';
  const previewTransactions = showOcrPreview ? [ocrTransaction] : transactions;
  const currentStep = showOcrPreview ? 'preview' : step;

  const handleReset = () => {
    resetImport();
    resetCamera();
  };

  return (
    <>
      <MobileHeader title="Import" />
      <div className="flex-1 overflow-auto mobile-scroll p-4">
        {error && (
          <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
            {error}
          </div>
        )}

        {currentStep === 'select' && (
          <div className="space-y-4">
            {/* Gmail Sync Card */}
            {status?.is_connected && (
              <div className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Gmail Auto-Import</span>
                  {syncStatus === 'syncing' ? (
                    <Badge variant="default" className="text-xs ml-auto">Syncing...</Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs ml-auto">Auto-syncing</Badge>
                  )}
                </div>

                <p className="text-xs text-muted-foreground mb-3">
                  Connected as {status.email}
                </p>

                {lastSyncResult && lastSyncResult.new_transactions > 0 && (
                  <div className="text-xs p-2 bg-green-500/10 text-green-700 dark:text-green-400 rounded mb-3">
                    Last sync imported {lastSyncResult.new_transactions} transaction
                    {lastSyncResult.new_transactions !== 1 ? 's' : ''}
                  </div>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => syncNow()}
                  disabled={syncStatus === 'syncing'}
                  className="w-full"
                >
                  <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${syncStatus === 'syncing' ? 'pull-spinner' : ''}`} />
                  Sync Now
                </Button>
              </div>
            )}

            {/* Camera Capture (iOS only) */}
            {isIOS && (
              <div className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm font-medium">Scan Receipt</span>
                </div>
                <CameraCapture
                  onCapture={captureReceipt}
                  isCapturing={isCapturing}
                  isProcessing={isProcessing}
                />
              </div>
            )}

            {/* File Upload */}
            <div className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center gap-2 mb-3">
                <UploadIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Upload Receipt Files</span>
              </div>
              <DropZone onFilesSelected={parseFiles} isLoading={isLoading} />
            </div>

            {!status?.is_connected && (
              <p className="text-center text-xs text-muted-foreground">
                Want automatic import?{' '}
                <button
                  onClick={() => navigate('/settings')}
                  className="text-primary"
                >
                  Connect Gmail
                </button>
              </p>
            )}
          </div>
        )}

        {currentStep === 'preview' && (
          <ParsePreview
            transactions={previewTransactions}
            duplicates={showOcrPreview ? 0 : duplicates}
            errors={showOcrPreview ? [] : errors}
            categories={categories}
            categoryAssignments={categoryAssignments}
            onCategoryChange={setCategoryAssignment}
            onConfirm={confirmImport}
            onCancel={handleReset}
            isLoading={isLoading}
          />
        )}

        {currentStep === 'done' && importResult && (
          <div className="text-center py-8">
            <CheckCircle className="h-14 w-14 text-success mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Import Complete!</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Successfully imported {importResult.imported} transaction
              {importResult.imported !== 1 ? 's' : ''}.
              {importResult.skipped > 0 && (
                <> Skipped {importResult.skipped} duplicate{importResult.skipped !== 1 ? 's' : ''}.</>
              )}
            </p>

            <div className="flex gap-2 justify-center">
              <Button variant="outline" size="sm" onClick={handleReset}>
                Import More
              </Button>
              <Button size="sm" onClick={() => navigate('/transactions')}>
                View Transactions
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

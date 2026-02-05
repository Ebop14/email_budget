import { useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { DropZone } from '../components/import/DropZone';
import { ParsePreview } from '../components/import/ParsePreview';
import { Button } from '../components/ui/button';
import { useImport } from '../hooks/useImport';
import { useCategories } from '../hooks/useCategories';

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

  return (
    <>
      <Header
        title="Import Receipts"
        description={
          step === 'select'
            ? 'Drag and drop HTML email files to import'
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
            <DropZone onFilesSelected={parseFiles} isLoading={isLoading} />
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

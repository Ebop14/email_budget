import { useState } from 'react';
import { Check, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { CategoryPicker } from '../transactions/CategoryPicker';
import { formatCurrency, formatDate } from '../../lib/format';
import type { ParsedTransaction, Category } from '../../types';
import { cn } from '../../lib/utils';

interface ParsePreviewProps {
  transactions: ParsedTransaction[];
  duplicates: number;
  errors: string[];
  categories: Category[];
  categoryAssignments: Record<number, string>;
  onCategoryChange: (index: number, categoryId: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ParsePreview({
  transactions,
  duplicates,
  errors,
  categories,
  categoryAssignments,
  onCategoryChange,
  onConfirm,
  onCancel,
  isLoading,
}: ParsePreviewProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleExpanded = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center gap-4 text-sm">
        <Badge variant="success">
          <Check className="h-3 w-3 mr-1" />
          {transactions.length} transactions found
        </Badge>
        {duplicates > 0 && (
          <Badge variant="warning">
            {duplicates} duplicate{duplicates > 1 ? 's' : ''} skipped
          </Badge>
        )}
        {errors.length > 0 && (
          <Badge variant="destructive">
            <AlertCircle className="h-3 w-3 mr-1" />
            {errors.length} error{errors.length > 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm">
          <p className="font-medium mb-1">Errors:</p>
          <ul className="list-disc list-inside space-y-1">
            {errors.map((error, i) => (
              <li key={i}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Transaction List */}
      {transactions.length > 0 && (
        <div className="space-y-2">
          {transactions.map((transaction, index) => (
            <div
              key={index}
              className="border rounded-lg overflow-hidden"
            >
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-accent/50"
                onClick={() => toggleExpanded(index)}
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{transaction.merchant}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(transaction.transaction_date)} via {transaction.provider}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(transaction.amount)}</p>
                    <p className={cn(
                      'text-xs',
                      transaction.confidence >= 0.8 ? 'text-success' :
                      transaction.confidence >= 0.5 ? 'text-warning' :
                      'text-destructive'
                    )}>
                      {Math.round(transaction.confidence * 100)}% confidence
                    </p>
                  </div>
                </div>
                <div className="ml-4">
                  {expandedIndex === index ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </div>

              {/* Expanded Details */}
              {expandedIndex === index && (
                <div className="border-t p-4 bg-muted/30 space-y-3">
                  {/* Category Selection */}
                  <div>
                    <label className="text-sm font-medium mb-1 block">Category</label>
                    <CategoryPicker
                      categories={categories}
                      value={categoryAssignments[index]}
                      onChange={(categoryId) => onCategoryChange(index, categoryId)}
                    />
                  </div>

                  {/* Items */}
                  {transaction.items.length > 0 && (
                    <div>
                      <label className="text-sm font-medium mb-1 block">Items</label>
                      <div className="space-y-1">
                        {transaction.items.map((item, itemIndex) => (
                          <div
                            key={itemIndex}
                            className="flex justify-between text-sm py-1"
                          >
                            <span>
                              {item.quantity}x {item.name}
                            </span>
                            <span className="text-muted-foreground">
                              {formatCurrency(item.total_price)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-4">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          disabled={isLoading || transactions.length === 0}
          className="flex-1"
        >
          {isLoading ? 'Importing...' : `Import ${transactions.length} Transaction${transactions.length > 1 ? 's' : ''}`}
        </Button>
      </div>
    </div>
  );
}

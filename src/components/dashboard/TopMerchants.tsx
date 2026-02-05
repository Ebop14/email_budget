import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import { formatCurrency } from '../../lib/format';

interface MerchantTotal {
  merchant: string;
  total: number;
  count: number;
}

interface TopMerchantsProps {
  merchants: MerchantTotal[];
  isLoading?: boolean;
}

export function TopMerchants({ merchants, isLoading }: TopMerchantsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Merchants</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (merchants.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Merchants</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm text-center py-4">
            No merchants yet
          </p>
        </CardContent>
      </Card>
    );
  }

  const maxTotal = Math.max(...merchants.map((m) => m.total));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Merchants</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {merchants.map((merchant, index) => (
            <div key={index}>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium truncate max-w-[60%]">
                  {merchant.merchant}
                </span>
                <span className="text-sm text-muted-foreground">
                  {formatCurrency(merchant.total)}
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${(merchant.total / maxTotal) * 100}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {merchant.count} transaction{merchant.count !== 1 ? 's' : ''}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

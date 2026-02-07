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
      <Card className="animate-scale-in stagger-4">
        <CardHeader>
          <CardTitle>Top Merchants</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-3 w-full rounded-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (merchants.length === 0) {
    return (
      <Card className="animate-scale-in stagger-4">
        <CardHeader>
          <CardTitle>Top Merchants</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center text-muted-foreground text-sm">
            No merchants yet
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxTotal = Math.max(...merchants.map((m) => m.total));

  return (
    <Card className="animate-scale-in stagger-4">
      <CardHeader>
        <CardTitle>Top Merchants</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-5">
          {merchants.map((merchant, index) => (
            <div key={index} className="group">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-primary/8 flex items-center justify-center text-xs font-bold text-primary group-hover:bg-primary/12 transition-colors">
                    {index + 1}
                  </div>
                  <span className="text-sm font-semibold truncate max-w-[55%]">
                    {merchant.merchant}
                  </span>
                </div>
                <span className="text-sm font-medium tabular-nums">
                  {formatCurrency(merchant.total)}
                </span>
              </div>
              <div className="h-2.5 bg-primary/8 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${(merchant.total / maxTotal) * 100}%` }}
                />
              </div>
              <p className="text-[11px] text-muted-foreground/70 mt-1.5">
                {merchant.count} transaction{merchant.count !== 1 ? 's' : ''}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

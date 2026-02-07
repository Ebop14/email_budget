import { Skeleton } from '../ui/skeleton';
import { cn } from '../../lib/utils';

interface SummaryCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  isLoading?: boolean;
}

export function SummaryCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  isLoading,
}: SummaryCardProps) {
  if (isLoading) {
    return (
      <div className="rounded-2xl glass p-8 animate-scale-in">
        <Skeleton className="h-4 w-24 mb-4" />
        <Skeleton className="h-10 w-36" />
        <Skeleton className="h-3 w-20 mt-3" />
      </div>
    );
  }

  return (
    <div className={cn(
      'rounded-2xl glass p-8 transition-all duration-300 hover:shadow-lg group animate-scale-in',
      trend === 'up' && 'hover:glow-success',
      trend === 'down' && 'hover:glow-destructive',
      !trend && 'hover:glow-primary'
    )}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          {title}
        </p>
        {icon && (
          <div className="h-10 w-10 rounded-xl bg-primary/8 flex items-center justify-center text-primary group-hover:bg-primary/12 transition-colors">
            {icon}
          </div>
        )}
      </div>
      <p className={cn(
        'text-4xl font-bold tracking-tight',
        trend === 'up' && 'text-success',
        trend === 'down' && 'text-destructive'
      )}>
        {value}
      </p>
      {subtitle && (
        <p className="text-xs text-muted-foreground mt-2">{subtitle}</p>
      )}
    </div>
  );
}

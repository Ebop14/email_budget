import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import { formatCurrency } from '../../lib/format';
import type { CategorySpending } from '../../types';

interface CategoryChartProps {
  spending: CategorySpending[];
  isLoading?: boolean;
}

export function CategoryChart({ spending, isLoading }: CategoryChartProps) {
  if (isLoading) {
    return (
      <Card className="animate-scale-in stagger-3">
        <CardHeader>
          <CardTitle>Spending by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <Skeleton className="h-52 w-52 rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (spending.length === 0) {
    return (
      <Card className="animate-scale-in stagger-3">
        <CardHeader>
          <CardTitle>Spending by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center text-muted-foreground text-sm">
            No spending data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const data = spending.map((s) => ({
    name: s.category_name,
    value: s.total,
    color: s.category_color,
  }));

  const total = data.reduce((sum, d) => sum + d.value, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-strong rounded-xl px-4 py-3 shadow-lg">
          <p className="font-semibold text-sm">{payload[0].name}</p>
          <p className="text-sm text-muted-foreground">
            {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="animate-scale-in stagger-3">
      <CardHeader>
        <CardTitle>Spending by Category</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80 relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="45%"
                innerRadius={75}
                outerRadius={105}
                paddingAngle={3}
                dataKey="value"
                stroke="none"
                cornerRadius={4}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          {/* Center label */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ paddingBottom: '10%' }}>
            <div className="text-center">
              <p className="text-2xl font-bold">{formatCurrency(total)}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </div>
        </div>
        {/* Legend below chart */}
        <div className="flex flex-wrap gap-x-5 gap-y-2 mt-2 justify-center">
          {data.map((entry, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
              <span className="text-xs text-muted-foreground">{entry.name}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

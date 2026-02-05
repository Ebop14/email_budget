import { Search, X } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { CategoryPicker } from './CategoryPicker';
import type { Category, TransactionFilters as TFilters } from '../../types';
import { SUPPORTED_PROVIDERS } from '../../lib/constants';

interface TransactionFiltersProps {
  filters: TFilters;
  categories: Category[];
  onFiltersChange: (filters: Partial<TFilters>) => void;
  onClear: () => void;
}

export function TransactionFilters({
  filters,
  categories,
  onFiltersChange,
  onClear,
}: TransactionFiltersProps) {
  const hasActiveFilters =
    filters.search ||
    filters.categoryId ||
    filters.provider ||
    filters.startDate ||
    filters.endDate;

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search merchants..."
            value={filters.search || ''}
            onChange={(e) => onFiltersChange({ search: e.target.value })}
            className="pl-9"
          />
        </div>

        {/* Category Filter */}
        <div className="w-48">
          <CategoryPicker
            categories={[{ id: '', user_id: '', name: 'All Categories', icon: '', color: '#6b7280', is_system: true, created_at: '', updated_at: '' }, ...categories]}
            value={filters.categoryId || ''}
            onChange={(categoryId) => onFiltersChange({ categoryId: categoryId || null })}
            placeholder="All Categories"
          />
        </div>

        {/* Provider Filter */}
        <select
          value={filters.provider || ''}
          onChange={(e) => onFiltersChange({ provider: e.target.value || null })}
          className="h-9 w-36 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">All Providers</option>
          {SUPPORTED_PROVIDERS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onClear}>
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Date Range */}
      <div className="flex gap-2 items-center">
        <span className="text-sm text-muted-foreground">Date:</span>
        <Input
          type="date"
          value={filters.startDate || ''}
          onChange={(e) => onFiltersChange({ startDate: e.target.value || undefined })}
          className="w-36"
        />
        <span className="text-muted-foreground">to</span>
        <Input
          type="date"
          value={filters.endDate || ''}
          onChange={(e) => onFiltersChange({ endDate: e.target.value || undefined })}
          className="w-36"
        />
      </div>
    </div>
  );
}

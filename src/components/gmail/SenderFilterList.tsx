import { useState } from 'react';
import { Plus, Trash2, Mail } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { cn } from '../../lib/utils';
import type { SenderFilter } from '../../types';

interface SenderFilterListProps {
  filters: SenderFilter[];
  onAdd: (email: string, label: string) => Promise<void>;
  onRemove: (filterId: string) => Promise<void>;
  onToggle: (filterId: string) => Promise<void>;
}

export function SenderFilterList({
  filters,
  onAdd,
  onRemove,
  onToggle,
}: SenderFilterListProps) {
  const [newEmail, setNewEmail] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || !newLabel.trim()) return;
    await onAdd(newEmail.trim(), newLabel.trim());
    setNewEmail('');
    setNewLabel('');
    setIsAdding(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Sender Filters
        </CardTitle>
        <CardDescription>
          Choose which sender email addresses to monitor for receipts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {filters.map((filter) => (
          <div
            key={filter.id}
            className="flex items-center justify-between p-2 rounded-lg border"
          >
            <button
              onClick={() => onToggle(filter.id)}
              className="flex items-center gap-3 flex-1 text-left"
            >
              <div
                className={cn(
                  'w-3 h-3 rounded-full',
                  filter.enabled ? 'bg-green-500' : 'bg-muted-foreground/30'
                )}
              />
              <div>
                <p className={cn('text-sm font-medium', !filter.enabled && 'text-muted-foreground')}>
                  {filter.label}
                </p>
                <p className="text-xs text-muted-foreground">{filter.email}</p>
              </div>
            </button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemove(filter.id)}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}

        {isAdding ? (
          <form onSubmit={handleAdd} className="flex gap-2 pt-2">
            <Input
              placeholder="Label (e.g. Grubhub)"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              className="flex-1"
            />
            <Input
              placeholder="sender@example.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" size="sm" disabled={!newEmail.trim() || !newLabel.trim()}>
              Add
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAdding(false)}>
              Cancel
            </Button>
          </form>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAdding(true)}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Sender
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

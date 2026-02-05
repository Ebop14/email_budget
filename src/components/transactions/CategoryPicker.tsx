import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import type { Category } from '../../types';
import { cn } from '../../lib/utils';

interface CategoryPickerProps {
  categories: Category[];
  value?: string;
  onChange: (categoryId: string) => void;
  placeholder?: string;
}

export function CategoryPicker({
  categories,
  value,
  onChange,
  placeholder = 'Select category',
}: CategoryPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedCategory = categories.find((c) => c.id === value);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center justify-between w-full px-3 py-2 rounded-md border text-sm',
          'bg-background hover:bg-accent transition-colors',
          isOpen && 'ring-1 ring-ring'
        )}
      >
        {selectedCategory ? (
          <span className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: selectedCategory.color }}
            />
            {selectedCategory.name}
          </span>
        ) : (
          <span className="text-muted-foreground">{placeholder}</span>
        )}
        <ChevronDown className={cn(
          'h-4 w-4 text-muted-foreground transition-transform',
          isOpen && 'rotate-180'
        )} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 py-1 bg-popover border rounded-md shadow-md max-h-60 overflow-y-auto">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => {
                onChange(category.id);
                setIsOpen(false);
              }}
              className={cn(
                'flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent transition-colors',
                value === category.id && 'bg-accent'
              )}
            >
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: category.color }}
              />
              <span className="flex-1 text-left">{category.name}</span>
              {value === category.id && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

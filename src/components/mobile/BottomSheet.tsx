import { useEffect, useRef, useState, useCallback } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  snapPoints?: number[]; // percentages of viewport height, e.g. [50, 90]
}

export function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
  snapPoints = [60],
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentTranslate = useRef(0);
  const [translate, setTranslate] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const maxHeight = snapPoints[snapPoints.length - 1];

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setTranslate(0);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
    currentTranslate.current = 0;
    setIsDragging(true);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const diff = e.touches[0].clientY - startY.current;
    if (diff > 0) {
      currentTranslate.current = diff;
      setTranslate(diff);
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    if (currentTranslate.current > 100) {
      onClose();
    } else {
      setTranslate(0);
    }
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className={cn(
          'absolute bottom-0 left-0 right-0 bg-card rounded-t-2xl',
          !isDragging && 'transition-transform duration-200 ease-out',
          isOpen ? 'animate-slide-up' : ''
        )}
        style={{
          maxHeight: `${maxHeight}vh`,
          transform: `translateY(${translate}px)`,
        }}
      >
        {/* Drag handle */}
        <div
          className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-4 pb-3 border-b border-border">
            <h2 className="text-base font-semibold">{title}</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-muted"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="overflow-auto mobile-scroll" style={{ maxHeight: `calc(${maxHeight}vh - 80px)` }}>
          {children}
        </div>
      </div>
    </div>
  );
}

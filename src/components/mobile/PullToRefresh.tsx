import { useState, useRef, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { cn } from '../../lib/utils';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  className?: string;
}

export function PullToRefresh({ onRefresh, children, className }: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const threshold = 80;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (scrollRef.current && scrollRef.current.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (isRefreshing) return;
    if (!scrollRef.current || scrollRef.current.scrollTop > 0) return;

    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;

    if (diff > 0) {
      // Dampen the pull distance
      setPullDistance(Math.min(diff * 0.4, 120));
    }
  }, [isRefreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(50); // Keep indicator visible during refresh
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, isRefreshing, onRefresh]);

  return (
    <div className={cn('relative flex-1 overflow-hidden', className)}>
      {/* Pull indicator */}
      <div
        className="absolute left-0 right-0 flex justify-center z-10 transition-transform"
        style={{ transform: `translateY(${pullDistance - 40}px)` }}
      >
        <div
          className={cn(
            'w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center',
            isRefreshing && 'pull-spinner'
          )}
        >
          <RefreshCw
            className={cn('h-4 w-4 text-primary transition-transform', {
              'pull-spinner': isRefreshing,
            })}
            style={
              !isRefreshing
                ? { transform: `rotate(${Math.min(pullDistance / threshold, 1) * 360}deg)` }
                : undefined
            }
          />
        </div>
      </div>

      <div
        ref={scrollRef}
        className="h-full overflow-auto mobile-scroll"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translateY(${isRefreshing ? 10 : pullDistance > 0 ? pullDistance * 0.3 : 0}px)`,
          transition: pullDistance === 0 ? 'transform 0.2s ease' : 'none',
        }}
      >
        {children}
      </div>
    </div>
  );
}

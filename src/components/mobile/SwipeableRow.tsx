import { useSwipeAction } from '../../hooks/useSwipeAction';
import { cn } from '../../lib/utils';

interface SwipeableRowProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  leftContent?: React.ReactNode;
  rightContent?: React.ReactNode;
  className?: string;
}

export function SwipeableRow({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftContent,
  rightContent,
  className,
}: SwipeableRowProps) {
  const { offsetX, isSwiping, handlers } = useSwipeAction({
    onSwipeLeft,
    onSwipeRight,
  });

  return (
    <div className={cn('relative overflow-hidden', className)} {...handlers}>
      {/* Left action (revealed when swiping right) */}
      {leftContent && (
        <div className="absolute inset-y-0 left-0 flex items-center">
          {leftContent}
        </div>
      )}

      {/* Right action (revealed when swiping left) */}
      {rightContent && (
        <div className="absolute inset-y-0 right-0 flex items-center">
          {rightContent}
        </div>
      )}

      {/* Main content */}
      <div
        className="relative bg-card"
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: isSwiping ? 'none' : 'transform 0.2s ease-out',
        }}
      >
        {children}
      </div>
    </div>
  );
}

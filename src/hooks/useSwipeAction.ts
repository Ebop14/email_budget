import { useState, useRef, useCallback } from 'react';

interface SwipeState {
  offsetX: number;
  isSwiping: boolean;
  direction: 'left' | 'right' | null;
  isRevealed: boolean;
}

interface UseSwipeActionOptions {
  threshold?: number;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}

export function useSwipeAction({
  threshold = 60,
  onSwipeLeft,
  onSwipeRight,
}: UseSwipeActionOptions = {}) {
  const [state, setState] = useState<SwipeState>({
    offsetX: 0,
    isSwiping: false,
    direction: null,
    isRevealed: false,
  });

  const startX = useRef(0);
  const startY = useRef(0);
  const isTracking = useRef(false);
  const isHorizontal = useRef<boolean | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    isTracking.current = true;
    isHorizontal.current = null;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isTracking.current) return;

    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = currentX - startX.current;
    const diffY = currentY - startY.current;

    // Determine direction lock on first significant movement
    if (isHorizontal.current === null) {
      if (Math.abs(diffX) > 5 || Math.abs(diffY) > 5) {
        isHorizontal.current = Math.abs(diffX) > Math.abs(diffY);
      }
      return;
    }

    if (!isHorizontal.current) {
      isTracking.current = false;
      return;
    }

    // Clamp the offset
    const maxOffset = 120;
    const clampedOffset = Math.max(-maxOffset, Math.min(maxOffset, diffX));

    // Only allow left swipe if handler exists, same for right
    if (clampedOffset < 0 && !onSwipeLeft) return;
    if (clampedOffset > 0 && !onSwipeRight) return;

    setState({
      offsetX: clampedOffset,
      isSwiping: true,
      direction: clampedOffset < 0 ? 'left' : clampedOffset > 0 ? 'right' : null,
      isRevealed: Math.abs(clampedOffset) >= threshold,
    });
  }, [threshold, onSwipeLeft, onSwipeRight]);

  const handleTouchEnd = useCallback(() => {
    isTracking.current = false;

    if (state.isRevealed) {
      if (state.direction === 'left' && onSwipeLeft) {
        onSwipeLeft();
      } else if (state.direction === 'right' && onSwipeRight) {
        onSwipeRight();
      }
    }

    setState({
      offsetX: 0,
      isSwiping: false,
      direction: null,
      isRevealed: false,
    });
  }, [state.isRevealed, state.direction, onSwipeLeft, onSwipeRight]);

  const reset = useCallback(() => {
    setState({
      offsetX: 0,
      isSwiping: false,
      direction: null,
      isRevealed: false,
    });
  }, []);

  return {
    ...state,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
    reset,
  };
}

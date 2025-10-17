'use client';

import { useRef, useState, useCallback, useEffect } from 'react';

export interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

export interface SwipeConfig {
  threshold?: number;
  velocityThreshold?: number;
  preventScroll?: boolean;
}

export interface SwipeState {
  isSwiping: boolean;
  swipeDirection: 'left' | 'right' | 'up' | 'down' | null;
  swipeDistance: number;
  swipePercentage: number;
}

export function useSwipe(handlers: SwipeHandlers, config: SwipeConfig = {}) {
  const {
    threshold = 100,
    velocityThreshold = 0.3,
    preventScroll = false
  } = config;

  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const touchEndY = useRef<number>(0);
  const touchStartTime = useRef<number>(0);
  const containerWidth = useRef<number>(0);

  const [swipeState, setSwipeState] = useState<SwipeState>({
    isSwiping: false,
    swipeDirection: null,
    swipeDistance: 0,
    swipePercentage: 0
  });

  const resetSwipeState = useCallback(() => {
    setSwipeState({
      isSwiping: false,
      swipeDirection: null,
      swipeDistance: 0,
      swipePercentage: 0
    });
  }, []);

  const handleTouchStart = useCallback((e: TouchEvent | React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchStartTime.current = Date.now();
    
    const target = e.currentTarget as HTMLElement;
    containerWidth.current = target.offsetWidth;

    setSwipeState(prev => ({
      ...prev,
      isSwiping: true
    }));

    if (preventScroll) {
      e.preventDefault();
    }
  }, [preventScroll]);

  const handleTouchMove = useCallback((e: TouchEvent | React.TouchEvent) => {
    if (!swipeState.isSwiping) return;

    touchEndX.current = e.touches[0].clientX;
    touchEndY.current = e.touches[0].clientY;

    const diffX = touchEndX.current - touchStartX.current;
    const diffY = touchEndY.current - touchStartY.current;
    
    const absDiffX = Math.abs(diffX);
    const absDiffY = Math.abs(diffY);

    let direction: 'left' | 'right' | 'up' | 'down' | null = null;

    if (absDiffX > absDiffY && absDiffX > 10) {
      direction = diffX > 0 ? 'right' : 'left';
      if (preventScroll) {
        e.preventDefault();
      }
    } else if (absDiffY > absDiffX && absDiffY > 10) {
      direction = diffY > 0 ? 'down' : 'up';
    }

    const distance = direction === 'left' || direction === 'right' ? absDiffX : absDiffY;
    const percentage = containerWidth.current > 0 
      ? Math.min((distance / containerWidth.current) * 100, 100)
      : 0;

    setSwipeState({
      isSwiping: true,
      swipeDirection: direction,
      swipeDistance: distance,
      swipePercentage: percentage
    });
  }, [swipeState.isSwiping, preventScroll]);

  const handleTouchEnd = useCallback(() => {
    if (!swipeState.isSwiping) return;

    const diffX = touchEndX.current - touchStartX.current;
    const diffY = touchEndY.current - touchStartY.current;
    const timeDiff = (Date.now() - touchStartTime.current) / 1000;
    
    const absDiffX = Math.abs(diffX);
    const absDiffY = Math.abs(diffY);
    
    const velocityX = absDiffX / timeDiff;
    const velocityY = absDiffY / timeDiff;

    if (absDiffX > absDiffY) {
      if (absDiffX > threshold || velocityX > velocityThreshold) {
        if (diffX > 0 && handlers.onSwipeRight) {
          handlers.onSwipeRight();
        } else if (diffX < 0 && handlers.onSwipeLeft) {
          handlers.onSwipeLeft();
        }
      }
    } else {
      if (absDiffY > threshold || velocityY > velocityThreshold) {
        if (diffY > 0 && handlers.onSwipeDown) {
          handlers.onSwipeDown();
        } else if (diffY < 0 && handlers.onSwipeUp) {
          handlers.onSwipeUp();
        }
      }
    }

    resetSwipeState();
  }, [swipeState.isSwiping, threshold, velocityThreshold, handlers, resetSwipeState]);

  const swipeHandlers = {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd
  };

  return {
    swipeHandlers,
    swipeState,
    resetSwipeState
  };
}

export function useMouseSwipe(handlers: SwipeHandlers, config: SwipeConfig = {}) {
  const {
    threshold = 100,
    velocityThreshold = 0.3
  } = config;

  const mouseStartX = useRef<number>(0);
  const mouseStartY = useRef<number>(0);
  const mouseEndX = useRef<number>(0);
  const mouseEndY = useRef<number>(0);
  const mouseStartTime = useRef<number>(0);
  const isDragging = useRef<boolean>(false);
  const containerWidth = useRef<number>(0);

  const [swipeState, setSwipeState] = useState<SwipeState>({
    isSwiping: false,
    swipeDirection: null,
    swipeDistance: 0,
    swipePercentage: 0
  });

  const resetSwipeState = useCallback(() => {
    setSwipeState({
      isSwiping: false,
      swipeDirection: null,
      swipeDistance: 0,
      swipePercentage: 0
    });
  }, []);

  const handleMouseDown = useCallback((e: MouseEvent | React.MouseEvent) => {
    isDragging.current = true;
    mouseStartX.current = e.clientX;
    mouseStartY.current = e.clientY;
    mouseStartTime.current = Date.now();

    const target = e.currentTarget as HTMLElement;
    containerWidth.current = target.offsetWidth;

    setSwipeState(prev => ({
      ...prev,
      isSwiping: true
    }));
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent | React.MouseEvent) => {
    if (!isDragging.current) return;

    mouseEndX.current = e.clientX;
    mouseEndY.current = e.clientY;

    const diffX = mouseEndX.current - mouseStartX.current;
    const diffY = mouseEndY.current - mouseStartY.current;
    
    const absDiffX = Math.abs(diffX);
    const absDiffY = Math.abs(diffY);

    let direction: 'left' | 'right' | 'up' | 'down' | null = null;

    if (absDiffX > absDiffY && absDiffX > 10) {
      direction = diffX > 0 ? 'right' : 'left';
    } else if (absDiffY > absDiffX && absDiffY > 10) {
      direction = diffY > 0 ? 'down' : 'up';
    }

    const distance = direction === 'left' || direction === 'right' ? absDiffX : absDiffY;
    const percentage = containerWidth.current > 0 
      ? Math.min((distance / containerWidth.current) * 100, 100)
      : 0;

    setSwipeState({
      isSwiping: true,
      swipeDirection: direction,
      swipeDistance: distance,
      swipePercentage: percentage
    });
  }, []);

  const handleMouseUp = useCallback(() => {
    if (!isDragging.current) return;

    isDragging.current = false;

    const diffX = mouseEndX.current - mouseStartX.current;
    const diffY = mouseEndY.current - mouseStartY.current;
    const timeDiff = (Date.now() - mouseStartTime.current) / 1000;
    
    const absDiffX = Math.abs(diffX);
    const absDiffY = Math.abs(diffY);
    
    const velocityX = absDiffX / timeDiff;
    const velocityY = absDiffY / timeDiff;

    if (absDiffX > absDiffY) {
      if (absDiffX > threshold || velocityX > velocityThreshold) {
        if (diffX > 0 && handlers.onSwipeRight) {
          handlers.onSwipeRight();
        } else if (diffX < 0 && handlers.onSwipeLeft) {
          handlers.onSwipeLeft();
        }
      }
    } else {
      if (absDiffY > threshold || velocityY > velocityThreshold) {
        if (diffY > 0 && handlers.onSwipeDown) {
          handlers.onSwipeDown();
        } else if (diffY < 0 && handlers.onSwipeUp) {
          handlers.onSwipeUp();
        }
      }
    }

    resetSwipeState();
  }, [threshold, velocityThreshold, handlers, resetSwipeState]);

  const swipeHandlers = {
    onMouseDown: handleMouseDown,
    onMouseMove: handleMouseMove,
    onMouseUp: handleMouseUp
  };

  return {
    swipeHandlers,
    swipeState,
    resetSwipeState
  };
}

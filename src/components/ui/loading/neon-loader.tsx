'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface NeonLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export function NeonLoader({ 
  size = 'md',
  text,
  className 
}: NeonLoaderProps) {
  const loaderClass = size === 'sm' ? 'loader-sm' : 'loader';
  
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <div className={loaderClass}></div>
      
      {text && (
        <p className="text-sm font-medium text-muted-foreground">
          {text}
        </p>
      )}
    </div>
  );
}

// Simple loading bar variant using CSS loader
export function NeonLoadingBar({ className }: { className?: string }) {
  return (
    <div className={cn('flex justify-center', className)}>
      <div className="loader-sm"></div>
    </div>
  );
}

// Dots loader variant using CSS loader
export function NeonDots({ className }: { className?: string }) {
  return (
    <div className={cn('flex justify-center', className)}>
      <div className="loader-sm"></div>
    </div>
  );
}

'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface NeonSkeletonProps {
  className?: string;
  variant?: 'default' | 'card' | 'text' | 'circle' | 'avatar';
  lines?: number;
  animate?: boolean;
}

export function NeonSkeleton({ 
  className,
  variant = 'default',
  lines = 1,
  animate = true
}: NeonSkeletonProps) {
  const baseClasses = cn(
    'bg-gradient-to-r from-muted/40 via-muted/60 to-muted/40 rounded-md',
    animate && 'animate-neon-shimmer bg-[length:200%_100%]',
    className
  );

  if (variant === 'text') {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(
              baseClasses,
              'h-4',
              i === lines - 1 && lines > 1 && 'w-3/4'
            )}
            style={{ animationDelay: `${i * 100}ms` }}
          />
        ))}
      </div>
    );
  }

  if (variant === 'circle' || variant === 'avatar') {
    const size = variant === 'avatar' ? 'w-10 h-10' : 'w-12 h-12';
    return (
      <div className={cn(baseClasses, 'rounded-full', size, className)} />
    );
  }

  if (variant === 'card') {
    return (
      <div className={cn('rounded-lg border border-muted/20 p-4 space-y-3', className)}>
        <div className={cn(baseClasses, 'h-5 w-3/4')} />
        <div className={cn(baseClasses, 'h-4 w-full')} style={{ animationDelay: '100ms' }} />
        <div className={cn(baseClasses, 'h-4 w-5/6')} style={{ animationDelay: '200ms' }} />
      </div>
    );
  }

  return <div className={baseClasses} />;
}

// Lead card skeleton with AI summary placeholder
export function NeonLeadCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-xl border border-primary/10 bg-card/50 backdrop-blur-sm p-4 space-y-4', className)}>
      {/* Header */}
      <div className="flex items-start gap-3">
        <NeonSkeleton variant="avatar" className="flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <NeonSkeleton className="h-5 w-3/4" />
          <NeonSkeleton className="h-4 w-1/2" />
        </div>
      </div>
      
      {/* AI Summary Section */}
      <div className="space-y-2 p-3 rounded-lg bg-gradient-to-br from-primary/5 to-accent-purple/5 border border-primary/10">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 animate-neon-pulse" />
          <NeonSkeleton className="h-3 w-20" />
        </div>
        <NeonSkeleton variant="text" lines={2} />
      </div>
      
      {/* Action buttons */}
      <div className="flex gap-2">
        <NeonSkeleton className="h-9 flex-1 rounded-lg" />
        <NeonSkeleton className="h-9 w-20 rounded-lg" />
      </div>
    </div>
  );
}

// Dashboard stats card skeleton
export function NeonStatsCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-xl border border-primary/10 bg-card/50 backdrop-blur-sm p-6 space-y-4', className)}>
      <div className="flex items-center justify-between">
        <NeonSkeleton className="h-4 w-24" />
        <NeonSkeleton variant="circle" className="w-8 h-8" />
      </div>
      <NeonSkeleton className="h-8 w-20" />
      <div className="flex items-center gap-2">
        <NeonSkeleton className="h-3 w-16" />
        <NeonSkeleton className="h-3 w-12" />
      </div>
    </div>
  );
}

// Analytics chart skeleton
export function NeonChartSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-xl border border-primary/10 bg-card/50 backdrop-blur-sm p-6 space-y-4', className)}>
      <div className="flex items-center justify-between">
        <NeonSkeleton className="h-6 w-32" />
        <NeonSkeleton className="h-8 w-24 rounded-lg" />
      </div>
      
      {/* Chart bars placeholder */}
      <div className="flex items-end gap-2 h-48">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'flex-1 bg-gradient-to-t from-primary/20 via-accent-cyan/10 to-transparent rounded-t-md animate-neon-shimmer'
            )}
            style={{
              height: `${Math.random() * 60 + 40}%`,
              animationDelay: `${i * 100}ms`
            }}
          />
        ))}
      </div>
      
      {/* Legend */}
      <div className="flex gap-4">
        <div className="flex items-center gap-2">
          <NeonSkeleton className="w-3 h-3 rounded-sm" />
          <NeonSkeleton className="h-3 w-16" />
        </div>
        <div className="flex items-center gap-2">
          <NeonSkeleton className="w-3 h-3 rounded-sm" />
          <NeonSkeleton className="h-3 w-16" />
        </div>
      </div>
    </div>
  );
}

// Conversation list skeleton
export function NeonConversationSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex items-start gap-3 p-3 rounded-lg border border-muted/10 bg-card/30 backdrop-blur-sm"
        >
          <NeonSkeleton variant="avatar" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <NeonSkeleton className="h-4 w-24" />
              <NeonSkeleton className="h-3 w-16" />
            </div>
            <NeonSkeleton className="h-3 w-full" />
            <NeonSkeleton className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

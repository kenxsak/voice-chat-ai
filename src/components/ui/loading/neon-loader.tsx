'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface NeonLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'cyber' | 'pulse' | 'orbit';
  text?: string;
  className?: string;
}

export function NeonLoader({ 
  size = 'md', 
  variant = 'cyber',
  text,
  className 
}: NeonLoaderProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  if (variant === 'cyber') {
    return (
      <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
        <div className={cn('relative', sizeClasses[size])}>
          {/* Outer rotating ring with neon glow */}
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-cyan-400 border-r-purple-500 animate-neon-spin" />
          
          {/* Middle ring with reverse rotation */}
          <div className="absolute inset-[15%] rounded-full border-2 border-transparent border-b-pink-500 border-l-cyan-400 animate-neon-spin-reverse" />
          
          {/* Inner glowing core */}
          <div className="absolute inset-[30%] rounded-full bg-gradient-to-br from-cyan-400 via-purple-500 to-pink-500 animate-neon-pulse shadow-neon-core" />
        </div>
        
        {text && (
          <p className={cn(
            'font-medium bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent animate-neon-text-pulse',
            textSizeClasses[size]
          )}>
            {text}
          </p>
        )}
      </div>
    );
  }

  if (variant === 'pulse') {
    return (
      <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
        <div className={cn('relative', sizeClasses[size])}>
          {/* Pulsing rings */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 animate-neon-pulse opacity-50" />
          <div className="absolute inset-[10%] rounded-full bg-gradient-to-br from-purple-500 to-pink-500 animate-neon-pulse-delayed opacity-70" />
          <div className="absolute inset-[20%] rounded-full bg-gradient-to-br from-cyan-400 to-pink-500 animate-neon-pulse shadow-neon-strong" />
        </div>
        
        {text && (
          <p className={cn(
            'font-medium bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent',
            textSizeClasses[size]
          )}>
            {text}
          </p>
        )}
      </div>
    );
  }

  // orbit variant
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <div className={cn('relative', sizeClasses[size])}>
        {/* Central core */}
        <div className="absolute inset-[35%] rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 shadow-neon-core" />
        
        {/* Orbiting particles */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/2 w-2 h-2 -ml-1 rounded-full bg-cyan-400 shadow-neon-particle animate-neon-orbit-1" />
          <div className="absolute top-0 left-1/2 w-2 h-2 -ml-1 rounded-full bg-purple-500 shadow-neon-particle animate-neon-orbit-2" />
          <div className="absolute top-0 left-1/2 w-2 h-2 -ml-1 rounded-full bg-pink-500 shadow-neon-particle animate-neon-orbit-3" />
        </div>
      </div>
      
      {text && (
        <p className={cn(
          'font-medium bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent',
          textSizeClasses[size]
        )}>
          {text}
        </p>
      )}
    </div>
  );
}

// Minimal loading bar variant
export function NeonLoadingBar({ className }: { className?: string }) {
  return (
    <div className={cn('w-full h-1 bg-muted/20 rounded-full overflow-hidden', className)}>
      <div className="h-full bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 animate-neon-slide shadow-neon-bar" />
    </div>
  );
}

// Dots loader variant
export function NeonDots({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-neon-particle animate-neon-dot-bounce" style={{ animationDelay: '0ms' }} />
      <div className="w-2 h-2 rounded-full bg-purple-500 shadow-neon-particle animate-neon-dot-bounce" style={{ animationDelay: '150ms' }} />
      <div className="w-2 h-2 rounded-full bg-pink-500 shadow-neon-particle animate-neon-dot-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  );
}

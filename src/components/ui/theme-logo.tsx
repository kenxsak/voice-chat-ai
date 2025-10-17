'use client';

import Image from 'next/image';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

interface ThemeLogoProps {
  size?: number;
  width?: number;
  height?: number;
  className?: string;
  animate?: boolean;
  glowIntensity?: 'low' | 'medium' | 'high';
}

export function ThemeLogo({ 
  size = 80, 
  width, 
  height,
  className = '',
  animate = true,
  glowIntensity = 'medium'
}: ThemeLogoProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  const finalWidth = width || size;
  const finalHeight = height || size;
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  const isDark = mounted ? resolvedTheme === 'dark' : true;
  
  // Optimized glow effects - reduced blur for better performance
  const glowStylesDark = {
    low: 'drop-shadow(0 0 12px rgba(0,255,255,0.5)) drop-shadow(0 2px 6px rgba(0,0,0,0.3))',
    medium: 'drop-shadow(0 0 18px rgba(0,255,255,0.6)) drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
    high: 'drop-shadow(0 0 24px rgba(0,255,255,0.7)) drop-shadow(0 6px 12px rgba(0,0,0,0.4))'
  };

  const glowStylesLight = {
    low: 'drop-shadow(0 0 10px rgba(178,75,243,0.4)) drop-shadow(0 2px 6px rgba(0,0,0,0.2))',
    medium: 'drop-shadow(0 0 15px rgba(178,75,243,0.5)) drop-shadow(0 4px 8px rgba(0,0,0,0.25))',
    high: 'drop-shadow(0 0 20px rgba(178,75,243,0.6)) drop-shadow(0 6px 10px rgba(0,0,0,0.3))'
  };
  
  const filterValue = isDark ? glowStylesDark[glowIntensity] : glowStylesLight[glowIntensity];
  
  return (
    <div className={cn("relative inline-flex items-center justify-center group", className)} style={{
      width: finalWidth,
      height: finalHeight
    }}>
      {/* Gradient background circle for light mode - makes white logo visible */}
      {!isDark && (
        <div className="absolute rounded-full bg-gradient-to-br from-cyan-400 via-purple-500 to-pink-500 opacity-100" 
             style={{ 
               width: finalWidth, 
               height: finalHeight,
               left: '50%',
               top: '50%',
               transform: 'translate(-50%, -50%)'
             }} 
        />
      )}
      
      {/* Optimized glow effect - single layer for better performance */}
      <div className={cn(
        "absolute rounded-full opacity-30 blur-xl",
        isDark 
          ? "bg-gradient-to-r from-cyan-400/40 via-purple-500/40 to-pink-400/40" 
          : "bg-gradient-to-r from-cyan-300/30 via-purple-400/30 to-pink-300/30"
      )} style={{ 
        width: finalWidth * 1.3, 
        height: finalHeight * 1.3,
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        animation: animate ? 'pulse 3s ease-in-out infinite' : 'none'
      }} />
      
      {/* Logo image with 3D transform - centered */}
      <div className="relative z-10" style={{
        transform: animate ? 'perspective(1000px) rotateX(5deg)' : 'none',
        transition: 'transform 0.3s ease',
        width: finalWidth,
        height: finalHeight
      }}>
        <Image 
          src="/logo.png" 
          alt="Voice Chat AI" 
          width={finalWidth} 
          height={finalHeight} 
          className={cn(
            "object-contain transition-all duration-500 relative z-10",
            animate && "group-hover:scale-110 group-hover:rotate-3"
          )}
          style={{
            filter: filterValue,
            transform: 'translateZ(20px)',
            width: finalWidth,
            height: finalHeight
          }}
        />
      </div>
      
      {/* Optimized hover glow - reduced blur for better performance */}
      {animate && (
        <div className={cn(
          "absolute rounded-full opacity-0 group-hover:opacity-40 transition-opacity duration-300 pointer-events-none blur-xl",
          "bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500"
        )} style={{
          width: finalWidth * 1.4,
          height: finalHeight * 1.4,
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)'
        }} />
      )}
    </div>
  );
}

export function AnimatedLogo({ 
  size = 80,
  width,
  height, 
  className = '',
  withRipple = true,
  glowIntensity = 'high'
}: ThemeLogoProps & { withRipple?: boolean }) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  const finalWidth = width || size;
  const finalHeight = height || size;
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  const isDark = mounted ? resolvedTheme === 'dark' : true;
  
  return (
    <div className={cn("relative inline-flex items-center justify-center group", className)} style={{ 
      perspective: '1000px',
      width: finalWidth,
      height: finalHeight
    }}>
      {/* Optimized glow effect - single layer for better performance */}
      {withRipple && (
        <div 
          className={cn(
            "absolute rounded-full blur-xl pointer-events-none opacity-50",
            isDark 
              ? "bg-gradient-to-r from-cyan-400/40 via-purple-500/50 to-pink-400/40" 
              : "bg-gradient-to-r from-cyan-300/30 via-purple-400/40 to-pink-300/30"
          )} 
          style={{ 
            width: finalWidth * 1.5,
            height: finalHeight * 1.5,
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            animation: 'magicalGlow 3s ease-in-out infinite'
          }} 
        />
      )}
      
      <ThemeLogo 
        width={finalWidth} 
        height={finalHeight}
        animate={true}
        glowIntensity={glowIntensity}
        className="relative z-10"
      />
    </div>
  );
}

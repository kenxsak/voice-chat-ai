'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ThemePreset = 'default' | 'cyber-purple' | 'neon-green' | 'y2k-pink';

interface PresetConfig {
  id: ThemePreset;
  name: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  cssVars: {
    [key: string]: string;
  };
}

const THEME_PRESETS: PresetConfig[] = [
  {
    id: 'default',
    name: 'Cyber Fusion',
    description: 'Balanced mix of cyan, purple, and pink',
    colors: {
      primary: '#00FFFF',
      secondary: '#A259FF',
      accent: '#FF10F0'
    },
    cssVars: {
      '--primary': '180 100% 50%', // Cyan
      '--primary-foreground': '0 0% 0%',
      '--neon-cyan': '#00FFFF',
      '--neon-purple': '#A259FF',
      '--neon-pink': '#FF10F0'
    }
  },
  {
    id: 'cyber-purple',
    name: 'Cyber Purple',
    description: 'Deep purple vibes with electric accents',
    colors: {
      primary: '#A259FF',
      secondary: '#8B3FFF',
      accent: '#B47EFF'
    },
    cssVars: {
      '--primary': '266 100% 62%', // Purple
      '--primary-foreground': '0 0% 100%',
      '--neon-cyan': '#A259FF',
      '--neon-purple': '#8B3FFF',
      '--neon-pink': '#B47EFF'
    }
  },
  {
    id: 'neon-green',
    name: 'Acid Matrix',
    description: 'Matrix-inspired neon green theme',
    colors: {
      primary: '#CCFF00',
      secondary: '#9AFF00',
      accent: '#76FF03'
    },
    cssVars: {
      '--primary': '76 100% 50%', // Neon Green
      '--primary-foreground': '0 0% 0%',
      '--neon-cyan': '#CCFF00',
      '--neon-purple': '#9AFF00',
      '--neon-pink': '#76FF03'
    }
  },
  {
    id: 'y2k-pink',
    name: 'Y2K Pink',
    description: 'Nostalgic Y2K hot pink aesthetic',
    colors: {
      primary: '#FF10F0',
      secondary: '#FF69B4',
      accent: '#FFB3E6'
    },
    cssVars: {
      '--primary': '305 100% 53%', // Hot Pink
      '--primary-foreground': '0 0% 100%',
      '--neon-cyan': '#FF10F0',
      '--neon-purple': '#FF69B4',
      '--neon-pink': '#FFB3E6'
    }
  }
];

export function ThemePresets() {
  const [activePreset, setActivePreset] = useState<ThemePreset>('default');

  const applyPreset = (preset: PresetConfig) => {
    // Apply CSS variables to root
    const root = document.documentElement;
    
    Object.entries(preset.cssVars).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });

    // Save to localStorage
    localStorage.setItem('theme-preset', preset.id);
    setActivePreset(preset.id);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-1">Theme Presets</h3>
        <p className="text-sm text-muted-foreground">
          Choose your favorite neon aesthetic
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {THEME_PRESETS.map((preset) => (
          <button
            key={preset.id}
            onClick={() => applyPreset(preset)}
            className={cn(
              "relative group p-4 rounded-lg border-2 transition-all duration-300",
              "hover:scale-105 hover:shadow-lg",
              activePreset === preset.id
                ? "border-primary bg-primary/10 shadow-[0_0_20px_rgba(0,255,255,0.3)]"
                : "border-muted hover:border-primary/50 bg-card"
            )}
          >
            {/* Check icon for active preset */}
            {activePreset === preset.id && (
              <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                <Check className="w-4 h-4 text-primary-foreground" />
              </div>
            )}

            {/* Color preview */}
            <div className="flex gap-2 mb-3">
              <div
                className="w-8 h-8 rounded-full shadow-lg"
                style={{
                  backgroundColor: preset.colors.primary,
                  boxShadow: `0 0 20px ${preset.colors.primary}50`
                }}
              />
              <div
                className="w-8 h-8 rounded-full shadow-lg"
                style={{
                  backgroundColor: preset.colors.secondary,
                  boxShadow: `0 0 20px ${preset.colors.secondary}50`
                }}
              />
              <div
                className="w-8 h-8 rounded-full shadow-lg"
                style={{
                  backgroundColor: preset.colors.accent,
                  boxShadow: `0 0 20px ${preset.colors.accent}50`
                }}
              />
            </div>

            {/* Preset info */}
            <div className="text-left">
              <h4 className="font-semibold mb-1">{preset.name}</h4>
              <p className="text-xs text-muted-foreground">
                {preset.description}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// Hook to load preset on mount
export function useThemePreset() {
  useState(() => {
    if (typeof window === 'undefined') return;
    
    const savedPreset = localStorage.getItem('theme-preset') as ThemePreset | null;
    if (savedPreset) {
      const preset = THEME_PRESETS.find(p => p.id === savedPreset);
      if (preset) {
        const root = document.documentElement;
        Object.entries(preset.cssVars).forEach(([key, value]) => {
          root.style.setProperty(key, value);
        });
      }
    }
  });
}

'use client';

import { useEffect, useState } from 'react';
import { sounds } from '@/lib/sounds';

/**
 * Hook to use sound effects in components
 */
export function useSounds() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(sounds.isEnabled());
  }, []);

  const toggleSounds = () => {
    const newState = !enabled;
    sounds.setEnabled(newState);
    setEnabled(newState);
    
    // Play toggle sound
    if (newState) {
      sounds.toggle();
    }
  };

  return {
    enabled,
    toggleSounds,
    click: sounds.click.bind(sounds),
    success: sounds.success.bind(sounds),
    error: sounds.error.bind(sounds),
    notify: sounds.notify.bind(sounds),
    hover: sounds.hover.bind(sounds),
    toggle: sounds.toggle.bind(sounds),
    whoosh: sounds.whoosh.bind(sounds),
    confetti: sounds.confetti.bind(sounds),
  };
}

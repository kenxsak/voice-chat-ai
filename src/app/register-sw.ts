'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const registerSW = async () => {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/',
          });
          
          console.log('ServiceWorker registration successful with scope:', registration.scope);
          
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('New service worker available, page will reload on next visit');
                }
              });
            }
          });
        } catch (error) {
          console.error('ServiceWorker registration failed:', error);
        }
      };

      registerSW();
    }
  }, []);

  return null;
}

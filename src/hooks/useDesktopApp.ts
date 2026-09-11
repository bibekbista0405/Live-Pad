import { useState, useEffect } from 'react';
import { Platform } from '../platform';

export function useDesktopApp() {
  const [isDesktopApp, setIsDesktopApp] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                         (window.navigator as any).standalone === true;
    const params = new URLSearchParams(window.location.search);
    const isDesktopParam = params.get('desktop') === 'true' || params.get('pwa') === 'true';
    return Platform.isElectron || Platform.isPWA || isStandalone || isDesktopParam;
  });

  const [showSplash, setShowSplash] = useState<boolean>(false);

  const [desktopTab, setDesktopTab] = useState<
    'dashboard' | 'recent' | 'templates' | 'offline' | 'storage' | 'extensions' | 'settings'
  >('dashboard');

  useEffect(() => {
    const checkDesktop = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                           (window.navigator as any).standalone === true;
      const params = new URLSearchParams(window.location.search);
      const isDesktopParam = params.get('desktop') === 'true' || params.get('pwa') === 'true';
      setIsDesktopApp(Platform.isElectron || Platform.isPWA || isStandalone || isDesktopParam);
    };

    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    mediaQuery.addEventListener('change', checkDesktop);
    return () => mediaQuery.removeEventListener('change', checkDesktop);
  }, []);

  return {
    isDesktopApp,
    setIsDesktopApp,
    showSplash,
    setShowSplash,
    desktopTab,
    setDesktopTab,
  };
}

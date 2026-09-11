import { useCallback, useEffect, useRef, useState } from 'react';
import { registerSW } from 'virtual:pwa-register';

type AddToast = (type: 'success' | 'error' | 'info' | 'conflict', message: string) => void;

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

/**
 * Keeps PWA registration/install state outside the main App render tree.
 * PWA remains a first-class feature; this hook is only an architectural split.
 */
export function usePWA(addToast: AddToast) {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isAppInstalled, setIsAppInstalled] = useState(() =>
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
  const updateSWRef = useRef<((reloadPage?: boolean) => Promise<void>) | null>(null);

  useEffect(() => {
    try {
      updateSWRef.current = registerSW({
        onNeedRefresh: () => setNeedRefresh(true),
        onOfflineReady: () => setOfflineReady(true),
        onRegistered: (registration) => {
          console.log('LivePad PWA Service Worker Registered:', registration);
        },
        onRegisterError: (error) => {
          console.error('LivePad PWA SW Registration Error:', error);
        },
      });
    } catch (error) {
      console.warn('PWA registerSW registration notice:', error);
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      const installEvent = event as BeforeInstallPromptEvent;
      event.preventDefault();
      setDeferredPrompt(installEvent);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsAppInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      addToast('success', 'Thank you for installing LivePad!');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = (event: MediaQueryListEvent) => setIsAppInstalled(event.matches);
    mediaQuery.addEventListener('change', handleDisplayModeChange);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      mediaQuery.removeEventListener('change', handleDisplayModeChange);
    };
  }, [addToast]);

  const updateServiceWorker = useCallback(async (reloadPage = false) => {
    if (updateSWRef.current) await updateSWRef.current(reloadPage);
  }, []);

  const handleInstallApp = useCallback(async () => {
    if (!deferredPrompt) {
      addToast('info', 'Installation helper is initializing...');
      return;
    }
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`PWA install prompt choice: ${outcome}`);
    setDeferredPrompt(null);
    setIsInstallable(false);
  }, [addToast, deferredPrompt]);

  const dismissUpdate = useCallback(() => setNeedRefresh(false), []);

  return {
    needRefresh,
    offlineReady,
    isInstallable,
    isAppInstalled,
    handleInstallApp,
    updateServiceWorker,
    dismissUpdate,
  };
}

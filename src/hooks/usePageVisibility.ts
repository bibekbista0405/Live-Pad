import { useEffect, useState } from 'react';

/** Tracks whether the browser window is currently visible. */
export function usePageVisibility(): boolean {
  const [isVisible, setIsVisible] = useState(() => typeof document === 'undefined' || document.visibilityState === 'visible');

  useEffect(() => {
    const handleVisibilityChange = () => setIsVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  return isVisible;
}

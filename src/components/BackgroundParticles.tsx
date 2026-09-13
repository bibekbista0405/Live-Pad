import { memo } from 'react';
import { usePageVisibility } from '../hooks/usePageVisibility';

/**
 * Decorative background kept deliberately CSS-driven.  The previous Motion
 * implementation scheduled JavaScript animation work on the React tree while
 * the landing page was being scrolled. CSS compositor animations keep the
 * visuals but remove that per-frame React/JS overhead.
 */
function BackgroundParticles() {
  const isPageVisible = usePageVisibility();

  return (
    <div
      aria-hidden="true"
      className={`livepad-background fixed inset-0 overflow-hidden pointer-events-none -z-10 bg-linear-to-tr from-slate-50 via-slate-100 to-zinc-200 dark:from-neutral-950 dark:via-zinc-900 dark:to-neutral-950 sepia:from-[#f4eedb] sepia:via-[#ebe0c5] sepia:to-[#e1d5b5] ${isPageVisible ? '' : 'livepad-background-paused'}`}
    >
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] sepia:bg-[linear-gradient(to_right,#78350f04_1px,transparent_1px),linear-gradient(to_bottom,#78350f04_1px,transparent_1px)] bg-[size:32px_32px]" />
    </div>
  );
}

export default memo(BackgroundParticles);

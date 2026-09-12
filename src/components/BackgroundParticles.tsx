import { memo } from 'react';

/**
 * Decorative background kept deliberately CSS-driven.  The previous Motion
 * implementation scheduled JavaScript animation work on the React tree while
 * the landing page was being scrolled. CSS compositor animations keep the
 * visuals but remove that per-frame React/JS overhead.
 */
function BackgroundParticles() {
  return (
    <div
      aria-hidden="true"
      className="livepad-background fixed inset-0 overflow-hidden pointer-events-none -z-10 bg-linear-to-tr from-slate-50 via-slate-100 to-zinc-200 dark:from-neutral-950 dark:via-zinc-900 dark:to-neutral-950 sepia:from-[#f4eedb] sepia:via-[#ebe0c5] sepia:to-[#e1d5b5]"
    >
      <div className="livepad-bg-orb livepad-bg-orb-1 absolute -top-40 -left-40 w-96 h-96 rounded-full bg-blue-400/20 dark:bg-blue-600/10 sepia:bg-amber-600/5 blur-[120px]" />
      <div className="livepad-bg-orb livepad-bg-orb-2 absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-indigo-400/20 dark:bg-purple-600/10 sepia:bg-amber-700/5 blur-[140px]" />
      <div className="livepad-bg-orb livepad-bg-orb-3 absolute top-1/2 left-1/3 w-80 h-80 rounded-full bg-cyan-400/15 dark:bg-cyan-600/5 sepia:bg-orange-500/5 blur-[100px]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] sepia:bg-[linear-gradient(to_right,#78350f04_1px,transparent_1px),linear-gradient(to_bottom,#78350f04_1px,transparent_1px)] bg-[size:32px_32px]" />
    </div>
  );
}

export default memo(BackgroundParticles);

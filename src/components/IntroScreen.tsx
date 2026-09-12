import React, { useEffect, useRef, useState } from 'react';
import { ChevronRight, Play } from 'lucide-react';

interface IntroScreenProps {
  onComplete: () => void;
}

/**
 * Lightweight product intro.  The previous fallback rendered a static brand
 * image after a video-load timeout, which made the boot experience feel like
 * an image splash and also added an unnecessary media-loading path.  This
 * version is CSS-driven so the reveal stays animated without a per-frame React
 * animation loop or a large video download.
 */
export default function IntroScreen({ onComplete }: IntroScreenProps) {
  const [isClosing, setIsClosing] = useState(false);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const timer = window.setTimeout(() => onCompleteRef.current(), 4200);
    return () => window.clearTimeout(timer);
  }, []);

  const complete = () => {
    if (isClosing) return;
    setIsClosing(true);
    window.setTimeout(() => onCompleteRef.current(), 420);
  };

  return (
    <div
      className={`livepad-intro fixed inset-0 z-[150] flex items-center justify-center overflow-hidden bg-white text-slate-800 dark:bg-[#090b10] dark:text-white select-none ${isClosing ? 'livepad-intro-closing' : ''}`}
    >
      <div className="livepad-intro-grid absolute inset-0" aria-hidden="true" />
      <div className="livepad-intro-glow absolute inset-0" aria-hidden="true" />

      {/* Animated ribbon sweep — CSS only, no video/media download. */}
      <div className="livepad-intro-ribbon livepad-intro-ribbon-a" aria-hidden="true" />
      <div className="livepad-intro-ribbon livepad-intro-ribbon-b" aria-hidden="true" />
      <div className="livepad-intro-ribbon livepad-intro-ribbon-c" aria-hidden="true" />

      <div className="relative z-10 flex flex-col items-center text-center px-6">
        <div className="livepad-intro-mark relative flex items-center justify-center">
          <div className="livepad-intro-ring livepad-intro-ring-one" aria-hidden="true" />
          <div className="livepad-intro-ring livepad-intro-ring-two" aria-hidden="true" />
          <div className="livepad-intro-ring livepad-intro-ring-three" aria-hidden="true" />
          <div className="livepad-intro-spark livepad-intro-spark-one" aria-hidden="true" />
          <div className="livepad-intro-spark livepad-intro-spark-two" aria-hidden="true" />
          <img
            src="/brand/livepad-icon-512.png"
            alt="LivePad"
            draggable={false}
            className="livepad-intro-icon"
          />
        </div>

        <div className="livepad-intro-wordmark" aria-label="LivePad">
          <span>Live</span><strong>Pad</strong>
        </div>
        <p className="livepad-intro-tagline">Real-Time Notes, Seamlessly</p>
        <div className="livepad-intro-loader" aria-hidden="true">
          <span /><span /><span />
        </div>
      </div>

      <button
        type="button"
        onClick={complete}
        className="absolute bottom-9 z-20 inline-flex items-center gap-2 rounded-full border border-slate-200/90 bg-white/80 px-5 py-2.5 text-xs font-semibold text-slate-600 shadow-sm backdrop-blur-sm transition hover:border-slate-300 hover:bg-white hover:text-slate-900 dark:border-white/10 dark:bg-zinc-900/75 dark:text-zinc-300 dark:hover:bg-zinc-800"
        aria-label="Skip LivePad introduction"
      >
        <Play className="w-3 h-3 fill-cyan-600 text-cyan-600" />
        <span>Skip Introduction</span>
        <ChevronRight className="w-3.5 h-3.5 text-cyan-600" />
      </button>
    </div>
  );
}

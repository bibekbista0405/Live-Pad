import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Logo from '../Logo';
import BackgroundParticles from '../BackgroundParticles';

interface DesktopSplashScreenProps {
  onFinish: () => void;
}

const STEPS = [
  'Initializing LivePad Workspace...',
  'Loading Local Storage & Cache Manager...',
  'Connecting Realtime Collaboration Engine...',
  'Preparing Native Environment...',
];

export const DesktopSplashScreen: React.FC<DesktopSplashScreenProps> = ({ onFinish }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progress, setProgress] = useState(10);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Progress interval over 2.4s
    const startTime = Date.now();
    const duration = 2400;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / duration) * 100));
      setProgress(pct);

      if (pct < 25) setCurrentStepIndex(0);
      else if (pct < 55) setCurrentStepIndex(1);
      else if (pct < 85) setCurrentStepIndex(2);
      else setCurrentStepIndex(3);

      if (pct >= 100) {
        clearInterval(interval);
        setIsExiting(true);
        setTimeout(() => {
          onFinish();
        }, 400); // fade out duration
      }
    }, 40);

    return () => clearInterval(interval);
  }, [onFinish]);

  return (
    <AnimatePresence>
      {!isExiting && (
        <motion.div
          key="desktop-splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.4, ease: 'easeInOut' } }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-between bg-slate-950 text-white select-none overflow-hidden"
        >
          {/* Subtle Ambient Background */}
          <div className="absolute inset-0 opacity-40 pointer-events-none">
            <BackgroundParticles />
          </div>

          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />

          {/* Top Desktop App Tag */}
          <div className="pt-8 text-center relative z-10">
            <span className="px-3 py-1 text-[11px] font-mono tracking-widest uppercase text-slate-400 bg-slate-900/80 border border-slate-800 rounded-full shadow-inner">
              Installed Application • Desktop Edition
            </span>
          </div>

          {/* Center Brand & Reveal */}
          <div className="flex flex-col items-center justify-center relative z-10 my-auto">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="relative mb-6"
            >
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl shadow-indigo-500/20 backdrop-blur-md">
                <Logo iconSize={56} showText={false} />
              </div>
            </motion.div>

            <motion.h1
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent"
            >
              LivePad
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-xs text-slate-400 font-medium tracking-wide mt-1"
            >
              Real-Time Collaborative Desktop Environment
            </motion.p>
          </div>

          {/* Bottom Progress & Step Messages */}
          <div className="w-full max-w-md px-8 pb-12 relative z-10 flex flex-col items-center">
            <div className="w-full h-1.5 bg-slate-800/80 rounded-full overflow-hidden mb-3 border border-slate-700/50 shadow-inner">
              <motion.div
                className="h-full bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400 rounded-full"
                style={{ width: `${progress}%` }}
                transition={{ ease: 'linear' }}
              />
            </div>

            <div className="flex items-center justify-between w-full text-xs text-slate-400">
              <span className="font-mono text-[11px] text-indigo-300 font-medium truncate max-w-[280px]">
                {STEPS[currentStepIndex]}
              </span>
              <span className="font-mono text-[11px] text-slate-500 font-bold ml-2">
                {progress}%
              </span>
            </div>

            <div className="mt-6 text-[10px] font-mono text-slate-600 flex items-center gap-2">
              <span>v1.0.0 (Standalone Build)</span>
              <span>•</span>
              <span className="text-emerald-500/80">Offline Local Storage Enabled</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

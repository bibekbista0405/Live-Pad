import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, Play, VolumeX } from 'lucide-react';

interface IntroScreenProps {
  onComplete: () => void;
}

export default function IntroScreen({ onComplete }: IntroScreenProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [skipHovered, setSkipHovered] = useState(false);
  const [useVideo, setUseVideo] = useState(true);
  const [isLoadingVideo, setIsLoadingVideo] = useState(true);
  const [fallbackPhase, setFallbackPhase] = useState<'wave' | 'draw' | 'complete'>('wave');

  // Fallback scheduling if video fails or is delayed
  useEffect(() => {
    // If video hasn't loaded in 1000ms, fall back to the official supplied LivePad brand artwork
    const timeout = setTimeout(() => {
      if (isLoadingVideo) {
        setUseVideo(false);
      }
    }, 1000);

    return () => clearTimeout(timeout);
  }, [isLoadingVideo]);

  // Keep onComplete reference stable to prevent re-triggering the timer on parent re-renders
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Overall auto-complete timer set to exactly 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      onCompleteRef.current();
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  // Handle fallback stages
  useEffect(() => {
    if (!useVideo) {
      // Step 1: Play waving ribbons for 1.4s
      const t1 = setTimeout(() => {
        setFallbackPhase('draw');
      }, 1400);

      return () => {
        clearTimeout(t1);
      };
    }
  }, [useVideo]);

  const handleVideoEnded = () => {
    // End presentation immediately when the video finishes
    onComplete();
  };

  const handleVideoError = () => {
    setUseVideo(false);
  };

  const handleCanPlay = () => {
    setIsLoadingVideo(false);
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        // If browser policies block autoplay, we switch to our interactive fallback
        setUseVideo(false);
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ 
        opacity: 0, 
        scale: 1.05,
        filter: 'blur(10px)',
        transition: { duration: 0.5, ease: [0.43, 0.13, 0.23, 0.96] } 
      }}
      className="fixed inset-0 mountaineer z-[150] flex flex-col items-center justify-center bg-white text-slate-800 select-none overflow-hidden"
    >
      <AnimatePresence mode="wait">
        {useVideo ? (
          /* =========================================================================
             1. NATIVE VIDEO PRESENTER (PLAYS 'intro animations.mp4')
             ========================================================================= */
          <motion.div
            key="video-track"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative w-full h-full flex flex-col items-center justify-center px-4"
          >
            <div className="relative w-full h-full max-w-4xl max-h-[80vh] flex items-center justify-center z-10">
              {isLoadingVideo && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin text-cyan-600" />
                  <span className="text-[10px] font-mono tracking-[0.25em] text-slate-400 uppercase animate-pulse">
                    Synchronizing Workspace...
                  </span>
                </div>
              )}
              <video
                ref={videoRef}
                src="/intro animations.mp4"
                autoPlay
                muted
                playsInline
                onEnded={handleVideoEnded}
                onError={handleVideoError}
                onCanPlay={handleCanPlay}
                className="w-full h-full object-contain filter drop-shadow-xl"
              />
            </div>

            {/* Mute indicator label */}
            {!isLoadingVideo && (
              <div className="absolute bottom-24 flex items-center gap-1.5 text-[9px] font-mono text-slate-400 tracking-widest uppercase z-20">
                <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                <span>Presentation Default Muted</span>
              </div>
            )}
          </motion.div>
        ) : (
          /* =========================================================================
             2. OFFICIAL LIVEPAD BRAND FALLBACK
             ========================================================================= */
          <motion.div
            key="fallback-track"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-white"
          >
            {/* Waving Ribbon Wave Sheets (Simulating the 3D ribbon sweep of the video) */}
            {fallbackPhase === 'wave' && (
              <div className="absolute inset-0 z-50 pointer-events-none">
                <motion.div
                  initial={{ x: '-100%' }}
                  animate={{ x: '100%' }}
                  transition={{ duration: 1.4, ease: [0.76, 0, 0.24, 1] }}
                  className="absolute inset-0 bg-blue-600 opacity-90"
                />
                <motion.div
                  initial={{ x: '-100%' }}
                  animate={{ x: '100%' }}
                  transition={{ duration: 1.4, delay: 0.1, ease: [0.76, 0, 0.24, 1] }}
                  className="absolute inset-0 bg-cyan-400 opacity-80"
                />
                <motion.div
                  initial={{ x: '-100%' }}
                  animate={{ x: '100%' }}
                  transition={{ duration: 1.4, delay: 0.2, ease: [0.76, 0, 0.24, 1] }}
                  className="absolute inset-0 bg-slate-50"
                />
              </div>
            )}

            {/* Ambient Background Light Circle */}
            <div className="absolute w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-cyan-100/30 via-white to-blue-100/20 blur-[100px] pointer-events-none" />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.8, ease: 'easeOut' }}
              className="relative z-10 flex flex-col items-center justify-center text-center px-6"
            >
              {/* Official LivePad brand artwork supplied by the product owner */}
              <motion.img
                src="/brand/livepad-lockup.png"
                alt="LivePad — Real-time Notes, Seamlessly"
                draggable={false}
                initial={{ scale: 0.94, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.15, duration: 0.8, ease: 'easeOut' }}
                className="relative z-10 w-[min(88vw,520px)] h-auto object-contain"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FLOATING GLASS BYPASS BUTTON */}
      <motion.button
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        onMouseEnter={() => setSkipHovered(true)}
        onMouseLeave={() => setSkipHovered(false)}
        onClick={onComplete}
        className="absolute bottom-10 cursor-pointer py-2.5 px-6 rounded-full border border-slate-200 bg-white/70 backdrop-blur-md text-xs font-semibold text-slate-600 hover:text-slate-900 hover:border-slate-300 hover:bg-slate-50 transition-all flex items-center gap-2 z-30 shadow-sm group overflow-hidden"
      >
        <Play className="w-3 h-3 text-cyan-600 fill-cyan-600" />
        <span>Skip Introduction</span>
        <motion.div
          animate={skipHovered ? { x: 3 } : { x: 0 }}
          transition={{ type: 'spring', stiffness: 350, damping: 15 }}
        >
          <ChevronRight className="w-3.5 h-3.5 text-cyan-600" />
        </motion.div>
      </motion.button>
    </motion.div>
  );
}

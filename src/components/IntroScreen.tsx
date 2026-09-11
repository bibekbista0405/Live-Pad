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
    // If video hasn't loaded in 1000ms, fall back to our beautiful animated SVG recreation
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
             2. HIGH-FIDELITY INTERACTIVE SVG/CSS RECREATION FALLBACK
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
              {/* Circular Emblem Container */}
              <div className="relative w-44 h-44 mb-6 rounded-full bg-slate-50/60 border border-slate-100/80 shadow-inner flex items-center justify-center overflow-hidden">
                <div className="absolute inset-1 rounded-full bg-gradient-to-tr from-slate-100/40 via-white to-white" />
                
                {/* Custom Stylized SVG drawing the exact LivePad Notebook Logo */}
                <svg
                  width="130"
                  height="130"
                  viewBox="0 0 200 200"
                  fill="none"
                  className="relative z-10"
                >
                  {/* Notepad tapered container with rounded corners and thick stroke */}
                  <motion.path
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                    d="M 94,54 L 126,54 C 131,54 134,57 134,62 L 134,130 C 134,135 130,138 125,138 L 85,138 C 80,138 76,135 77,130 L 88,62 C 89,57 91,54 94,54 Z"
                    fill="none"
                    stroke="#1e293b"
                    strokeWidth="11"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Three Binder Rings at the top */}
                  <motion.path
                    initial={{ scaleY: 0, originY: 1 }}
                    animate={{ scaleY: 1 }}
                    transition={{ delay: 0.6, duration: 0.5, type: 'spring', stiffness: 200 }}
                    d="M 98,40 L 98,54 M 110,40 L 110,54 M 122,40 L 122,54"
                    stroke="#1e293b"
                    strokeWidth="8"
                    strokeLinecap="round"
                  />

                  {/* The flowing royal blue ribbon loop */}
                  <motion.path
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: 0.8, duration: 1.4, ease: 'easeInOut' }}
                    d="M 64,103 C 58,118 84,122 93,115 C 104,107 125,83 112,71 C 97,58 84,89 80,111 C 76,131 92,139 105,129 C 118,118 135,93 151,80"
                    stroke="#0084ff"
                    strokeWidth="11"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                    className="drop-shadow-[0_2px_4px_rgba(0,132,255,0.25)]"
                  />

                  {/* Connected Arrowhead pointing up-right */}
                  <motion.path
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 1.8, type: 'spring', stiffness: 200, damping: 10 }}
                    d="M 134,86 L 152,73 L 150,96 L 144,90 Z"
                    fill="#0084ff"
                    stroke="#0084ff"
                    strokeWidth="3"
                    strokeLinejoin="round"
                    style={{ originX: '144px', originY: '90px' }}
                  />
                </svg>
              </div>

              {/* Bold Minimal Wordmark */}
              <div className="overflow-hidden mb-1.5">
                <motion.h1
                  initial={{ y: 35, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 1.1, type: 'spring', stiffness: 100, damping: 15 }}
                  className="text-3xl md:text-4xl font-black tracking-[-0.04em] font-sans flex items-center justify-center uppercase"
                >
                  <span className="text-[#0084ff]">Live</span>
                  <span className="text-slate-800 font-bold">Pad</span>
                </motion.h1>
              </div>

              {/* Tagline representation from video */}
              <div className="overflow-hidden">
                <motion.p
                  initial={{ y: 15, opacity: 0 }}
                  animate={{ y: 0, opacity: 0.75 }}
                  transition={{ delay: 1.4, duration: 0.6 }}
                  className="text-[10px] md:text-xs font-semibold text-slate-500 uppercase tracking-[0.25em]"
                >
                  Real-time Notes, Seamlessly
                </motion.p>
              </div>
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

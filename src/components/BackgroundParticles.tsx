import { memo } from 'react';
import { motion } from 'motion/react';

function BackgroundParticles() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 bg-linear-to-tr from-slate-50 via-slate-100 to-zinc-200 dark:from-neutral-950 dark:via-zinc-900 dark:to-neutral-950 sepia:from-[#f4eedb] sepia:via-[#ebe0c5] sepia:to-[#e1d5b5] transition-colors duration-500">
      {/* Glow Blur Circle 1 */}
      <motion.div
        animate={{
          x: [0, 80, -40, 0],
          y: [0, -100, 60, 0],
          scale: [1, 1.2, 0.9, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-blue-400/20 dark:bg-blue-600/10 sepia:bg-amber-600/5 blur-[120px] transform-gpu will-change-transform"
      />

      {/* Glow Blur Circle 2 */}
      <motion.div
        animate={{
          x: [0, -90, 50, 0],
          y: [0, 80, -70, 0],
          scale: [1, 0.85, 1.15, 1],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-indigo-400/20 dark:bg-purple-600/10 sepia:bg-amber-700/5 blur-[140px] transform-gpu will-change-transform"
      />

      {/* Glow Blur Circle 3 */}
      <motion.div
        animate={{
          x: [0, 120, -100, 0],
          y: [0, 100, -80, 0],
          scale: [1, 1.1, 0.8, 1],
        }}
        transition={{
          duration: 35,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-1/2 left-1/3 w-80 h-80 rounded-full bg-cyan-400/15 dark:bg-cyan-600/5 sepia:bg-orange-500/5 blur-[100px] transform-gpu will-change-transform"
      />

      {/* Mesh lines for engineering aesthetic */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] sepia:bg-[linear-gradient(to_right,#78350f04_1px,transparent_1px),linear-gradient(to_bottom,#78350f04_1px,transparent_1px)] bg-[size:32px_32px]" />
    </div>
  );
}

export default memo(BackgroundParticles);

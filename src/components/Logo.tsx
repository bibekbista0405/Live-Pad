import React from 'react';
import { motion } from 'motion/react';

interface LogoProps {
  className?: string;
  iconSize?: number;
  showText?: boolean;
}

export default function Logo({ className = '', iconSize = 36, showText = true }: LogoProps) {
  return (
    <motion.div 
      className={`flex items-center gap-3 select-none cursor-pointer group ${className}`}
      initial="initial"
      whileHover="hover"
    >
      {/* Icon Frame */}
      <motion.div 
        className="relative flex items-center justify-center shrink-0"
        style={{ width: iconSize, height: iconSize }}
        variants={{
          hover: { 
            scale: 1.12, 
            rotate: -6,
            transition: { type: 'spring', stiffness: 400, damping: 12 }
          }
        }}
      >
        <svg
          viewBox="0 0 200 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Notepad tapered container with rounded corners and thick stroke */}
          <motion.path
            d="M 94,54 L 126,54 C 131,54 134,57 134,62 L 134,130 C 134,135 130,138 125,138 L 85,138 C 80,138 76,135 77,130 L 88,62 C 89,57 91,54 94,54 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="11"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-slate-800 dark:text-zinc-200 group-hover:text-[#6366f1] transition-colors duration-300"
          />

          {/* Three Binder Rings at the top */}
          <motion.path
            d="M 98,40 L 98,54 M 110,40 L 110,54 M 122,40 L 122,54"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            className="text-slate-800 dark:text-zinc-200"
            variants={{
              hover: {
                y: -1.5,
                transition: { type: 'spring', stiffness: 500, damping: 10 }
              }
            }}
          />

          {/* The flowing royal blue ribbon loop */}
          <motion.path
            d="M 64,103 C 58,118 84,122 93,115 C 104,107 125,83 112,71 C 97,58 84,89 80,111 C 76,131 92,139 105,129 C 118,118 135,93 151,80"
            stroke="#0084ff"
            strokeWidth="11"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            className="drop-shadow-[0_2px_4px_rgba(0,132,255,0.25)]"
            variants={{
              initial: { pathLength: 1 },
              hover: {
                pathLength: [1, 0.9, 1.05, 1],
                stroke: '#0ea5e9',
                transition: { duration: 0.8, ease: 'easeInOut' }
              }
            }}
          />

          {/* Connected Arrowhead pointing up-right - animates in diagonal pulse */}
          <motion.path
            d="M 134,86 L 152,73 L 150,96 L 144,90 Z"
            fill="#0084ff"
            stroke="#0084ff"
            strokeWidth="3"
            strokeLinejoin="round"
            variants={{
              hover: {
                x: [0, 4, -1, 0],
                y: [0, -4, 1, 0],
                fill: '#0ea5e9',
                stroke: '#0ea5e9',
                transition: { duration: 0.6, ease: 'easeOut' }
              }
            }}
          />
        </svg>
      </motion.div>

      {/* Wordmark with smooth color & letter-spacing interpolation */}
      {showText && (
        <span className="font-sans font-black tracking-[-0.04em] text-2xl uppercase flex items-center">
          <motion.span 
            className="text-[#0084ff]"
            variants={{
              hover: {
                color: '#0ea5e9',
                scale: 1.02,
                transition: { duration: 0.2 }
              }
            }}
          >
            LIVE
          </motion.span>
          <motion.span 
            className="text-slate-800 dark:text-zinc-100"
            variants={{
              hover: {
                scale: 1.02,
                x: 1,
                transition: { duration: 0.2 }
              }
            }}
          >
            PAD
          </motion.span>
        </span>
      )}
    </motion.div>
  );
}

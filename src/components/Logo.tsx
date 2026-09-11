import React from 'react';
import { motion } from 'motion/react';

interface LogoProps {
  className?: string;
  iconSize?: number;
  showText?: boolean;
}

/**
 * LivePad brand component.
 *
 * The artwork comes directly from the supplied LivePad brand assets.
 * No generated/recreated SVG logo is used anymore.
 */
export default function Logo({ className = '', iconSize = 36, showText = true }: LogoProps) {
  return (
    <motion.div
      className={`flex items-center select-none cursor-pointer group ${className}`}
      initial="initial"
      whileHover="hover"
      aria-label="LivePad"
    >
      <motion.img
        src={showText ? '/brand/livepad-lockup.png' : '/brand/livepad-icon-512.png'}
        alt="LivePad"
        draggable={false}
        className="block object-contain"
        style={{
          height: iconSize,
          width: showText ? 'auto' : iconSize,
        }}
        variants={{
          initial: { scale: 1 },
          hover: {
            scale: 1.05,
            transition: { type: 'spring', stiffness: 400, damping: 16 },
          },
        }}
      />
    </motion.div>
  );
}

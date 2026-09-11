import { X, Keyboard } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  const shortcuts = [
    { keys: ['Ctrl', 'Shift', 'P'], desc: 'Open Universal Command Palette' },
    { keys: ['Ctrl', 'K'], desc: 'Quick Search & Command Palette' },
    { keys: ['Ctrl', 'F'], desc: 'Find and highlight text inside document' },
    { keys: ['Ctrl', 'B'], desc: 'Toggle Explorer Sidebar' },
    { keys: ['Ctrl', 'Shift', 'B'], desc: 'Toggle Inspector Panel' },
    { keys: ['Ctrl', 'S'], desc: 'Force content save & database sync' },
    { keys: ['Ctrl', 'D'], desc: 'Toggle between dark and light themes' },
    { keys: ['Ctrl', 'Shift', 'C'], desc: 'Copy current room code to clipboard' },
    { keys: ['Alt', 'F'], desc: 'Toggle distraction-free Focus Mode' },
    { keys: ['?'], desc: 'Toggle keyboard shortcuts menu' },
    { keys: ['Esc'], desc: 'Close any active overlays or dialogs' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-neutral-900/40 dark:bg-black/60 backdrop-blur-xs"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.97, opacity: 0, y: 10 }}
            transition={{ type: "spring", duration: 0.4 }}
            className="relative w-full max-w-[325px] sm:max-w-md p-5 sm:p-6 border border-zinc-200/50 dark:border-zinc-800/50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-2xl rounded-2xl flex flex-col max-h-[90vh] overflow-hidden"
          >
            <div className="flex items-center justify-between mb-4 shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/20 dark:border-zinc-700/20 text-neutral-800 dark:text-neutral-200">
                  <Keyboard className="w-4 h-4" />
                </div>
                <h3 className="font-sans font-semibold text-lg text-neutral-955 dark:text-white">
                  Shortcuts
                </h3>
              </div>
              <button
                id="close-shortcuts-btn"
                type="button"
                onClick={onClose}
                className="p-1 rounded-full transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 space-y-3.5 scrollbar-thin">
              {shortcuts.map((shortcut, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between py-1.5 border-b border-zinc-105 dark:border-zinc-800/50 last:border-0 gap-3"
                >
                  <span className="text-xs font-medium text-neutral-600 dark:text-neutral-350 text-left leading-snug">
                    {shortcut.desc}
                  </span>
                  <div className="flex gap-1 items-center shrink-0">
                    {shortcut.keys.map((key, keyIdx) => (
                      <span
                        key={keyIdx}
                        className="px-1.5 py-0.5 text-[10px] font-mono font-bold leading-none bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded text-neutral-700 dark:text-neutral-300 shadow-xs"
                      >
                        {key}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-zinc-200/20 dark:border-zinc-800/50 text-center shrink-0">
              <p className="text-[11px] font-mono text-neutral-400 dark:text-neutral-500">
                Tip: LivePad auto-saves every keystroke in real-time.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

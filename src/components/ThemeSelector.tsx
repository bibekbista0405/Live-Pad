import { Sun, Moon, Monitor } from 'lucide-react';
import { Theme } from '../types';
import { motion } from 'motion/react';

interface ThemeSelectorProps {
  currentTheme: Theme;
  onChange: (theme: Theme) => void;
}

export default function ThemeSelector({ currentTheme, onChange }: ThemeSelectorProps) {
  const options: { value: Theme; icon: any; label: string }[] = [
    { value: 'light', icon: Sun, label: 'Light' },
    { value: 'dark', icon: Moon, label: 'Dark' },
    { value: 'system', icon: Monitor, label: 'System' },
  ];

  return (
    <div className="flex p-1 bg-zinc-200/50 dark:bg-zinc-800/50 border border-zinc-200/20 dark:border-zinc-700/20 rounded-full select-none backdrop-blur-xs">
      {options.map((opt) => {
        const IconComponent = opt.icon;
        const isActive = currentTheme === opt.value;

        return (
          <button
            key={opt.value}
            id={`theme-btn-${opt.value}`}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium uppercase tracking-wider transition-colors duration-200 focus:outline-hidden cursor-pointer ${
              isActive 
                ? 'text-neutral-900 dark:text-white' 
                : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="activeThemeBg"
                className="absolute inset-0 bg-white dark:bg-zinc-750 shadow-xs border border-zinc-200/20 dark:border-zinc-600/10 rounded-full"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center justify-center">
              <IconComponent className="w-3.5 h-3.5" />
            </span>
            <span className="relative z-10 hidden sm:inline text-[10px]">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}

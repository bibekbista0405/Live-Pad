import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ToastMessage } from '../types';

interface ToastContainerProps {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}

export default function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-md w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          const Icon = {
            success: CheckCircle2,
            error: AlertCircle,
            info: Info,
            conflict: AlertTriangle,
          }[toast.type];

          const colorClasses = {
            success: 'border-emerald-200 bg-emerald-50/90 text-emerald-900 dark:border-emerald-900/30 dark:bg-emerald-950/90 dark:text-emerald-200',
            error: 'border-rose-200 bg-rose-50/90 text-rose-900 dark:border-rose-900/30 dark:bg-rose-950/90 dark:text-rose-200',
            info: 'border-blue-200 bg-blue-50/90 text-blue-900 dark:border-blue-900/30 dark:bg-blue-950/90 dark:text-blue-200',
            conflict: 'border-amber-400/50 bg-amber-950/90 text-amber-200 dark:border-amber-500/50 dark:bg-amber-950/95 shadow-amber-900/20',
          }[toast.type];

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 15, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.15 } }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className={`pointer-events-auto flex gap-3 items-start p-4 rounded-xl border backdrop-blur-md shadow-lg ${colorClasses}`}
            >
              <div className="mt-0.5 shrink-0">
                <Icon className={`w-4 h-4 ${toast.type === 'conflict' ? 'text-amber-400 animate-pulse' : ''}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium leading-relaxed select-none">
                  {toast.message}
                </p>
                {toast.onAction && (
                  <div className="mt-2.5 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        toast.onAction?.();
                        onRemove(toast.id);
                      }}
                      className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-colors shadow-sm cursor-pointer"
                    >
                      {toast.actionLabel || 'Resolve'}
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemove(toast.id)}
                      className="px-2.5 py-1 rounded-lg bg-black/20 hover:bg-black/30 text-amber-200 text-xs transition-colors cursor-pointer"
                    >
                      Dismiss
                    </button>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => onRemove(toast.id)}
                className="p-0.5 rounded-md hover:bg-black/5 dark:hover:bg-white/5 opacity-60 hover:opacity-100 transition-opacity"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

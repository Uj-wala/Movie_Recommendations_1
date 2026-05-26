import { AnimatePresence, motion } from 'framer-motion';
import { FiCheckCircle, FiInfo, FiAlertTriangle, FiX } from 'react-icons/fi';
import { useToast } from '../context/useToast';

const icons = {
  success: FiCheckCircle,
  info: FiInfo,
  warning: FiAlertTriangle,
  error: FiAlertTriangle,
};

const colors = {
  success: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-100',
  info: 'border-sky-400/30 bg-sky-500/10 text-sky-100',
  warning: 'border-amber-400/30 bg-amber-500/10 text-amber-100',
  error: 'border-rose-400/30 bg-rose-500/10 text-rose-100',
};

export const ToastContainer = () => {
  const { toasts, removeToast } = useToast();

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-50 flex w-full max-w-sm flex-col gap-3 px-4 sm:px-6">
      <AnimatePresence initial={false}>
        {toasts.map((toast) => {
          const Icon = icons[toast.type] || FiInfo;
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.96 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className={`pointer-events-auto overflow-hidden rounded-3xl border p-4 shadow-2xl backdrop-blur-xl ${colors[toast.type]}`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1 text-sm leading-6">
                  <p className="font-semibold">{toast.type === 'error' ? 'Error' : toast.type === 'warning' ? 'Warning' : toast.type === 'info' ? 'Info' : 'Success'}</p>
                  <p className="mt-1 text-slate-100">{toast.message}</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeToast(toast.id)}
                  className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/10 text-white transition hover:bg-white/20"
                  aria-label="Dismiss toast"
                >
                  <FiX className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

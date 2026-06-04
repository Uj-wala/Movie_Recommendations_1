import { motion } from 'framer-motion';

export const EmptyState = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  actionIcon,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center text-slate-300 backdrop-blur-xl"
    >
      {icon && <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full border border-white/10 bg-white/10 text-fuchsia-200">{icon}</div>}
      <h2 className="text-2xl font-black text-white">{title}</h2>
      <p className="mx-auto mt-3 max-w-md">{description}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-cyan-300/30 bg-cyan-300/10 px-5 py-3 text-sm font-black text-cyan-100 transition hover:bg-cyan-300/20"
        >
          {actionIcon}
          {actionLabel}
        </button>
      )}
    </motion.div>
  );
};

import { motion } from 'framer-motion';

export const Loader = () => {
  return (
    <div className="py-8">
      <div className="mb-8 flex items-center justify-center gap-3 text-cyan-100">
        <span className="relative flex h-4 w-4">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-300 opacity-75" />
          <span className="relative inline-flex h-4 w-4 rounded-full bg-cyan-200" />
        </span>
        <p className="text-sm font-black uppercase tracking-[0.24em]">Scanning movie signal</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[...Array(8)].map((_, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
            className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.07] p-2 backdrop-blur-xl"
          >
            <div className="aspect-[2/3] rounded-[0.9rem] bg-[linear-gradient(100deg,rgba(255,255,255,0.06),rgba(103,232,249,0.22),rgba(255,255,255,0.06))] bg-[length:200%_100%] animate-shimmer" />
            <div className="space-y-3 p-4">
              <div className="h-4 w-5/6 rounded-full bg-[linear-gradient(100deg,rgba(255,255,255,0.06),rgba(217,70,239,0.2),rgba(255,255,255,0.06))] bg-[length:200%_100%] animate-shimmer" />
              <div className="h-3 w-1/2 rounded-full bg-white/10" />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

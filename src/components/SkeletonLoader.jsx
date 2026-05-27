import { motion } from 'framer-motion';

export const SkeletonMovieCard = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.04 }}
      className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.07] p-2 backdrop-blur-xl"
    >
      <div className="relative">
        <div className="aspect-[2/3] rounded-[0.9rem] bg-[linear-gradient(100deg,rgba(255,255,255,0.06),rgba(103,232,249,0.22),rgba(255,255,255,0.06))] bg-[length:200%_100%] animate-shimmer" />
        <div className="absolute right-2 top-2 h-8 w-8 rounded-full bg-[linear-gradient(100deg,rgba(255,255,255,0.06),rgba(103,232,249,0.22),rgba(255,255,255,0.06))] bg-[length:200%_100%] animate-shimmer" />
      </div>
      <div className="space-y-3 p-4">
        <div className="h-4 w-5/6 rounded-full bg-[linear-gradient(100deg,rgba(255,255,255,0.06),rgba(217,70,239,0.2),rgba(255,255,255,0.06))] bg-[length:200%_100%] animate-shimmer" />
        <div className="h-3 w-1/2 rounded-full bg-white/10" />
        <div className="flex gap-2">
          <div className="h-6 w-12 rounded-full bg-white/10" />
          <div className="h-6 w-12 rounded-full bg-white/10" />
        </div>
      </div>
    </motion.div>
  );
};

export const SkeletonMovieModal = () => {
  return (
    <div className="space-y-6">
      {/* Title skeleton */}
      <div className="space-y-3 pt-16">
        <div className="h-8 w-3/4 animate-shimmer rounded-full bg-[linear-gradient(90deg,rgba(255,255,255,0.08),rgba(103,232,249,0.28),rgba(255,255,255,0.08))] bg-[length:200%_100%]" />
        <div className="h-4 w-full animate-shimmer rounded-full bg-[linear-gradient(90deg,rgba(255,255,255,0.08),rgba(103,232,249,0.28),rgba(255,255,255,0.08))] bg-[length:200%_100%]" />
        <div className="h-4 w-5/6 animate-shimmer rounded-full bg-[linear-gradient(90deg,rgba(255,255,255,0.08),rgba(103,232,249,0.28),rgba(255,255,255,0.08))] bg-[length:200%_100%]" />
      </div>

      {/* Tags skeleton */}
      <div className="flex flex-wrap gap-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-6 w-20 animate-shimmer rounded-full bg-white/10" />
        ))}
      </div>

      {/* Plot skeleton */}
      <div className="space-y-2">
        <div className="h-4 w-full animate-shimmer rounded-full bg-[linear-gradient(90deg,rgba(255,255,255,0.08),rgba(103,232,249,0.28),rgba(255,255,255,0.08))] bg-[length:200%_100%]" />
        <div className="h-4 w-full animate-shimmer rounded-full bg-[linear-gradient(90deg,rgba(255,255,255,0.08),rgba(103,232,249,0.28),rgba(255,255,255,0.08))] bg-[length:200%_100%]" />
        <div className="h-4 w-4/5 animate-shimmer rounded-full bg-[linear-gradient(90deg,rgba(255,255,255,0.08),rgba(103,232,249,0.28),rgba(255,255,255,0.08))] bg-[length:200%_100%]" />
      </div>

      {/* Button skeleton */}
      <div className="h-11 w-40 animate-shimmer rounded-full bg-white/10" />

      {/* Info blocks skeleton */}
      <div className="grid gap-4 sm:grid-cols-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-3 w-16 animate-shimmer rounded-full bg-white/10" />
            <div className="h-4 w-full animate-shimmer rounded-full bg-[linear-gradient(90deg,rgba(255,255,255,0.08),rgba(103,232,249,0.28),rgba(255,255,255,0.08))] bg-[length:200%_100%]" />
          </div>
        ))}
      </div>
    </div>
  );
};

export const SkeletonFavoritesGrid = () => {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.03 }}
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
  );
};

export const SkeletonSearchResults = ({ count = 8 }) => {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {[...Array(count)].map((_, index) => (
        <SkeletonMovieCard key={index} />
      ))}
    </div>
  );
};

export const SkeletonHomeHero = () => {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="h-10 w-1/2 animate-shimmer rounded-full bg-[linear-gradient(90deg,rgba(255,255,255,0.08),rgba(103,232,249,0.28),rgba(255,255,255,0.08))] bg-[length:200%_100%]" />
        <div className="h-6 w-3/4 animate-shimmer rounded-full bg-white/10" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="aspect-[2/3] animate-shimmer rounded-2xl bg-white/10" />
        ))}
      </div>
    </div>
  );
};

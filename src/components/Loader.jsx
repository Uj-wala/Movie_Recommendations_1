import { SkeletonSearchResults } from './SkeletonLoader';

export const Loader = ({ count = 8 }) => {
  return (
    <div className="py-12">
      <div className="mb-10 flex items-center justify-center gap-3 text-cyan-100">
        <span className="relative flex h-4 w-4">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-300 opacity-75" />
          <span className="relative inline-flex h-4 w-4 rounded-full bg-cyan-200" />
        </span>
        <p className="text-sm font-black uppercase tracking-[0.24em]">Scanning movie signal</p>
      </div>

      <SkeletonSearchResults count={count} />
    </div>
  );
};

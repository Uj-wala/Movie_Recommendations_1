import { FiHeart, FiRadio } from 'react-icons/fi';

export const Navbar = ({ favoriteCount = 0, onFavoritesClick }) => {
  return (
    <nav className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/55 backdrop-blur-2xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl border border-cyan-300/30 bg-cyan-300/10 text-cyan-100 shadow-[0_0_28px_rgba(34,211,238,0.25)]">
            <FiRadio className="h-5 w-5" />
          </div>
          <div>
            <p className="text-lg font-black leading-none text-white">CineVerse</p>
            <p className="mt-1 text-[0.62rem] font-black uppercase tracking-[0.28em] text-cyan-200">OMDb uplink</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onFavoritesClick}
          className="relative inline-flex items-center gap-2 rounded-full border border-fuchsia-300/25 bg-fuchsia-300/10 px-4 py-2 text-sm font-black text-fuchsia-100 shadow-[0_0_28px_rgba(217,70,239,0.14)] transition hover:border-fuchsia-200/60 hover:bg-fuchsia-300/20"
        >
          <FiHeart className={favoriteCount > 0 ? 'fill-current' : ''} />
          <span className="hidden sm:inline">Watchlist</span>
          {favoriteCount > 0 && (
            <span className="grid h-6 min-w-6 place-items-center rounded-full bg-fuchsia-300 px-2 text-xs text-slate-950">
              {favoriteCount}
            </span>
          )}
        </button>
      </div>
    </nav>
  );
};

import { FiHome, FiHeart, FiLogIn, FiLogOut, FiMoon, FiSun, FiUser, FiUserPlus } from 'react-icons/fi';
import cineverseLogo from '../assets/cineverse-logo.svg';
import { useTheme } from '../context/useTheme';

export const Navbar = ({
  favoriteCount = 0,
  activeView = 'home',
  onHomeClick,
  onWatchlistClick,
  onFavoritesClick,
  isAuthenticated = false,
  authEmail = '',
  onLoginClick,
  onRegisterClick,
  onProfileClick,
  onLogoutClick,
}) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <nav className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/55 backdrop-blur-2xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onHomeClick}
          className="flex items-center gap-3 text-left"
          aria-label="Go to home"
        >
          <div className="grid h-12 w-12 place-items-center rounded-2xl border border-cyan-300/30 bg-cyan-300/10 p-1.5 shadow-[0_0_28px_rgba(34,211,238,0.25)]">
            <img src={cineverseLogo} alt="CineVerse logo" className="h-full w-full rounded-xl" />
          </div>
          <div>
            <p className="text-lg font-black leading-none text-theme-strong">CineVerse</p>
            <p className="mt-1 text-[0.62rem] font-black uppercase tracking-[0.28em] text-cyan-700 dark:text-cyan-200">OMDb uplink</p>
          </div>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onHomeClick}
            className={`hidden items-center gap-2 rounded-full border px-4 py-2 text-sm font-black transition sm:inline-flex ${
              activeView === 'home'
                ? 'border-cyan-300/40 bg-cyan-300/15 text-cyan-700 dark:text-cyan-100'
                : 'border-white/10 bg-white/10 text-theme-strong hover:border-cyan-300/40 hover:bg-cyan-300/10'
            }`}
          >
            <FiHome />
            Home
          </button>

          <button
            type="button"
            onClick={onWatchlistClick}
            className={`relative inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-black shadow-[0_0_28px_rgba(217,70,239,0.14)] transition hover:border-fuchsia-200/60 hover:bg-fuchsia-300/20 ${
              activeView === 'watchlist'
                ? 'border-fuchsia-300/50 bg-fuchsia-300/20 text-fuchsia-700 dark:text-fuchsia-100'
                : 'border-fuchsia-300/25 bg-fuchsia-300/10 text-fuchsia-700 dark:text-fuchsia-100'
            }`}
          >
            <FiHeart className={favoriteCount > 0 ? 'fill-current' : ''} />
            <span className="hidden sm:inline">Watchlist</span>
            {favoriteCount > 0 && (
              <span className="grid h-6 min-w-6 place-items-center rounded-full bg-fuchsia-300 px-2 text-xs text-slate-950">
                {favoriteCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={onFavoritesClick}
            className={`relative inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-black shadow-[0_0_28px_rgba(217,70,239,0.14)] transition hover:border-fuchsia-200/60 hover:bg-fuchsia-300/20 ${
              activeView === 'favorites'
                ? 'border-fuchsia-300/50 bg-fuchsia-300/20 text-fuchsia-700 dark:text-fuchsia-100'
                : 'border-fuchsia-300/25 bg-fuchsia-300/10 text-fuchsia-700 dark:text-fuchsia-100'
            }`}
          >
            <FiHeart className={favoriteCount > 0 ? 'fill-current' : ''} />
            <span className="hidden sm:inline">Favorites</span>
            </button>

          {!isAuthenticated ? (
            <>
              <button
                type="button"
                onClick={onLoginClick}
                className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm font-black text-cyan-100 transition hover:border-cyan-300/50 hover:bg-cyan-300/20"
              >
                <FiLogIn />
                <span className="hidden sm:inline">Login</span>
              </button>
              <button
                type="button"
                onClick={onRegisterClick}
                className="inline-flex items-center gap-2 rounded-full border border-fuchsia-300/30 bg-fuchsia-300/10 px-4 py-2 text-sm font-black text-fuchsia-100 transition hover:border-fuchsia-300/50 hover:bg-fuchsia-300/20"
              >
                <FiUserPlus />
                <span className="hidden sm:inline">Register</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onProfileClick}
                className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm font-black text-cyan-100 transition hover:border-cyan-300/50 hover:bg-cyan-300/20"
                title={authEmail || 'View profile'}
              >
                <FiUser />
                <span className="hidden sm:inline">Profile</span>
              </button>
              <button
                type="button"
                onClick={onLogoutClick}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-black text-theme-strong transition hover:bg-white/15"
                title={authEmail || 'Logged in'}
              >
                <FiLogOut />
                <span className="hidden sm:inline">Logout</span>
              </button>
              <button
                type="button"
                onClick={toggleTheme}
                className={`relative inline-flex h-10 w-20 shrink-0 items-center rounded-full border p-1 transition ${
                  isDark
                    ? 'border-cyan-300/40 bg-[#09082f] shadow-[0_0_24px_rgba(34,211,238,0.20)]'
                    : 'border-rose-300/60 bg-[#321536] shadow-[0_0_24px_rgba(251,113,133,0.18)]'
                }`}
                aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                <span
                  className={`absolute inset-y-1 grid h-8 w-8 place-items-center rounded-full text-slate-950 shadow-lg transition-transform ${
                    isDark
                      ? 'translate-x-10 bg-cyan-300'
                      : 'translate-x-0 bg-gradient-to-br from-amber-300 to-rose-500'
                  }`}
                >
                  {isDark ? <FiMoon className="text-base" /> : <FiSun className="text-base" />}
                </span>
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

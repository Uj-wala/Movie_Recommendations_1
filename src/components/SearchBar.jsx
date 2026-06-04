import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FiSearch, FiX, FiZap, FiClock, FiArrowLeft, FiArrowRight } from 'react-icons/fi';
import { useDebounce } from '../hooks/useDebounce';

const parseTimestamp = (timestamp) => {
  if (!timestamp) return null;
  if (timestamp instanceof Date) return timestamp;

  const value = String(timestamp).trim();
  if (!value) return null;

  const normalized = value.replace(' ', 'T');
  const isoLocal = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?$/;

  if (isoLocal.test(normalized)) {
    const [datePart, timePart] = normalized.split('T');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hour, minute, second] = timePart.split(':').map(Number);
    return new Date(year, month - 1, day, hour, minute, second);
  }

  const parsed = new Date(normalized);
  if (!Number.isNaN(parsed.getTime())) return parsed;

  return null;
};

const formatTimestamp = (timestamp) => {
  try {
    const date = parseTimestamp(timestamp);
    if (!date || Number.isNaN(date.getTime())) return '';

    const now = new Date();
    const diffInSeconds = Math.max(Math.floor((now.getTime() - date.getTime()) / 1000), 0);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
};

export const SearchBar = ({
  onSearch,
  isLoading,
  recentSearches = [],
  onRecentSearch,
  historyPagination = { page: 1, totalPages: 0, totalItems: 0, limit: 8 },
  onHistoryPageChange,
  isAuthenticated = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 450);
  const hasPaginatedHistory = isAuthenticated && historyPagination.totalPages > 1;

  useEffect(() => {
    const query = debouncedSearchTerm.trim();

    if (!query) {
      onSearch('', { remember: false });
      return;
    }

    if (query.length >= 2) {
      onSearch(query, { remember: false });
    }
  }, [debouncedSearchTerm, onSearch]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!searchTerm.trim()) return;
    onSearch(searchTerm.trim(), { remember: true });
  };

  const applyRecentSearch = (item) => {
    const searchKeyword = typeof item === 'string' ? item : item.keyword;
    setSearchTerm(searchKeyword);
    onRecentSearch(searchKeyword, { remember: true });
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-3xl">
      <motion.div
        className="group relative"
        whileFocusWithin={{ scale: 1.015 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      >
        <div className="absolute -inset-1 rounded-[1.65rem] bg-gradient-to-r from-cyan-300 via-fuchsia-400 to-indigo-400 opacity-45 blur-lg transition duration-300 group-focus-within:opacity-80" />
        <div className="relative flex items-center gap-3 rounded-[1.55rem] border border-white/15 bg-slate-950/70 px-5 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_24px_80px_rgba(8,13,35,0.45)] backdrop-blur-2xl sm:px-6">
          <FiSearch className="h-5 w-5 shrink-0 text-cyan-700 dark:text-cyan-200" />
          <input
            type="text"
            placeholder="Search Interstellar, Batman, Dune..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="min-w-0 flex-1 bg-transparent text-base font-semibold text-theme-strong outline-none placeholder:text-slate-500 dark:placeholder:text-slate-400 sm:text-lg"
          />

          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/10 text-theme-muted transition hover:bg-white/20 hover:text-theme-strong"
              aria-label="Clear search"
            >
              <FiX />
            </button>
          )}

          <button
            type="submit"
            disabled={isLoading || !searchTerm.trim()}
            className="inline-flex h-9 items-center rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 text-xs font-bold text-cyan-700 transition hover:bg-cyan-300/20 disabled:cursor-not-allowed disabled:opacity-50 dark:text-cyan-100"
          >
            Search
          </button>

          {isLoading && <FiZap className="h-5 w-5 animate-pulse text-fuchsia-600 dark:text-fuchsia-300" />}
        </div>
      </motion.div>

      {recentSearches.length > 0 && (
        <div className="mt-5 space-y-2">
          <div className="flex items-center justify-between gap-3 px-1">
            <div className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              Recent Searches
            </div>
            {hasPaginatedHistory && (
              <div className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                Page {historyPagination.page} of {historyPagination.totalPages}
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            {recentSearches.map((item, index) => {
              const keyword = typeof item === 'string' ? item : item.keyword;
              const timestamp = typeof item === 'string' ? null : item.created_at;

              return (
                <button
                  type="button"
                  key={`${keyword}-${index}`}
                  onClick={() => applyRecentSearch(item)}
                  className="group flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-bold text-theme-muted backdrop-blur transition hover:border-cyan-300/50 hover:bg-cyan-300/10 hover:text-cyan-700 dark:text-slate-200 dark:hover:text-cyan-100"
                  title={timestamp ? new Date(timestamp).toLocaleString() : ''}
                >
                  <span>{keyword}</span>
                  {timestamp && (
                    <span className="flex items-center gap-1 text-[0.65rem] text-slate-400 group-hover:text-cyan-600 dark:group-hover:text-cyan-200/70">
                      <FiClock className="h-3 w-3" />
                      {formatTimestamp(timestamp)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {hasPaginatedHistory && onHistoryPageChange && (
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <HistoryPageButton
                onClick={() => onHistoryPageChange(historyPagination.page - 1)}
                disabled={historyPagination.page <= 1}
              >
                <FiArrowLeft />
                <span className="hidden sm:inline">Older</span>
              </HistoryPageButton>

              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                {historyPagination.totalItems} saved searches
              </span>

              <HistoryPageButton
                onClick={() => onHistoryPageChange(historyPagination.page + 1)}
                disabled={historyPagination.page >= historyPagination.totalPages}
              >
                <span className="hidden sm:inline">Newer</span>
                <FiArrowRight />
              </HistoryPageButton>
            </div>
          )}
        </div>
      )}
    </form>
  );
};

const HistoryPageButton = ({ children, onClick, disabled = false }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="inline-flex h-10 items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 text-xs font-black text-theme-strong transition hover:border-cyan-300/40 hover:bg-cyan-300/10 disabled:cursor-not-allowed disabled:opacity-40"
  >
    {children}
  </button>
);

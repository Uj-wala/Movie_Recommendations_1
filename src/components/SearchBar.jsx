import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FiSearch, FiX, FiZap } from 'react-icons/fi';
import { useDebounce } from '../hooks/useDebounce';

export const SearchBar = ({ onSearch, isLoading, recentSearches = [], onRecentSearch }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    onSearch(debouncedSearchTerm);
  }, [debouncedSearchTerm, onSearch]);

  const applyRecentSearch = (term) => {
    setSearchTerm(term);
    onRecentSearch(term);
  };

  return (
    <div className="w-full max-w-3xl">
      <motion.div
        className="group relative"
        whileFocusWithin={{ scale: 1.015 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      >
        <div className="absolute -inset-1 rounded-[1.65rem] bg-gradient-to-r from-cyan-300 via-fuchsia-400 to-indigo-400 opacity-45 blur-lg transition duration-300 group-focus-within:opacity-80" />
        <div className="relative flex items-center gap-3 rounded-[1.55rem] border border-white/15 bg-slate-950/70 px-5 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_24px_80px_rgba(8,13,35,0.45)] backdrop-blur-2xl sm:px-6">
          <FiSearch className="h-5 w-5 shrink-0 text-cyan-200" />
          <input
            type="text"
            placeholder="Search Interstellar, Batman, Dune..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            disabled={isLoading}
            className="min-w-0 flex-1 bg-transparent text-base font-semibold text-white outline-none placeholder:text-slate-500 disabled:opacity-50 sm:text-lg"
          />

          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/10 text-slate-300 transition hover:bg-white/20 hover:text-white"
              aria-label="Clear search"
            >
              <FiX />
            </button>
          )}

          {isLoading && <FiZap className="h-5 w-5 animate-pulse text-fuchsia-300" />}
        </div>
      </motion.div>

      {recentSearches.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {recentSearches.map((term) => (
            <button
              type="button"
              key={term}
              onClick={() => applyRecentSearch(term)}
              className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-bold text-slate-200 backdrop-blur transition hover:border-cyan-300/50 hover:bg-cyan-300/10 hover:text-cyan-100"
            >
              {term}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

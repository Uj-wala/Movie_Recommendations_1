import { FiMoon, FiSun } from 'react-icons/fi';
import { useTheme } from '../context/useTheme';

export const ThemeToggle = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-black text-white backdrop-blur-xl transition hover:border-cyan-300/40 hover:bg-cyan-300/10"
      aria-label="Toggle theme"
    >
      {isDark ? <FiMoon className="text-cyan-200" /> : <FiSun className="text-amber-200" />}
      <span>{isDark ? 'Dark' : 'Light'}</span>
    </button>
  );
};

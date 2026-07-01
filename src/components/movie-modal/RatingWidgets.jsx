import { FiStar } from 'react-icons/fi';

export const StarRatingInput = ({ rating, onChange }) => (
  <div className="flex items-center gap-1">
    {Array.from({ length: 5 }, (_, index) => index + 1).map((value) => {
      const active = value <= rating;
      return (
        <button
          key={value}
          type="button"
          onClick={() => onChange(value)}
          className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-slate-950/70 text-lg transition hover:border-amber-300/60 hover:bg-amber-300/10"
          aria-label={`Set rating to ${value} star${value === 1 ? '' : 's'}`}
        >
          <FiStar className={active ? 'fill-current text-amber-300' : 'text-slate-500'} />
        </button>
      );
    })}
  </div>
);

export const StarDisplay = ({ rating }) => {
  const normalized = Math.max(0, Math.min(5, Number.parseFloat(rating) || 0));

  return (
    <div className="flex items-center gap-1" aria-label={`Rated ${normalized.toFixed(1)} out of 5`}>
      {Array.from({ length: 5 }, (_, index) => index + 1).map((value) => {
        const active = value <= Math.round(normalized);
        return <FiStar key={value} className={active ? 'fill-current text-amber-300' : 'text-slate-600'} />;
      })}
    </div>
  );
};

export const InfoBlock = ({ label, value, icon, wide = false }) => {
  if (!value || value === 'N/A') return null;

  return (
    <div className={`rounded-2xl border border-white/10 bg-white/10 p-4 ${wide ? 'sm:col-span-2' : ''}`}>
      <p className="mb-2 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-cyan-200">
        {icon}
        {label}
      </p>
      <p className="text-sm leading-6 text-white">{value}</p>
    </div>
  );
};

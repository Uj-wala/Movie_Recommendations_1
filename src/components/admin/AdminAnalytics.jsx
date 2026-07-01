export const StatCard = ({ icon, label, value, subtitle }) => (
  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.07)] dark:border-slate-800 dark:bg-slate-900/95 dark:shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
    <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
      <div className="grid h-11 w-11 place-items-center rounded-2xl bg-cyan-100 text-cyan-700 dark:bg-cyan-300/10 dark:text-cyan-200">
        {icon}
      </div>
      <p className="text-xs font-black uppercase tracking-[0.22em]">{label}</p>
    </div>
    <p className="mt-4 text-3xl font-black text-slate-950 dark:text-white">{value}</p>
    {subtitle && <p className="mt-2 text-sm text-slate-400">{subtitle}</p>}
  </div>
);

export const AnalyticsCard = ({ title, subtitle, children }) => (
  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.07)] dark:border-slate-800 dark:bg-slate-900/95 dark:shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
    <div className="mb-4">
      <h3 className="text-lg font-black text-slate-950 dark:text-white">{title}</h3>
      <p className="mt-1 text-sm leading-6 text-slate-400">{subtitle}</p>
    </div>
    {children}
  </div>
);

export const DonutChart = ({ primary, secondary, centerLabel, centerCaption, isDark }) => {
  const total = Math.max(primary + secondary, 1);
  const primaryShare = primary / total;
  const circumference = 2 * Math.PI * 42;
  const primaryOffset = circumference * (1 - primaryShare);
  const accent = isDark ? '#22d3ee' : '#0891b2';
  const muted = isDark ? '#334155' : '#cbd5e1';

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 120 120" className="h-40 w-40">
        <circle cx="60" cy="60" r="42" fill="none" stroke={muted} strokeWidth="14" opacity="0.35" />
        <circle
          cx="60"
          cy="60"
          r="42"
          fill="none"
          stroke={accent}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={primaryOffset}
          transform="rotate(-90 60 60)"
        />
        <circle cx="60" cy="60" r="28" fill={isDark ? '#020617' : '#0f172a'} />
        <text x="60" y="56" textAnchor="middle" className="fill-white text-[18px] font-black">
          {centerLabel}
        </text>
        <text x="60" y="71" textAnchor="middle" className="fill-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
          {centerCaption}
        </text>
      </svg>

      <div className="flex w-full justify-between gap-3 text-xs font-black uppercase tracking-[0.18em] text-slate-400">
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-cyan-300" />
          Admins {primary}
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-slate-500" />
          Users {secondary}
        </span>
      </div>
    </div>
  );
};

export const BarChart = ({ data, maxCount, isDark }) => {
  const height = 140;
  const width = 240;
  const bars = data.length || 1;
  const gap = 8;
  const barWidth = (width - gap * (bars - 1)) / bars;
  const fill = isDark ? '#22d3ee' : '#0f766e';
  const base = isDark ? '#1e293b' : '#cbd5e1';

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-40 w-full">
      <line x1="0" y1={height - 1} x2={width} y2={height - 1} stroke={base} strokeWidth="1" opacity="0.5" />
      {data.map((bucket, index) => {
        const barHeight = bucket.count === 0 ? 4 : (bucket.count / maxCount) * (height - 30);
        const x = index * (barWidth + gap);
        const y = height - barHeight - 16;
        return (
          <g key={bucket.rating}>
            <rect x={x} y={y} width={barWidth} height={barHeight} rx="10" fill={fill} opacity="0.9" />
            <text x={x + barWidth / 2} y={height - 2} textAnchor="middle" className="fill-slate-400 text-[10px] font-black">
              {bucket.rating}
            </text>
            <text x={x + barWidth / 2} y={Math.max(y - 4, 12)} textAnchor="middle" className="fill-white text-[10px] font-black">
              {bucket.count}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

export const SparklineChart = ({ data, isDark }) => {
  const width = 320;
  const height = 120;
  const maxValue = Math.max(...data, 1);
  const points = data
    .map((value, index) => {
      const x = (index / Math.max(data.length - 1, 1)) * width;
      const y = height - (value / maxValue) * (height - 18) - 6;
      return `${x},${y}`;
    })
    .join(' ');
  const accent = isDark ? '#f472b6' : '#be185d';
  const fill = isDark ? 'rgba(244, 114, 182, 0.18)' : 'rgba(190, 24, 93, 0.18)';

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-36 w-full">
      <defs>
        <linearGradient id="reviewActivityFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fill} />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
      </defs>
      <polyline
        fill="none"
        stroke={accent}
        strokeWidth="3"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={points}
      />
      <polygon
        fill="url(#reviewActivityFill)"
        points={`${points} ${width},${height} 0,${height}`}
      />
      {data.map((value, index) => {
        const x = (index / Math.max(data.length - 1, 1)) * width;
        const y = height - (value / maxValue) * (height - 18) - 6;
        return <circle key={`${index}-${value}`} cx={x} cy={y} r="4" fill={accent} />;
      })}
    </svg>
  );
};

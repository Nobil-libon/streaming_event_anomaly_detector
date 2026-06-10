/**
 * StatCard — reusable metric card with optional trend indicator.
 * Props:
 *   title:     string          — card label
 *   value:     string | number — primary value to display
 *   unit:      string          — unit suffix (e.g. '/min', '%')
 *   icon:      ReactNode       — Lucide icon element
 *   accent:    string          — Tailwind color key: 'blue' | 'rose' | 'emerald' | 'violet' | 'amber' | 'cyan'
 *   sub:       string          — optional subtitle / description
 *   highlight: boolean         — if true, applies glow ring (used for anomaly state)
 *   mono:      boolean         — render value in monospace font
 */

const ACCENT_MAP = {
  blue:    { border: 'border-blue-500/30',    glow: 'glow-blue',    text: 'text-blue-400',    icon: 'text-blue-500',    badge: 'bg-blue-500/10' },
  rose:    { border: 'border-rose-500/40',    glow: 'glow-rose',    text: 'text-rose-400',    icon: 'text-rose-500',    badge: 'bg-rose-500/10' },
  emerald: { border: 'border-emerald-500/30', glow: 'glow-emerald', text: 'text-emerald-400', icon: 'text-emerald-500', badge: 'bg-emerald-500/10' },
  violet:  { border: 'border-violet-500/30',  glow: '',             text: 'text-violet-400',  icon: 'text-violet-500',  badge: 'bg-violet-500/10' },
  amber:   { border: 'border-amber-500/30',   glow: '',             text: 'text-amber-400',   icon: 'text-amber-500',   badge: 'bg-amber-500/10' },
  cyan:    { border: 'border-cyan-500/30',    glow: '',             text: 'text-cyan-400',    icon: 'text-cyan-500',    badge: 'bg-cyan-500/10' },
}

export default function StatCard({
  title,
  value,
  unit = '',
  icon,
  accent = 'blue',
  sub,
  highlight = false,
  mono = false,
}) {
  const a = ACCENT_MAP[accent] ?? ACCENT_MAP.blue

  return (
    <div className={`
      glass rounded-2xl p-5 flex flex-col gap-4 relative overflow-hidden
      border transition-all duration-300
      ${highlight ? `${a.border} ${a.glow} border-anomaly` : `${a.border}`}
      animate-fade-in
    `}>

      {/* Subtle gradient blob */}
      <div className={`absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-20 ${a.badge}`} />

      {/* Header row */}
      <div className="flex items-center justify-between relative z-10">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
          {title}
        </span>
        <div className={`p-2 rounded-xl ${a.badge}`}>
          <span className={a.icon}>{icon}</span>
        </div>
      </div>

      {/* Value */}
      <div className="relative z-10">
        <div className={`
          stat-value flex items-end gap-1.5 leading-none
          ${highlight ? a.text : 'text-white'}
          ${mono ? 'font-mono' : 'font-bold'}
        `}>
          <span className="text-3xl">{value ?? '—'}</span>
          {unit && (
            <span className="text-base text-slate-500 font-normal mb-0.5">{unit}</span>
          )}
        </div>
        {sub && (
          <p className="text-xs text-slate-500 mt-2">{sub}</p>
        )}
      </div>
    </div>
  )
}

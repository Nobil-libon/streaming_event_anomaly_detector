import { ShieldAlert, ShieldCheck, Loader2 } from 'lucide-react'

/**
 * StatusBadge — large pill badge showing current anomaly status.
 * Props:
 *   status: 'normal' | 'anomaly' | 'collecting_baseline'
 */
export default function StatusBadge({ status }) {
  if (status === 'anomaly') {
    return (
      <div className="
        flex items-center gap-3 px-6 py-3 rounded-2xl
        bg-rose-500/15 border border-rose-500/40 border-anomaly
        glow-rose animate-fade-in
      ">
        <ShieldAlert className="w-6 h-6 text-rose-400 animate-pulse" />
        <div>
          <div className="text-rose-300 font-bold text-lg leading-none">ANOMALY</div>
          <div className="text-rose-500/80 text-xs mt-0.5">Threshold exceeded</div>
        </div>
      </div>
    )
  }

  if (status === 'collecting_baseline') {
    return (
      <div className="
        flex items-center gap-3 px-6 py-3 rounded-2xl
        bg-amber-500/10 border border-amber-500/25
        animate-fade-in
      ">
        <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
        <div>
          <div className="text-amber-300 font-bold text-lg leading-none">BASELINE</div>
          <div className="text-amber-500/80 text-xs mt-0.5">Collecting samples…</div>
        </div>
      </div>
    )
  }

  return (
    <div className="
      flex items-center gap-3 px-6 py-3 rounded-2xl
      bg-emerald-500/10 border border-emerald-500/25
      glow-emerald animate-fade-in
    ">
      <ShieldCheck className="w-6 h-6 text-emerald-400" />
      <div>
        <div className="text-emerald-300 font-bold text-lg leading-none">NORMAL</div>
        <div className="text-emerald-500/80 text-xs mt-0.5">All systems nominal</div>
      </div>
    </div>
  )
}

import { AlertTriangle } from 'lucide-react'

/**
 * RecentAnomaliesTable — shows persisted anomalies fetched from SQLite via /anomalies.
 * Props:
 *   anomalies: Array<{ id, timestamp, orders_per_minute, z_score, explanation }>
 */
export default function RecentAnomaliesTable({ anomalies = [] }) {
  return (
    <div className="glass rounded-2xl border border-rose-500/20 overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/60">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-rose-400" />
          <span className="font-semibold text-white">Anomaly History</span>
          <span className="text-xs text-slate-500 ml-1">(from SQLite)</span>
        </div>
        <span className="text-xs text-slate-500 font-mono">
          {anomalies.length} recorded
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800/40">
              <th className="text-left px-5 py-3 text-xs text-slate-500 font-semibold uppercase tracking-wider">
                Time
              </th>
              <th className="text-left px-5 py-3 text-xs text-slate-500 font-semibold uppercase tracking-wider">
                OPM
              </th>
              <th className="text-left px-5 py-3 text-xs text-slate-500 font-semibold uppercase tracking-wider">
                Z-Score
              </th>
              <th className="text-left px-5 py-3 text-xs text-slate-500 font-semibold uppercase tracking-wider">
                Explanation
              </th>
            </tr>
          </thead>
          <tbody>
            {anomalies.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-10 text-slate-600 text-sm">
                  No anomalies recorded yet…
                </td>
              </tr>
            ) : (
              anomalies.map((a, i) => (
                <tr
                  key={`anomaly-${a.id ?? i}`}
                  className="event-row border-b border-slate-800/30 bg-rose-500/5"
                >
                  <td className="px-5 py-3 font-mono text-slate-400 text-xs whitespace-nowrap">
                    {a.timestamp}
                  </td>
                  <td className="px-5 py-3 font-mono text-rose-300 text-xs font-semibold">
                    {a.orders_per_minute}
                  </td>
                  <td className="px-5 py-3 font-mono text-xs">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/25 font-semibold">
                      {a.z_score >= 0 ? `+${Number(a.z_score).toFixed(2)}` : Number(a.z_score).toFixed(2)}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-400 text-xs max-w-xs truncate" title={a.explanation}>
                    {a.explanation
                      ? a.explanation.slice(0, 80) + (a.explanation.length > 80 ? '…' : '')
                      : <span className="text-slate-600 italic">No explanation</span>}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

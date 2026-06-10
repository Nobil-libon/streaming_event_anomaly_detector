import { ClipboardList } from 'lucide-react'

/**
 * RecentEventsTable — shows the last N order events with type badge.
 * Props:
 *   events: Array<{ order_id, timestamp, type, opm }>
 */
export default function RecentEventsTable({ events = [] }) {
  return (
    <div className="glass rounded-2xl border border-blue-500/15 overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/60">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-blue-400" />
          <span className="font-semibold text-white">Recent Events</span>
        </div>
        <span className="text-xs text-slate-500 font-mono">
          {events.length} events
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800/40">
              <th className="text-left px-5 py-3 text-xs text-slate-500 font-semibold uppercase tracking-wider">
                Order ID
              </th>
              <th className="text-left px-5 py-3 text-xs text-slate-500 font-semibold uppercase tracking-wider">
                Time
              </th>
              <th className="text-left px-5 py-3 text-xs text-slate-500 font-semibold uppercase tracking-wider">
                OPM
              </th>
              <th className="text-left px-5 py-3 text-xs text-slate-500 font-semibold uppercase tracking-wider">
                Type
              </th>
            </tr>
          </thead>
          <tbody>
            {events.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-10 text-slate-600 text-sm">
                  Waiting for events…
                </td>
              </tr>
            ) : (
              events.slice(0, 15).map((evt, i) => (
                <tr
                  key={`${evt.order_id}-${i}`}
                  className={`
                    event-row border-b border-slate-800/30
                    ${evt.type === 'Anomaly' ? 'bg-rose-500/5' : ''}
                  `}
                >
                  <td className="px-5 py-3 font-mono text-slate-300 text-xs">
                    {evt.order_id}
                  </td>
                  <td className="px-5 py-3 font-mono text-slate-400 text-xs">
                    {evt.timestamp}
                  </td>
                  <td className="px-5 py-3 font-mono text-slate-300 text-xs">
                    {evt.opm}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`
                      inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold
                      ${evt.type === 'Anomaly'
                        ? 'bg-rose-500/15 text-rose-400 border border-rose-500/25'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}
                    `}>
                      {evt.type}
                    </span>
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

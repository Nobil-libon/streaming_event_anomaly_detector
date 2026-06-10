import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts'
import { TrendingUp } from 'lucide-react'

/**
 * Custom tooltip for the chart.
 */
function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  return (
    <div className="glass rounded-xl px-4 py-3 text-sm border border-blue-500/20 shadow-xl">
      <div className="text-slate-400 text-xs mb-1">Orders / min</div>
      <div className="text-blue-300 font-bold font-mono text-lg">
        {payload[0].value}
      </div>
    </div>
  )
}

/**
 * OpmChart — area chart of orders-per-minute history.
 * Props:
 *   opmHistory: number[]   — array of OPM values (up to 60)
 *   isAnomaly:  boolean    — highlights chart in rose when true
 *   threshold:  number     — Z-score threshold annotation (not OPM, but we show a visual band)
 */
export default function OpmChart({ opmHistory = [], isAnomaly = false }) {
  const data = opmHistory.map((v, i) => ({ index: i + 1, opm: v }))

  // Compute mean to draw reference line
  const mean = data.length
    ? Math.round(data.reduce((s, d) => s + d.opm, 0) / data.length)
    : null

  const strokeColor = isAnomaly ? '#f43f5e' : '#3b82f6'
  const fillStart   = isAnomaly ? 'rgba(244,63,94,0.3)' : 'rgba(59,130,246,0.3)'
  const fillEnd     = 'rgba(0,0,0,0)'

  return (
    <div className={`
      glass rounded-2xl p-5 border
      ${isAnomaly ? 'border-rose-500/30 glow-rose' : 'border-blue-500/15'}
      animate-fade-in transition-all duration-500
    `}>
      {/* Card header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <TrendingUp className={`w-5 h-5 ${isAnomaly ? 'text-rose-400' : 'text-blue-400'}`} />
          <span className="font-semibold text-white">Live Orders Trend</span>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-500">
          {mean !== null && (
            <span>
              Avg: <span className="text-slate-300 font-mono font-medium">{mean} OPM</span>
            </span>
          )}
          <span>
            Window: <span className="text-slate-300 font-mono font-medium">{data.length}s</span>
          </span>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-slate-600 text-sm">
          Waiting for data…
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="opmGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={strokeColor} stopOpacity={0.35} />
                <stop offset="95%" stopColor={strokeColor} stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.04)"
              vertical={false}
            />

            <XAxis
              dataKey="index"
              tick={{ fill: '#475569', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />

            <YAxis
              tick={{ fill: '#475569', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />

            <Tooltip content={<CustomTooltip />} />

            {mean !== null && (
              <ReferenceLine
                y={mean}
                stroke="rgba(148,163,184,0.3)"
                strokeDasharray="4 3"
                label={{ value: 'avg', fill: '#64748b', fontSize: 10, position: 'insideRight' }}
              />
            )}

            <Area
              type="monotone"
              dataKey="opm"
              stroke={strokeColor}
              strokeWidth={2.5}
              fill="url(#opmGradient)"
              dot={false}
              activeDot={{ r: 5, fill: strokeColor, strokeWidth: 0 }}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

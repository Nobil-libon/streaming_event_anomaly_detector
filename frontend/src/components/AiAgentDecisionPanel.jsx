import { Shield, AlertCircle, Bell, BellOff, Info } from 'lucide-react'

/**
 * AiAgentDecisionPanel — Displays SRE Agent assessment:
 *   - Severity level (LOW, MEDIUM, HIGH, CRITICAL)
 *   - Identified Possible Cause
 *   - Recommended action
 *   - Alert triage status
 */
export default function AiAgentDecisionPanel({ decision, isAnomaly }) {
  if (!decision) {
    return (
      <div className="glass rounded-2xl border border-blue-500/15 p-6 animate-fade-in flex flex-col items-center justify-center text-center h-full min-h-[220px]">
        <Shield className="w-10 h-10 text-slate-700 mb-3" />
        <p className="text-slate-500 text-sm font-medium">No SRE Agent Decision yet</p>
        <p className="text-slate-600 text-xs mt-1">
          {isAnomaly
            ? 'Agent is analyzing severity and next actions...'
            : 'Decision logs will appear when an anomaly is evaluated'}
        </p>
      </div>
    )
  }

  const { severity, possible_cause, recommendation, requires_alert } = decision

  // Severity styles configuration
  const severityConfig = {
    CRITICAL: {
      bg: 'bg-rose-500/5 border-rose-500/35 text-rose-400',
      badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      glow: 'shadow-[0_0_15px_rgba(244,63,94,0.1)]'
    },
    HIGH: {
      bg: 'bg-amber-500/5 border-amber-500/30 text-amber-400',
      badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      glow: 'shadow-[0_0_12px_rgba(245,158,11,0.08)]'
    },
    MEDIUM: {
      bg: 'bg-yellow-500/5 border-yellow-500/20 text-yellow-300',
      badge: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
      glow: ''
    },
    LOW: {
      bg: 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400',
      badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      glow: ''
    }
  }

  const styles = severityConfig[severity.toUpperCase()] || severityConfig.LOW

  return (
    <div className={`glass rounded-2xl border transition-all duration-500 overflow-hidden animate-fade-in ${styles.bg} ${styles.glow} h-full`}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/60 bg-black/10">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-400" />
          <span className="font-semibold text-white">AI Agent Decision</span>
        </div>
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border font-mono tracking-wider ${styles.badge}`}>
          {severity.toUpperCase()}
        </span>
      </div>

      {/* Body */}
      <div className="px-5 py-5 space-y-4">
        {/* Possible Cause */}
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1.5 font-medium">
            <Info className="w-3.5 h-3.5 text-slate-500" />
            LIGNING ROOT CAUSE
          </div>
          <p className="text-slate-300 text-xs md:text-sm leading-relaxed bg-black/15 p-3 rounded-xl border border-slate-800/40">
            {possible_cause || 'Evaluating root cause...'}
          </p>
        </div>

        {/* Action Recommendation */}
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1.5 font-medium">
            <AlertCircle className="w-3.5 h-3.5 text-slate-500" />
            RECOMMENDED ACTION
          </div>
          <p className="text-slate-200 text-xs md:text-sm font-semibold leading-relaxed bg-black/20 p-3 rounded-xl border border-slate-850/50">
            👉 {recommendation || 'Formulating recommendation...'}
          </p>
        </div>

        {/* Alert Triage Status */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800/40 text-xs">
          <span className="text-slate-400 font-medium">Alert Triage Status:</span>
          {requires_alert ? (
            <span className="flex items-center gap-1.5 font-semibold text-rose-400 animate-pulse">
              <Bell className="w-3.5 h-3.5" />
              Discord Notification Sent
            </span>
          ) : (
            <span className="flex items-center gap-1.5 font-medium text-slate-500">
              <BellOff className="w-3.5 h-3.5" />
              Alert Suppressed (Low Severity)
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

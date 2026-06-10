import { Activity, Wifi, WifiOff } from 'lucide-react'

/**
 * Header — top navigation bar with live connection indicator.
 * Props:
 *   connected: boolean   — whether the WebSocket/REST feed is live
 *   status: string       — 'collecting_baseline' | 'normal' | 'anomaly'
 *   username: string     — logged in user's username
 *   role: string         — logged in user's role
 *   onLogout: function   — callback for logout action
 */
export default function Header({ connected, status, username, role, onLogout }) {
  return (
    <header className="glass sticky top-0 z-50 border-b border-blue-900/30">
      <div className="max-w-screen-2xl mx-auto px-6 py-4 flex items-center justify-between">

        {/* Logo + Title */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Activity className="w-7 h-7 text-accent-blue" />
            {status === 'anomaly' && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            )}
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white leading-none">
              Anomaly Detector
            </h1>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Streaming Event Monitor
            </p>
          </div>
        </div>

        {/* Right side — status pill + connection badge + user info */}
        <div className="flex items-center gap-4">

          {/* System status */}
          <div className={`
            flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide
            ${status === 'anomaly'
              ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
              : status === 'collecting_baseline'
              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
              : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'}
          `}>
            <span className={`
              w-1.5 h-1.5 rounded-full
              ${status === 'anomaly'
                ? 'bg-rose-400 animate-pulse'
                : status === 'collecting_baseline'
                ? 'bg-amber-400 animate-pulse'
                : 'bg-emerald-400'}
            `} />
            {status === 'anomaly'
              ? 'ANOMALY DETECTED'
              : status === 'collecting_baseline'
              ? 'COLLECTING BASELINE'
              : 'SYSTEM NORMAL'}
          </div>

          {/* Connection badge */}
          <div className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
            ${connected
              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
              : 'bg-slate-700/40 text-slate-500 border border-slate-600/30'}
          `}>
            {connected
              ? <><Wifi className="w-3.5 h-3.5" /> Live</>
              : <><WifiOff className="w-3.5 h-3.5" /> Connecting…</>}
          </div>

          {/* Powered-by badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-xs font-medium text-violet-400">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
            Llama 3.1
          </div>

          {/* User Info & Logout Button */}
          {username && (
            <div className="flex items-center gap-3.5 pl-3.5 border-l border-slate-800 animate-fade-in">
              <div className="text-right hidden xs:block">
                <div className="text-xs font-bold text-white leading-none mb-0.5">{username}</div>
                <div className="text-[10px] text-slate-400 uppercase tracking-widest font-mono font-semibold leading-none">{role}</div>
              </div>
              <button
                onClick={onLogout}
                className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-400 text-xs font-semibold tracking-wide transition-colors cursor-pointer"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

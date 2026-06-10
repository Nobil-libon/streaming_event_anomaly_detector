import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Zap,
  BarChart3,
  Activity,
  Hash,
  AlertTriangle,
  Inbox,
  Sliders,
  Cpu,
} from 'lucide-react'

import Header            from './components/Header.jsx'
import StatCard          from './components/StatCard.jsx'
import StatusBadge       from './components/StatusBadge.jsx'
import OpmChart          from './components/OpmChart.jsx'
import RecentEventsTable    from './components/RecentEventsTable.jsx'
import RecentAnomaliesTable from './components/RecentAnomaliesTable.jsx'
import AiAnalysisPanel   from './components/AiAnalysisPanel.jsx'
import AiAgentDecisionPanel from './components/AiAgentDecisionPanel.jsx'
import Login from './pages/Login.jsx'
import SystemControls from './components/SystemControls.jsx'

// ---------------------------------------------------------------------------
// Default / skeleton state — shown while the first API response hasn't arrived
// ---------------------------------------------------------------------------
const DEFAULT_STATE = {
  opm:           0,
  z_score:       0.0,
  is_anomaly:    false,
  total_events:  0,
  anomaly_count: 0,
  queue_size:    0,
  threshold:     3.0,
  model_name:    'llama3.1',
  opm_history:   [],
  recent_events: [],
  ai_explanation:'',
  status:        'collecting_baseline',
  latest_agent_decision: null,
}

const API_BASE = ''

// ---------------------------------------------------------------------------
export default function App() {
  const [token,      setToken]      = useState(localStorage.getItem('token') || '')
  const [role,       setRole]       = useState(localStorage.getItem('role') || '')
  const [username,   setUsername]   = useState(localStorage.getItem('username') || '')

  const [data,      setData]      = useState(DEFAULT_STATE)
  const [connected, setConnected] = useState(false)
  const [dbData,    setDbData]    = useState({ events: [], anomalies: [] })
  const wsRef = useRef(null)

  const handleLoginSuccess = (newToken, newRole, newUsername) => {
    localStorage.setItem('token', newToken)
    localStorage.setItem('role', newRole)
    localStorage.setItem('username', newUsername)
    setToken(newToken)
    setRole(newRole)
    setUsername(newUsername)
  }

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    localStorage.removeItem('username')
    setToken('')
    setRole('')
    setUsername('')
  }, [])

  // ── WebSocket connection with REST fallback ──────────────────────────────
  const connectWS = useCallback(() => {
    if (!token) return                  // don't connect if not logged in
    if (wsRef.current) return           // already connected

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const ws = new WebSocket(`${wsProtocol}//${window.location.host}/ws`)
    wsRef.current = ws

    ws.onopen  = () => setConnected(true)
    ws.onclose = () => {
      setConnected(false)
      wsRef.current = null
      // Retry after 3 s
      setTimeout(connectWS, 3000)
    }
    ws.onerror = () => ws.close()
    ws.onmessage = (e) => {
      try { setData(JSON.parse(e.data)) } catch { /* ignore */ }
    }
  }, [token])

  // REST polling fallback — kicks in when WS is disconnected
  useEffect(() => {
    if (!token) return                  // don't poll if not logged in
    let pollId = null

    const poll = async () => {
      if (connected) return        // WS is alive — no need to poll
      try {
        const res = await fetch(`${API_BASE}/api/status`)
        if (res.ok) {
          const json = await res.json()
          setData(json)
          setConnected(true)
        }
      } catch { /* backend not ready yet */ }
    }

    if (!connected) {
      poll()
      pollId = setInterval(poll, 1000)
    }

    return () => clearInterval(pollId)
  }, [connected, token])

  // Mount: start WS
  useEffect(() => {
    if (token) {
      connectWS()
    }
    return () => {
      wsRef.current?.close()
      wsRef.current = null
    }
  }, [connectWS, token])

  // ── Periodic SQLite fetch (every 5 s) ────────────────────────────────────
  useEffect(() => {
    if (!token) return // Don't fetch if not logged in
    const fetchDb = async () => {
      try {
        const [evtRes, anomRes] = await Promise.all([
          fetch(`${API_BASE}/events?limit=50`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch(`${API_BASE}/anomalies?limit=20`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
        ])

        if (evtRes.status === 401 || anomRes.status === 401) {
          handleLogout()
          return
        }

        if (evtRes.ok && anomRes.ok) {
          const events    = await evtRes.json()
          const anomalies = await anomRes.json()
          setDbData({ events, anomalies })
        }
      } catch { /* backend not ready */ }
    }
    fetchDb()
    const id = setInterval(fetchDb, 5000)
    return () => clearInterval(id)
  }, [token, handleLogout])

  // ── Derived values ───────────────────────────────────────────────────────
  const isAnomaly     = data.is_anomaly
  const status        = data.status ?? 'collecting_baseline'
  const zScoreDisplay = data.z_score != null
    ? (data.z_score >= 0 ? `+${data.z_score.toFixed(2)}` : data.z_score.toFixed(2))
    : '—'

  // ── Render ───────────────────────────────────────────────────────────────
  if (!token) {
    return <Login onLoginSuccess={handleLoginSuccess} />
  }

  return (
    <div className="min-h-screen bg-surface-900">

      {/* ── Ambient background blobs ── */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-blue-600/5 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-violet-600/5 blur-[120px]" />
        {isAnomaly && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full bg-rose-600/5 blur-[140px] animate-pulse-slow" />
        )}
      </div>

      {/* ── Header ── */}
      <Header connected={connected} status={status} username={username} role={role} onLogout={handleLogout} />

      {/* ── Main content ── */}
      <main className="relative z-10 max-w-screen-2xl mx-auto px-6 py-8 space-y-6">

        {/* ── Row 1: Status badge + top KPI cards ── */}
        <div className="flex flex-wrap items-center gap-4">
          <StatusBadge status={status} />

          <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">

            <StatCard
              title="Orders / Min"
              value={data.opm}
              icon={<Zap className="w-4 h-4" />}
              accent={isAnomaly ? 'rose' : 'blue'}
              highlight={isAnomaly}
              mono
              sub="Current OPM"
            />

            <StatCard
              title="Z-Score"
              value={zScoreDisplay}
              icon={<BarChart3 className="w-4 h-4" />}
              accent={isAnomaly ? 'rose' : 'cyan'}
              highlight={isAnomaly}
              mono
              sub={`Threshold ±${data.threshold}`}
            />

            <StatCard
              title="Total Events"
              value={data.total_events.toLocaleString()}
              icon={<Hash className="w-4 h-4" />}
              accent="violet"
              sub="Since startup"
            />

            <StatCard
              title="Anomaly Count"
              value={data.anomaly_count}
              icon={<AlertTriangle className="w-4 h-4" />}
              accent={data.anomaly_count > 0 ? 'rose' : 'amber'}
              highlight={data.anomaly_count > 0 && isAnomaly}
              sub="Detected total"
            />

            <StatCard
              title="Queue Size"
              value={data.queue_size}
              icon={<Inbox className="w-4 h-4" />}
              accent="emerald"
              sub="Pending events"
            />
          </div>
        </div>

        {/* ── Row 2: Chart (wide) + config cards ── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* OPM trend chart — takes 2/3 width on xl */}
          <div className="xl:col-span-2">
            <OpmChart
              opmHistory={data.opm_history}
              isAnomaly={isAnomaly}
            />
          </div>

          {/* Config / meta cards — 1/3 width */}
          <div className="flex flex-col gap-4">
            <StatCard
              title="Detection Threshold"
              value={`±${data.threshold}`}
              icon={<Sliders className="w-4 h-4" />}
              accent="amber"
              sub="Z-Score cutoff for anomaly"
              mono
            />
            <StatCard
              title="AI Model"
              value={data.model_name}
              icon={<Cpu className="w-4 h-4" />}
              accent="violet"
              sub="Powered by Ollama"
              mono
            />
            <StatCard
              title="Window Size"
              value={data.opm_history.length}
              unit="/ 30"
              icon={<Activity className="w-4 h-4" />}
              accent="cyan"
              sub="Baseline window (samples)"
              mono
            />
          </div>
        </div>

        {/* ── Row 3: Events table + AI panels ── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-1">
            <RecentEventsTable events={data.recent_events} />
          </div>
          {role !== 'viewer' ? (
            <>
              <div className="xl:col-span-1">
                <AiAnalysisPanel
                  explanation={data.ai_explanation}
                  modelName={data.model_name}
                  isAnomaly={isAnomaly}
                />
              </div>
              <div className="xl:col-span-1">
                <AiAgentDecisionPanel
                  decision={data.latest_agent_decision}
                  isAnomaly={isAnomaly}
                />
              </div>
            </>
          ) : (
            <div className="xl:col-span-2 glass rounded-2xl p-8 flex flex-col items-center justify-center border border-slate-800 text-slate-500 text-center select-none min-h-[300px]">
              <Sliders className="w-8 h-8 mb-3 text-slate-700 animate-pulse" />
              <p className="text-sm font-semibold text-slate-400">AI Analysis Triage Logs Locked</p>
              <p className="text-xs text-slate-600 mt-1 max-w-sm">
                You are logged in as a Viewer. Access to real-time AI root-cause analysis is restricted to Analyst and Admin roles.
              </p>
            </div>
          )}
        </div>

        {/* ── Row 3.5: System Controls (Admin & Analyst only) ── */}
        {role !== 'viewer' && (
          <SystemControls
            role={role}
            token={token}
            currentThreshold={data.threshold}
            onThresholdChange={(newVal) => setData(prev => ({ ...prev, threshold: newVal }))}
          />
        )}

        {/* ── Row 4: Persisted anomaly history from SQLite ── */}
        <RecentAnomaliesTable anomalies={dbData.anomalies} />

      </main>

      {/* ── Footer ── */}
      <footer className="relative z-10 text-center py-6 text-xs text-slate-700 border-t border-slate-800/40 mt-6">
        Streaming Event Anomaly Detector · Z-Score Detection · Llama 3.1 AI Analysis
      </footer>
    </div>
  )
}

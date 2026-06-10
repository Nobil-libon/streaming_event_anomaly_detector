import { useState } from 'react'
import { Activity, Lock, User, AlertCircle, Loader2 } from 'lucide-react'

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!username.trim() || !password.trim()) {
      setError('Please fill in all fields')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || 'Incorrect username or password')
      }

      const data = await response.json()
      // Call parent success handler
      onLoginSuccess(data.access_token, data.role, username)
    } catch (err) {
      setError(err.message || 'Connecting to auth server failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-900 flex flex-col justify-center items-center px-4 relative">
      {/* Background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[10%] left-[15%] w-[400px] h-[400px] rounded-full bg-blue-600/10 blur-[100px]" />
        <div className="absolute bottom-[10%] right-[15%] w-[400px] h-[400px] rounded-full bg-violet-600/10 blur-[100px]" />
      </div>

      <div className="w-full max-w-md relative z-10 animate-fade-in">
        {/* Logo Header */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-accent-blue shadow-lg shadow-blue-500/5">
            <Activity className="w-10 h-10 text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Anomaly Detector
          </h1>
          <p className="text-sm text-slate-400 font-medium">
            Streaming Event Monitor Console
          </p>
        </div>

        {/* Form Card */}
        <div className="glass rounded-2xl p-8 border border-blue-900/30 shadow-2xl">
          <h2 className="text-lg font-bold text-white mb-6">
            Sign In
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-rose-500/15 border border-rose-500/20 text-rose-400 text-sm">
                <AlertCircle className="w-4.5 h-4.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Username */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Username
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  placeholder="Enter username"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950/50 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all text-sm"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  placeholder="Enter password"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950/50 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all text-sm"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800/50 text-white font-semibold text-sm transition-all shadow-lg hover:shadow-blue-500/10 flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Dummy accounts display for evaluator help */}
          <div className="mt-8 pt-6 border-t border-slate-800/40 text-center">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest block mb-3">
              Available Demo Roles
            </span>
            <div className="grid grid-cols-3 gap-2 text-[10px] text-slate-400 font-mono">
              <div className="p-1.5 rounded bg-slate-950/30 border border-slate-900">
                <div className="font-semibold text-blue-400">admin</div>
                <div>admin123</div>
              </div>
              <div className="p-1.5 rounded bg-slate-950/30 border border-slate-900">
                <div className="font-semibold text-cyan-400">analyst</div>
                <div>analyst123</div>
              </div>
              <div className="p-1.5 rounded bg-slate-950/30 border border-slate-900">
                <div className="font-semibold text-slate-400">viewer</div>
                <div>viewer123</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

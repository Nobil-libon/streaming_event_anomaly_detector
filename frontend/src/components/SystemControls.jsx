import { useState, useEffect } from 'react'
import { Sliders, Bell, Users, Trash2, Plus, Loader2, Key } from 'lucide-react'

export default function SystemControls({ role, token, currentThreshold, onThresholdChange }) {
  // Threshold state
  const [thresholdInput, setThresholdInput] = useState(currentThreshold || 3.0)
  const [thresholdLoading, setThresholdLoading] = useState(false)
  const [thresholdMsg, setThresholdMsg] = useState({ text: '', type: '' })

  // Alert state
  const [alertMessage, setAlertMessage] = useState('')
  const [alertLoading, setAlertLoading] = useState(false)
  const [alertMsg, setAlertMsg] = useState({ text: '', type: '' })

  // User management state
  const [users, setUsers] = useState([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [newUsername, setNewUsername] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newRole, setNewRole] = useState('viewer')
  const [userActionLoading, setUserActionLoading] = useState(false)
  const [userMsg, setUserMsg] = useState({ text: '', type: '' })

  // Fetch users if admin
  const fetchUsers = async () => {
    if (role !== 'admin') return
    setUsersLoading(true)
    try {
      const res = await fetch('/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setUsers(data)
      }
    } catch (err) {
      console.error('Failed to fetch users', err)
    } finally {
      setUsersLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [role, token])

  // Sync threshold input if currentThreshold changes
  useEffect(() => {
    if (currentThreshold != null) {
      setThresholdInput(currentThreshold)
    }
  }, [currentThreshold])

  // Change Threshold Handler
  const handleThresholdSubmit = async (e) => {
    e.preventDefault()
    setThresholdLoading(true)
    setThresholdMsg({ text: '', type: '' })
    try {
      const res = await fetch('/api/threshold', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ threshold: parseFloat(thresholdInput) })
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.detail || 'Failed to update threshold')
      }
      setThresholdMsg({ text: 'Threshold updated successfully!', type: 'success' })
      onThresholdChange(parseFloat(thresholdInput))
    } catch (err) {
      setThresholdMsg({ text: err.message, type: 'error' })
    } finally {
      setThresholdLoading(false)
    }
  }

  // Trigger Manual Alert Handler
  const handleAlertSubmit = async (e) => {
    e.preventDefault()
    if (!alertMessage.trim()) return
    setAlertLoading(true)
    setAlertMsg({ text: '', type: '' })
    try {
      const res = await fetch('/api/alerts/manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: alertMessage })
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.detail || 'Failed to dispatch alert')
      }
      setAlertMsg({ text: 'Discord webhook alert dispatched!', type: 'success' })
      setAlertMessage('')
    } catch (err) {
      setAlertMsg({ text: err.message, type: 'error' })
    } finally {
      setAlertLoading(false)
    }
  }

  // Add User Handler
  const handleCreateUser = async (e) => {
    e.preventDefault()
    if (!newUsername.trim() || !newPassword.trim()) {
      setUserMsg({ text: 'Please fill in all user fields', type: 'error' })
      return
    }
    setUserActionLoading(true)
    setUserMsg({ text: '', type: '' })
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ username: newUsername, password: newPassword, role: newRole })
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.detail || 'Failed to create user')
      }
      setUserMsg({ text: `User "${newUsername}" created!`, type: 'success' })
      setNewUsername('')
      setNewPassword('')
      setNewRole('viewer')
      fetchUsers()
    } catch (err) {
      setUserMsg({ text: err.message, type: 'error' })
    } finally {
      setUserActionLoading(false)
    }
  }

  // Delete User Handler
  const handleDeleteUser = async (id, username) => {
    if (!confirm(`Are you sure you want to delete user "${username}"?`)) return
    setUserActionLoading(true)
    setUserMsg({ text: '', type: '' })
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.detail || 'Failed to delete user')
      }
      setUserMsg({ text: `User "${username}" deleted.`, type: 'success' })
      fetchUsers()
    } catch (err) {
      setUserMsg({ text: err.message, type: 'error' })
    } finally {
      setUserActionLoading(false)
    }
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <Sliders className="w-5 h-5 text-amber-500" />
        <h2 className="text-lg font-bold text-white tracking-tight">System Control Console</h2>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Card 1: Threshold Controls (Admin only) */}
        <div className="glass rounded-2xl p-6 border border-blue-900/30 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                Configure Threshold
              </span>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                <Sliders className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Adjust the statistical Z-Score cutoff. Values exceeding this threshold will trigger LLM analysis and alerts.
            </p>

            {role === 'admin' ? (
              <form onSubmit={handleThresholdSubmit} className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Z-Score Limit
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.5"
                    max="10.0"
                    value={thresholdInput}
                    onChange={(e) => setThresholdInput(e.target.value)}
                    disabled={thresholdLoading}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-white font-mono text-sm focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
                {thresholdMsg.text && (
                  <div className={`text-xs ${thresholdMsg.type === 'success' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {thresholdMsg.text}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={thresholdLoading}
                  className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:bg-amber-800/40 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer animate-fade-in"
                >
                  {thresholdLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  Save Threshold
                </button>
              </form>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 border border-dashed border-slate-850 rounded-xl bg-slate-950/10 text-slate-500">
                <Key className="w-6 h-6 mb-1 text-slate-600" />
                <span className="text-[10px] uppercase font-mono tracking-wider">Admin Role Required</span>
              </div>
            )}
          </div>
        </div>

        {/* Card 2: Send Alerts (Admin & Analyst) */}
        <div className="glass rounded-2xl p-6 border border-blue-900/30 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                Trigger Manual Alert
              </span>
              <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
                <Bell className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Send a custom high-severity alert notification instantly to the configured Discord channel webhook.
            </p>

            <form onSubmit={handleAlertSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Alert Message
                </label>
                <input
                  type="text"
                  placeholder="e.g. Critical database latency detected manually"
                  value={alertMessage}
                  onChange={(e) => setAlertMessage(e.target.value)}
                  disabled={alertLoading}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-white text-sm focus:outline-none focus:border-rose-500 transition-colors placeholder-slate-600"
                />
              </div>
              {alertMsg.text && (
                <div className={`text-xs ${alertMsg.type === 'success' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {alertMsg.text}
                </div>
              )}
              <button
                type="submit"
                disabled={alertLoading || !alertMessage.trim()}
                className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:bg-rose-800/40 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {alertLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                Trigger Webhook
              </button>
            </form>
          </div>
        </div>

        {/* Card 3: User Management (Admin only) */}
        <div className="glass rounded-2xl p-6 border border-blue-900/30 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                User Directory
              </span>
              <div className="p-2 rounded-xl bg-violet-500/10 text-violet-500">
                <Users className="w-4 h-4" />
              </div>
            </div>

            {role === 'admin' ? (
              <div className="space-y-4 animate-fade-in">
                {/* Users List */}
                <div className="max-h-[110px] overflow-y-auto border border-slate-800/60 rounded-xl bg-slate-950/40 divide-y divide-slate-850">
                  {usersLoading ? (
                    <div className="p-4 flex justify-center text-slate-500 text-xs">
                      <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> Loading directory...
                    </div>
                  ) : users.length === 0 ? (
                    <div className="p-4 text-center text-slate-500 text-xs">No users registered</div>
                  ) : (
                    users.map((u) => (
                      <div key={u.id} className="flex items-center justify-between px-3 py-2 text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-white">{u.username}</span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] uppercase font-mono text-slate-400 leading-none">
                            {u.role}
                          </span>
                        </div>
                        {/* Disable delete for system accounts to avoid lockouts */}
                        {!['admin', 'analyst', 'viewer'].includes(u.username) && (
                          <button
                            onClick={() => handleDeleteUser(u.id, u.username)}
                            disabled={userActionLoading}
                            className="p-1 text-slate-500 hover:text-rose-400 transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Create Form */}
                <form onSubmit={handleCreateUser} className="space-y-2 border-t border-slate-800/40 pt-3">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Username"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      disabled={userActionLoading}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-950/50 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none"
                    />
                    <input
                      type="password"
                      placeholder="Password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={userActionLoading}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-950/50 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value)}
                      disabled={userActionLoading}
                      className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-950/50 border border-slate-800 text-xs text-slate-400 focus:outline-none"
                    >
                      <option value="viewer">Viewer</option>
                      <option value="analyst">Analyst</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button
                      type="submit"
                      disabled={userActionLoading}
                      className="px-3.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:bg-violet-850 text-white font-semibold text-xs flex items-center justify-center cursor-pointer"
                    >
                      {userActionLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  {userMsg.text && (
                    <div className={`text-[10px] ${userMsg.type === 'success' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {userMsg.text}
                    </div>
                  )}
                </form>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 border border-dashed border-slate-850 rounded-xl bg-slate-950/10 text-slate-500">
                <Key className="w-6 h-6 mb-1 text-slate-600" />
                <span className="text-[10px] uppercase font-mono tracking-wider">Admin Role Required</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

import { useState } from 'react'
import api from '../../lib/api'
import { useTheme } from '../../context/ThemeContext'

export default function SettingsModal({ onClose }) {
  const { theme, setTheme } = useTheme()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ text: '', type: '' })

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    setMessage({ text: '', type: '' })
    
    if (newPassword !== confirmPassword) {
      setMessage({ text: 'New passwords do not match.', type: 'error' })
      return
    }

    if (newPassword.length < 8) {
      setMessage({ text: 'New password must be at least 8 characters.', type: 'error' })
      return
    }

    setLoading(true)
    try {
      const { data } = await api.patch('/auth/change-password', {
        currentPassword,
        newPassword
      })
      if (data.success) {
        setMessage({ text: 'Password changed successfully!', type: 'success' })
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      }
    } catch (err) {
      setMessage({
        text: err.response?.data?.message || 'Failed to change password. Please try again.',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-text/30 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-brand-border bg-brand-surface shadow-xl overflow-hidden transition-colors">
        <div className="px-6 py-4 border-b border-brand-border bg-brand-surface-tint flex justify-between items-center">
          <h2 className="text-lg font-extrabold text-brand-text tracking-tight">Settings</h2>
          <button
            onClick={onClose}
            className="text-brand-text-muted hover:text-brand-text cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Theme Section */}
          <section>
            <h3 className="text-sm font-semibold text-brand-text mb-3">Appearance</h3>
            <div className="grid grid-cols-3 gap-3">
              {['light', 'dark', 'system'].map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold capitalize border transition-all duration-200 cursor-pointer ${
                    theme === t
                      ? 'border-brand-primary bg-brand-primary/10 text-brand-primary font-extrabold shadow-sm scale-[1.02]'
                      : 'border-brand-border text-brand-text-muted hover:bg-brand-surface-tint'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </section>

          {/* Password Section */}
          <section>
            <h3 className="text-sm font-semibold text-brand-text mb-3">Change Password</h3>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-brand-text-muted mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full rounded-xl border border-brand-border bg-brand-surface px-3 py-2 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-brand-text-muted mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-xl border border-brand-border bg-brand-surface px-3 py-2 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-brand-text-muted mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-xl border border-brand-border bg-brand-surface px-3 py-2 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all"
                />
              </div>
              
              {message.text && (
                <p
                  className={`text-xs px-4 py-2.5 rounded-xl font-medium ${
                    message.type === 'error'
                      ? 'bg-brand-accent/10 text-brand-accent'
                      : 'bg-brand-primary/10 text-brand-primary'
                  }`}
                >
                  {message.text}
                </p>
              )}
              
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-brand-accent hover:bg-brand-accent-hover px-4 py-3 text-sm font-bold text-brand-surface transition-all duration-200 cursor-pointer shadow-sm disabled:opacity-50"
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  )
}

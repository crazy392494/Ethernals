import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/auth/forgot-password', { email })
      setSent(true)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send reset email')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="text-center animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-emerald-400" />
        </div>
        <h2 className="font-display text-2xl font-bold text-white mb-2">Check your email</h2>
        <p className="text-dark-400 mb-6">
          We've sent a password reset link to <span className="text-white font-medium">{email}</span>
        </p>
        <p className="text-dark-500 text-sm mb-6">Didn't receive it? Check your spam folder or try again.</p>
        <button onClick={() => setSent(false)} className="btn-secondary">
          Try again
        </button>
        <div className="mt-4">
          <Link to="/login" className="text-primary-400 hover:text-primary-300 text-sm transition-colors">
            ← Back to login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <Link to="/login" className="inline-flex items-center gap-2 text-dark-400 hover:text-white text-sm mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to login
      </Link>

      <div className="mb-8">
        <h2 className="font-display text-3xl font-bold text-white mb-2">Reset password</h2>
        <p className="text-dark-400">Enter your email and we'll send you a reset link</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="input-label">Email address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="input-field pl-10"
            />
          </div>
        </div>

        <button type="submit" disabled={loading} className="w-full btn-primary justify-center py-3">
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
          ) : (
            'Send Reset Link'
          )}
        </button>
      </form>
    </div>
  )
}

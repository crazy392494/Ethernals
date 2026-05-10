import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [showPassword, setShowPassword] = useState(false)
  const { register, isLoading } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== form.confirm) {
      toast.error('Passwords do not match')
      setForm(prev => ({ ...prev, password: '', confirm: '' }))
      return
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters')
      setForm(prev => ({ ...prev, password: '', confirm: '' }))
      return
    }
    const result = await register(form.name, form.email, form.password)
    if (result.success) {
      toast.success('Account created! Welcome to Traveloop 🌍')
      navigate('/dashboard')
    } else {
      toast.error(result.error)
      setForm(prev => ({ ...prev, password: '', confirm: '' }))
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h2 className="font-display text-3xl font-bold text-white mb-2">Start your journey</h2>
        <p className="text-dark-400">Create a free account to plan your adventures</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="input-label">Full name</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Alex Explorer"
              className="input-field pl-10"
            />
          </div>
        </div>

        <div>
          <label className="input-label">Email address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com"
              className="input-field pl-10"
            />
          </div>
        </div>

        <div>
          <label className="input-label">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Min. 6 characters"
              className="input-field pl-10 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-200"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="input-label">Confirm password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
            <input
              type="password"
              required
              value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
              placeholder="Repeat password"
              className="input-field pl-10"
            />
          </div>
        </div>

        <p className="text-xs text-dark-400">
          By creating an account you agree to our{' '}
          <span className="text-primary-400 cursor-pointer">Terms of Service</span> and{' '}
          <span className="text-primary-400 cursor-pointer">Privacy Policy</span>.
        </p>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full btn-primary justify-center py-3 text-base"
        >
          {isLoading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</>
          ) : (
            <>Create Account <ArrowRight className="w-4 h-4" /></>
          )}
        </button>
      </form>

      <p className="text-center text-dark-400 text-sm mt-6">
        Already have an account?{' '}
        <Link to="/login" className="text-primary-400 hover:text-primary-300 font-semibold transition-colors">
          Sign in
        </Link>
      </p>
    </div>
  )
}

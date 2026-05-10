import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  User, Mail, Camera, Lock, Globe, Trash2, Save,
  Loader2, MapPin, Bookmark, Eye, EyeOff, AlertTriangle
} from 'lucide-react'
import { userApi } from '../services/api'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'es', label: 'Español' },
  { code: 'de', label: 'Deutsch' },
  { code: 'ja', label: '日本語' },
]

export default function ProfilePage() {
  const { user, updateUser, logout } = useAuthStore()
  const navigate = useNavigate()
  const [tab, setTab] = useState('profile')
  const [profile, setProfile] = useState({ name: '', bio: '', language: 'en', avatarUrl: '' })
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirm: '' })
  const [savedDests, setSavedDests] = useState([])
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => { fetchProfile() }, [])

  const fetchProfile = async () => {
    setFetchLoading(true)
    try {
      const { data } = await userApi.getProfile()
      setProfile({ name: data.name, bio: data.bio || '', language: data.language || 'en', avatarUrl: data.avatar || '' })
      setSavedDests(data.savedDestinations || [])
    } catch {
      toast.error('Failed to load profile')
    } finally {
      setFetchLoading(false)
    }
  }

  const saveProfile = async () => {
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('name', profile.name)
      formData.append('bio', profile.bio)
      formData.append('language', profile.language)
      if (profile.avatarUrl) formData.append('avatarUrl', profile.avatarUrl)
      const { data } = await userApi.updateProfile(formData)
      updateUser(data)
      toast.success('Profile updated!')
    } catch {
      toast.error('Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const changePassword = async () => {
    if (passwords.newPassword !== passwords.confirm) {
      return toast.error('Passwords do not match')
    }
    if (passwords.newPassword.length < 6) {
      return toast.error('Password must be at least 6 characters')
    }
    setLoading(true)
    try {
      await userApi.changePassword({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      })
      setPasswords({ currentPassword: '', newPassword: '', confirm: '' })
      toast.success('Password changed!')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to change password')
    } finally {
      setLoading(false)
    }
  }

  const removeDestination = async (id) => {
    try {
      await userApi.removeDestination(id)
      setSavedDests(prev => prev.filter(d => d.id !== id))
      toast.success('Destination removed')
    } catch {
      toast.error('Failed to remove')
    }
  }

  const deleteAccount = async () => {
    setLoading(true)
    try {
      await userApi.deleteAccount({ password: deletePassword })
      toast.success('Account deleted')
      logout()
      navigate('/login')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete account')
    } finally {
      setLoading(false)
    }
  }

  const TABS = [
    { id: 'profile', label: 'Profile Info' },
    { id: 'password', label: 'Security' },
    { id: 'saved', label: 'Saved Places' },
    { id: 'danger', label: 'Danger Zone' },
  ]

  if (fetchLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-400" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Profile & Settings</h1>
        <p className="text-dark-400 text-sm">Manage your account and preferences</p>
      </div>

      {/* User card */}
      <div className="glass-card p-6 flex items-center gap-5">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold text-2xl overflow-hidden">
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt={profile.name} className="w-full h-full object-cover" />
            ) : (
              profile.name?.charAt(0)?.toUpperCase()
            )}
          </div>
          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary-600 flex items-center justify-center cursor-pointer hover:bg-primary-500 transition-colors">
            <Camera className="w-3.5 h-3.5 text-white" />
          </div>
        </div>
        <div>
          <p className="text-white font-bold text-lg">{profile.name}</p>
          <p className="text-dark-400 text-sm">{user?.email}</p>
          <p className="text-dark-500 text-xs mt-0.5">{profile.bio || 'No bio yet'}</p>
          <div className="flex items-center gap-3 mt-2 text-xs text-dark-400">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {user?._count?.trips || 0} trips
            </span>
            <span className={`badge ${user?.role === 'ADMIN' ? 'badge-upcoming' : 'badge-planning'}`}>
              {user?.role}
            </span>
          </div>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 p-1 bg-dark-800 rounded-xl">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all
              ${tab === t.id
                ? t.id === 'danger' ? 'bg-red-600/20 text-red-400' : 'bg-dark-700 text-white'
                : 'text-dark-400 hover:text-white'
              }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Profile tab */}
      {tab === 'profile' && (
        <div className="glass-card p-6 space-y-4">
          <div>
            <label className="input-label">Full name</label>
            <input type="text" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} className="input-field" />
          </div>
          <div>
            <label className="input-label">Bio</label>
            <textarea value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} rows={3} placeholder="Tell people about yourself..." className="input-field resize-none" />
          </div>
          <div>
            <label className="input-label flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" /> Language
            </label>
            <select value={profile.language} onChange={(e) => setProfile({ ...profile, language: e.target.value })} className="input-field">
              {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
            </select>
          </div>
          <div>
            <label className="input-label">Profile Image URL</label>
            <input type="url" value={profile.avatarUrl} onChange={(e) => setProfile({ ...profile, avatarUrl: e.target.value })} placeholder="https://..." className="input-field" />
          </div>
          <button onClick={saveProfile} disabled={loading} className="btn-primary">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        </div>
      )}

      {/* Password tab */}
      {tab === 'password' && (
        <div className="glass-card p-6 space-y-4">
          <h3 className="text-white font-semibold">Change Password</h3>
          {[
            { label: 'Current Password', key: 'currentPassword' },
            { label: 'New Password', key: 'newPassword' },
            { label: 'Confirm New Password', key: 'confirm' },
          ].map((field) => (
            <div key={field.key}>
              <label className="input-label">{field.label}</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwords[field.key]}
                  onChange={(e) => setPasswords({ ...passwords, [field.key]: e.target.value })}
                  className="input-field pr-10"
                  placeholder="••••••••"
                />
                {field.key === 'currentPassword' && (
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                )}
              </div>
            </div>
          ))}
          <button onClick={changePassword} disabled={loading} className="btn-primary">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
            Update Password
          </button>
        </div>
      )}

      {/* Saved destinations tab */}
      {tab === 'saved' && (
        <div className="glass-card p-6">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-amber-400" />
            Saved Destinations
          </h3>
          {savedDests.length === 0 ? (
            <div className="text-center py-8">
              <MapPin className="w-10 h-10 text-dark-500 mx-auto mb-3" />
              <p className="text-dark-400 text-sm">No saved destinations yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {savedDests.map((dest) => (
                <div key={dest.id} className="relative rounded-xl overflow-hidden group h-28">
                  {dest.imageUrl ? (
                    <img src={dest.imageUrl} alt={dest.cityName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-dark-700" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-dark-950/80 to-transparent" />
                  <div className="absolute bottom-2 left-2">
                    <p className="text-white text-xs font-semibold">{dest.cityName}</p>
                    <p className="text-dark-300 text-xs">{dest.country}</p>
                  </div>
                  <button
                    onClick={() => removeDestination(dest.id)}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-dark-900/60 text-dark-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Danger zone tab */}
      {tab === 'danger' && (
        <div className="glass-card p-6 border border-red-500/20">
          <div className="flex items-center gap-2 mb-4 text-red-400">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="font-semibold">Danger Zone</h3>
          </div>
          <p className="text-dark-400 text-sm mb-4">
            Deleting your account is permanent. All your trips, notes, and data will be permanently removed.
          </p>

          {!showDeleteConfirm ? (
            <button onClick={() => setShowDeleteConfirm(true)} className="btn-danger">
              <Trash2 className="w-4 h-4" /> Delete Account
            </button>
          ) : (
            <div className="space-y-3 p-4 rounded-xl bg-red-500/5 border border-red-500/20">
              <p className="text-red-400 text-sm font-semibold">Enter your password to confirm:</p>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Your password"
                className="input-field border-red-500/30 focus:border-red-500"
              />
              <div className="flex gap-2">
                <button onClick={() => setShowDeleteConfirm(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={deleteAccount} disabled={loading || !deletePassword} className="flex-1 py-2.5 rounded-xl bg-red-600/20 text-red-400 border border-red-600/30 hover:bg-red-600/30 font-semibold text-sm transition-all disabled:opacity-50">
                  {loading ? 'Deleting...' : '⚠️ Confirm Delete'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

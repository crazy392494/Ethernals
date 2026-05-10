import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Save, Loader2, Image, Calendar, Users, DollarSign, ArrowLeft, Sparkles } from 'lucide-react'
import { tripApi, aiApi } from '../services/api'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const COVER_PRESETS = [
  'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800',
  'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800',
  'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800',
  'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800',
  'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800',
  'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=800',
  'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800',
  'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800',
]

export default function CreateTripPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id

  const [form, setForm] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    travelerCount: 1,
    currency: 'USD',
    coverImageUrl: '',
  })
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(isEdit)
  const [aiLoading, setAiLoading] = useState(false)
  const [selectedPreset, setSelectedPreset] = useState(null)

  useEffect(() => {
    if (isEdit) fetchTrip()
  }, [id])

  const fetchTrip = async () => {
    try {
      const { data } = await tripApi.getById(id)
      setForm({
        title: data.title,
        description: data.description || '',
        startDate: data.startDate ? format(new Date(data.startDate), 'yyyy-MM-dd') : '',
        endDate: data.endDate ? format(new Date(data.endDate), 'yyyy-MM-dd') : '',
        travelerCount: data.travelerCount,
        currency: data.currency,
        coverImageUrl: data.coverImage || '',
      })
      setSelectedPreset(data.coverImage)
    } catch {
      toast.error('Failed to load trip')
    } finally {
      setFetchLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title) return toast.error('Trip name is required')

    setLoading(true)
    const formData = new FormData()
    Object.entries(form).forEach(([k, v]) => {
      if (v !== null && v !== undefined && v !== '') formData.append(k, v)
    })

    try {
      if (isEdit) {
        await tripApi.update(id, formData)
        toast.success('Trip updated!')
        navigate(`/trips/${id}`)
      } else {
        const { data } = await tripApi.create(formData)
        toast.success('Trip created! 🎉')
        navigate(`/trips/${data.id}/itinerary`)
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save trip')
    } finally {
      setLoading(false)
    }
  }

  const suggestWithAI = async () => {
    if (!form.title) return toast.error('Enter a trip name first')
    setAiLoading(true)
    try {
      const desc = `A trip ${form.startDate ? `from ${form.startDate}` : ''} ${form.travelerCount > 1 ? `for ${form.travelerCount} travelers` : ''} named "${form.title}".`
      setForm(f => ({ ...f, description: desc }))
      toast.success('AI description generated!')
    } catch {
      toast.error('AI suggestion failed')
    } finally {
      setAiLoading(false)
    }
  }

  if (fetchLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-400" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-dark-400 hover:text-white text-sm mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-white mb-1">
          {isEdit ? 'Edit Trip' : 'Plan New Trip'}
        </h1>
        <p className="text-dark-400 text-sm">
          {isEdit ? 'Update your trip details' : 'Start building your perfect adventure'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Cover image preview */}
        {(form.coverImageUrl || selectedPreset) && (
          <div className="rounded-2xl overflow-hidden h-48 relative">
            <img
              src={form.coverImageUrl || selectedPreset}
              alt="Cover"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-dark-950/60 to-transparent" />
          </div>
        )}

        {/* Basic info */}
        <div className="glass-card p-6 space-y-4">
          <h2 className="text-white font-semibold flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-primary-600/20 flex items-center justify-center text-primary-400 text-xs font-bold">1</span>
            Basic Information
          </h2>

          <div>
            <label className="input-label">Trip Name *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g., European Summer Adventure"
              className="input-field"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="input-label mb-0">Description</label>
              <button
                type="button"
                onClick={suggestWithAI}
                disabled={aiLoading}
                className="flex items-center gap-1 text-xs text-accent-400 hover:text-accent-300 transition-colors"
              >
                <Sparkles className="w-3 h-3" />
                {aiLoading ? 'Generating...' : 'AI Generate'}
              </button>
            </div>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe your trip..."
              rows={3}
              className="input-field resize-none"
            />
          </div>
        </div>

        {/* Dates & travelers */}
        <div className="glass-card p-6 space-y-4">
          <h2 className="text-white font-semibold flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-primary-600/20 flex items-center justify-center text-primary-400 text-xs font-bold">2</span>
            Dates & Travelers
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Start Date
              </label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="input-label flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> End Date
              </label>
              <input
                type="date"
                value={form.endDate}
                min={form.startDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="input-field"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> Travelers
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={form.travelerCount}
                onChange={(e) => setForm({ ...form, travelerCount: parseInt(e.target.value) })}
                className="input-field"
              />
            </div>
            <div>
              <label className="input-label flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5" /> Currency
              </label>
              <select
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                className="input-field"
              >
                {['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'INR', 'SGD', 'AED'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Cover image */}
        <div className="glass-card p-6 space-y-4">
          <h2 className="text-white font-semibold flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-primary-600/20 flex items-center justify-center text-primary-400 text-xs font-bold">3</span>
            Cover Image
          </h2>

          <div>
            <label className="input-label">Image URL (optional)</label>
            <input
              type="url"
              value={form.coverImageUrl}
              onChange={(e) => setForm({ ...form, coverImageUrl: e.target.value })}
              placeholder="https://images.unsplash.com/..."
              className="input-field"
            />
          </div>

          <div>
            <p className="text-xs text-dark-400 mb-2">Or choose from presets:</p>
            <div className="grid grid-cols-4 gap-2">
              {COVER_PRESETS.map((url, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setSelectedPreset(url)
                    setForm({ ...form, coverImageUrl: url })
                  }}
                  className={`aspect-video rounded-lg overflow-hidden border-2 transition-all
                    ${form.coverImageUrl === url ? 'border-primary-500' : 'border-transparent hover:border-dark-500'}`}
                >
                  <img src={url} alt={`Preset ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn-secondary flex-1"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex-1 justify-center"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> {isEdit ? 'Saving...' : 'Creating...'}</>
            ) : (
              <><Save className="w-4 h-4" /> {isEdit ? 'Save Changes' : 'Create Trip'}</>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

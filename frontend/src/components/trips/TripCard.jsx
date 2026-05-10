import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Calendar, MapPin, Users, DollarSign, Edit, Trash2,
  Share2, ExternalLink, MoreHorizontal, Copy
} from 'lucide-react'
import { tripApi } from '../../services/api'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { useState } from 'react'

const STATUS_CLASSES = {
  PLANNING: 'badge-planning',
  UPCOMING: 'badge-upcoming',
  ONGOING: 'badge-ongoing',
  COMPLETED: 'badge-completed',
  CANCELLED: 'badge-cancelled',
}

export default function TripCard({ trip, compact = false, onRefresh }) {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [sharing, setSharing] = useState(false)

  const handleDelete = async (e) => {
    e.stopPropagation()
    if (!window.confirm('Delete this trip?')) return
    try {
      await tripApi.delete(trip.id)
      toast.success('Trip deleted')
      onRefresh?.()
    } catch {
      toast.error('Failed to delete trip')
    }
  }

  const handleShare = async (e) => {
    e.stopPropagation()
    setSharing(true)
    try {
      const { data } = await tripApi.share(trip.id)
      navigator.clipboard.writeText(data.shareUrl)
      toast.success('Share link copied! 🔗')
    } catch {
      toast.error('Failed to share trip')
    } finally {
      setSharing(false)
    }
  }

  const duration = trip.startDate && trip.endDate
    ? Math.ceil((new Date(trip.endDate) - new Date(trip.startDate)) / (1000 * 60 * 60 * 24))
    : trip.stops?.reduce((s, stop) => s + (stop.nights || 0), 0) || null

  if (compact) {
    return (
      <motion.div
        layout
        onClick={() => navigate(`/trips/${trip.id}`)}
        className="glass-card p-4 hover-card cursor-pointer flex gap-3 items-center"
      >
        {trip.coverImage && (
          <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0">
            <img src={trip.coverImage} alt={trip.title} className="w-full h-full object-cover" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`badge text-[10px] ${STATUS_CLASSES[trip.status] || 'badge-planning'}`}>
              {trip.status?.charAt(0) + trip.status?.slice(1).toLowerCase()}
            </span>
          </div>
          <p className="text-white font-semibold text-sm truncate">{trip.title}</p>
          <p className="text-dark-400 text-xs">
            {trip.stops?.length || 0} cities · {trip.currency} {(trip.totalBudget || 0).toLocaleString()}
          </p>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/trips/${trip.id}/edit`) }}
            className="p-1.5 rounded text-dark-500 hover:text-primary-400 hover:bg-dark-700/50 transition-colors"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleDelete}
            className="p-1.5 rounded text-dark-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      layout
      className="glass-card overflow-hidden hover-card group cursor-pointer"
      onClick={() => navigate(`/trips/${trip.id}`)}
    >
      {/* Cover image */}
      <div className="relative h-44 overflow-hidden">
        {trip.coverImage ? (
          <img
            src={trip.coverImage}
            alt={trip.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary-900/30 to-dark-800 flex items-center justify-center">
            <span className="text-4xl opacity-30">✈️</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-dark-950/80 to-transparent" />

        {/* Status badge */}
        <div className="absolute top-3 left-3">
          <span className={`badge ${STATUS_CLASSES[trip.status] || 'badge-planning'}`}>
            {trip.status?.charAt(0) + trip.status?.slice(1).toLowerCase()}
          </span>
        </div>

        {/* Actions */}
        <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/trips/${trip.id}/edit`) }}
            className="p-1.5 rounded-lg bg-dark-900/70 backdrop-blur-sm text-dark-200 hover:text-white transition-colors"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleShare}
            className="p-1.5 rounded-lg bg-dark-900/70 backdrop-blur-sm text-dark-200 hover:text-white transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleDelete}
            className="p-1.5 rounded-lg bg-dark-900/70 backdrop-blur-sm text-dark-200 hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Duration badge */}
        {duration && (
          <div className="absolute bottom-3 right-3">
            <span className="px-2 py-1 rounded-lg bg-dark-900/70 backdrop-blur-sm text-xs text-dark-200">
              {duration} days
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-white font-bold mb-1 line-clamp-1">{trip.title}</h3>
        {trip.description && (
          <p className="text-dark-400 text-xs line-clamp-1 mb-3">{trip.description}</p>
        )}

        {/* Stats row */}
        <div className="flex items-center gap-3 text-xs text-dark-400">
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3 text-primary-400" />
            {trip.stops?.length || 0} cities
          </span>
          {(trip.startDate || trip.endDate) && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-accent-400" />
              {trip.startDate && format(new Date(trip.startDate), 'dd MMM')}
              {trip.endDate && ` — ${format(new Date(trip.endDate), 'dd MMM yyyy')}`}
            </span>
          )}
          <span className="flex items-center gap-1 ml-auto">
            <DollarSign className="w-3 h-3 text-emerald-400" />
            {trip.currency} {(trip.totalBudget || 0).toLocaleString()}
          </span>
        </div>

        {/* Stops preview */}
        {trip.stops?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {trip.stops.slice(0, 3).map((stop) => (
              <span key={stop.id} className="px-2 py-0.5 rounded-full bg-dark-700/50 text-dark-300 text-xs">
                📍 {stop.cityName}
              </span>
            ))}
            {trip.stops.length > 3 && (
              <span className="px-2 py-0.5 rounded-full bg-dark-700/50 text-dark-500 text-xs">
                +{trip.stops.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}

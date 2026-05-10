import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  MapPin, Calendar, Users, DollarSign, Edit, Trash2, Share2,
  Map, Package, BookOpen, ArrowLeft, Copy, Check, ExternalLink,
  Cloud, BarChart3
} from 'lucide-react'
import { tripApi, weatherApi } from '../services/api'
import { format, differenceInDays } from 'date-fns'
import toast from 'react-hot-toast'
import LoadingSkeleton from '../components/ui/LoadingSkeleton'

const TRIP_TABS = [
  { id: 'overview', label: 'Overview', icon: MapPin },
  { id: 'itinerary', label: 'Itinerary', icon: Map, href: 'itinerary' },
  { id: 'budget', label: 'Budget', icon: DollarSign, href: 'budget' },
  { id: 'packing', label: 'Packing', icon: Package, href: 'packing' },
  { id: 'notes', label: 'Notes', icon: BookOpen, href: 'notes' },
]

const StatusBadge = ({ status }) => {
  const classes = {
    PLANNING: 'badge-planning', UPCOMING: 'badge-upcoming',
    ONGOING: 'badge-ongoing', COMPLETED: 'badge-completed', CANCELLED: 'badge-cancelled'
  }
  return (
    <span className={`badge ${classes[status] || 'badge-planning'}`}>
      {status?.charAt(0) + status?.slice(1).toLowerCase()}
    </span>
  )
}

export default function TripDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [trip, setTrip] = useState(null)
  const [loading, setLoading] = useState(true)
  const [weather, setWeather] = useState({})
  const [sharing, setSharing] = useState(false)
  const [copied, setCopied] = useState(false)
  const [shareUrl, setShareUrl] = useState('')

  useEffect(() => { fetchTrip() }, [id])

  const fetchTrip = async () => {
    setLoading(true)
    try {
      const { data } = await tripApi.getById(id)
      setTrip(data)
      if (data.shareToken && data.isPublic) {
        setShareUrl(`${window.location.origin}/shared/${data.shareToken}`)
      }
      // Fetch weather for first stop
      if (data.stops?.[0]?.cityName) {
        fetchWeather(data.stops[0].cityName)
      }
    } catch {
      toast.error('Trip not found')
      navigate('/trips')
    } finally {
      setLoading(false)
    }
  }

  const fetchWeather = async (city) => {
    try {
      const { data } = await weatherApi.getWeather(city)
      setWeather(data)
    } catch {}
  }

  const handleDelete = async () => {
    if (!window.confirm('Delete this trip? This cannot be undone.')) return
    try {
      await tripApi.delete(id)
      toast.success('Trip deleted')
      navigate('/trips')
    } catch {
      toast.error('Failed to delete trip')
    }
  }

  const handleShare = async () => {
    setSharing(true)
    try {
      const { data } = await tripApi.share(id)
      setShareUrl(data.shareUrl)
      setTrip(prev => ({ ...prev, isPublic: true, shareToken: data.shareToken }))
      toast.success('Share link generated!')
    } catch {
      toast.error('Failed to generate link')
    } finally {
      setSharing(false)
    }
  }

  const copyShareUrl = () => {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    toast.success('Link copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <LoadingSkeleton className="h-64" />
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <LoadingSkeleton key={i} className="h-24" />)}
        </div>
      </div>
    )
  }

  if (!trip) return null

  const duration = trip.startDate && trip.endDate
    ? differenceInDays(new Date(trip.endDate), new Date(trip.startDate))
    : trip.stops?.reduce((s, stop) => s + (stop.nights || 0), 0)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back */}
      <button onClick={() => navigate('/trips')} className="flex items-center gap-2 text-dark-400 hover:text-white text-sm transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Trips
      </button>

      {/* Cover & title */}
      <div className="relative rounded-2xl overflow-hidden h-64">
        {trip.coverImage ? (
          <img src={trip.coverImage} alt={trip.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary-900/50 to-dark-800" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/40 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <StatusBadge status={trip.status} />
                {trip.isPublic && (
                  <span className="badge bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                    🌐 Public
                  </span>
                )}
              </div>
              <h1 className="font-display text-3xl font-bold text-white mb-1">{trip.title}</h1>
              <p className="text-dark-300 text-sm">{trip.description}</p>
            </div>

            <div className="flex items-center gap-2">
              <Link to={`/trips/${id}/edit`} className="btn-secondary text-sm">
                <Edit className="w-4 h-4" /> Edit
              </Link>
              <button onClick={handleShare} disabled={sharing} className="btn-secondary text-sm">
                <Share2 className="w-4 h-4" /> Share
              </button>
              <button onClick={handleDelete} className="btn-danger text-sm">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Share URL */}
      {shareUrl && (
        <div className="glass-card p-4 flex items-center gap-3">
          <ExternalLink className="w-4 h-4 text-primary-400 flex-shrink-0" />
          <input
            readOnly
            value={shareUrl}
            className="flex-1 bg-transparent text-dark-300 text-sm outline-none"
          />
          <button onClick={copyShareUrl} className="btn-secondary text-xs py-1.5">
            {copied ? <><Check className="w-3.5 h-3.5 text-emerald-400" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
          </button>
        </div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Duration', value: `${duration || 0} days`, icon: Calendar, color: 'text-primary-400' },
          { label: 'Cities', value: trip.stops?.length || 0, icon: MapPin, color: 'text-accent-400' },
          { label: 'Travelers', value: trip.travelerCount, icon: Users, color: 'text-amber-400' },
          { label: 'Budget', value: `${trip.currency} ${(trip.totalBudget || 0).toLocaleString()}`, icon: DollarSign, color: 'text-emerald-400' },
        ].map((stat) => (
          <div key={stat.label} className="glass-card p-4">
            <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
            <p className="text-dark-400 text-xs mb-1">{stat.label}</p>
            <p className="text-white font-bold text-lg">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Dates */}
      {(trip.startDate || trip.endDate) && (
        <div className="glass-card p-4 flex items-center gap-4">
          <Calendar className="w-5 h-5 text-primary-400" />
          <div className="flex items-center gap-3 text-sm">
            <div>
              <p className="text-dark-400 text-xs">Departure</p>
              <p className="text-white font-medium">
                {trip.startDate ? format(new Date(trip.startDate), 'dd MMM yyyy') : 'TBD'}
              </p>
            </div>
            <div className="text-dark-600">→</div>
            <div>
              <p className="text-dark-400 text-xs">Return</p>
              <p className="text-white font-medium">
                {trip.endDate ? format(new Date(trip.endDate), 'dd MMM yyyy') : 'TBD'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Weather widget */}
      {weather.city && (
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Cloud className="w-4 h-4 text-blue-400" />
            <span className="text-white text-sm font-semibold">Weather in {weather.city}</span>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-4xl font-bold text-white">{weather.temp}°C</div>
            <div className="text-dark-300 text-sm">
              <p>{weather.condition}</p>
              <p>Humidity: {weather.humidity}%</p>
              <p>Wind: {weather.windSpeed} km/h</p>
            </div>
            <div className="flex gap-2 ml-auto">
              {weather.forecast?.slice(0, 4).map((f, i) => (
                <div key={i} className="text-center">
                  <p className="text-dark-400 text-xs">{f.day}</p>
                  <p className="text-white text-xs font-semibold">{f.high}°</p>
                  <p className="text-dark-500 text-xs">{f.low}°</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick action links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Build Itinerary', icon: Map, href: `/trips/${id}/itinerary`, color: 'from-primary-600/20 to-primary-800/20 border-primary-600/30 text-primary-400' },
          { label: 'Manage Budget', icon: DollarSign, href: `/trips/${id}/budget`, color: 'from-amber-600/20 to-amber-800/20 border-amber-600/30 text-amber-400' },
          { label: 'Packing List', icon: Package, href: `/trips/${id}/packing`, color: 'from-emerald-600/20 to-emerald-800/20 border-emerald-600/30 text-emerald-400' },
          { label: 'Notes & Journal', icon: BookOpen, href: `/trips/${id}/notes`, color: 'from-accent-600/20 to-accent-800/20 border-accent-600/30 text-accent-400' },
        ].map((action) => (
          <Link
            key={action.label}
            to={action.href}
            className={`glass-card p-4 hover-card border bg-gradient-to-br ${action.color} flex flex-col items-center gap-2 text-center`}
          >
            <action.icon className="w-6 h-6" />
            <span className="text-sm font-semibold text-white">{action.label}</span>
          </Link>
        ))}
      </div>

      {/* Stops timeline */}
      {trip.stops?.length > 0 && (
        <div className="glass-card p-6">
          <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary-400" /> Itinerary Overview
          </h2>
          <div className="relative">
            {trip.stops.map((stop, i) => (
              <div key={stop.id} className="flex gap-4 mb-6 last:mb-0">
                <div className="flex flex-col items-center">
                  <div className="w-9 h-9 rounded-full bg-primary-600/20 border border-primary-500/40 flex items-center justify-center text-primary-400 font-bold text-sm flex-shrink-0">
                    {i + 1}
                  </div>
                  {i < trip.stops.length - 1 && (
                    <div className="w-px flex-1 bg-dark-700 mt-2 min-h-[2rem]" />
                  )}
                </div>
                <div className="flex-1 pb-2">
                  <p className="text-white font-semibold">{stop.cityName}</p>
                  <p className="text-dark-400 text-xs">{stop.country} · {stop.nights} nights</p>
                  {(stop.arrivalDate || stop.departureDate) && (
                    <p className="text-dark-500 text-xs mt-1">
                      {stop.arrivalDate && format(new Date(stop.arrivalDate), 'dd MMM')}
                      {stop.arrivalDate && stop.departureDate && ' — '}
                      {stop.departureDate && format(new Date(stop.departureDate), 'dd MMM yyyy')}
                    </p>
                  )}
                  <p className="text-dark-500 text-xs mt-1">
                    {stop.activities?.length || 0} activities planned
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

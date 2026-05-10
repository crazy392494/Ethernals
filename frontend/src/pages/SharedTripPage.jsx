import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { tripApi } from '../services/api'
import { MapPin, Calendar, Users, DollarSign, Copy, Check, Loader2, Home } from 'lucide-react'
import { format, differenceInDays } from 'date-fns'
import toast from 'react-hot-toast'

export default function SharedTripPage() {
  const { token } = useParams()
  const [trip, setTrip] = useState(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const fetchShared = async () => {
      try {
        const { data } = await tripApi.getShared(token)
        setTrip(data)
      } catch {
        setTrip(null)
      } finally {
        setLoading(false)
      }
    }
    fetchShared()
  }, [token])

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    toast.success('Link copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary-400" />
      </div>
    )
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-dark-950 flex flex-col items-center justify-center gap-4">
        <p className="text-6xl">🗺️</p>
        <h1 className="font-display text-2xl font-bold text-white">Trip not found</h1>
        <p className="text-dark-400">This link may be invalid or the trip is no longer public.</p>
        <Link to="/login" className="btn-primary mt-2">
          <Home className="w-4 h-4" /> Go to Traveloop
        </Link>
      </div>
    )
  }

  const duration = trip.startDate && trip.endDate
    ? differenceInDays(new Date(trip.endDate), new Date(trip.startDate))
    : trip.stops?.reduce((s, stop) => s + (stop.nights || 0), 0)

  return (
    <div className="min-h-screen bg-dark-950">
      {/* Header bar */}
      <div className="sticky top-0 z-10 bg-dark-900/80 backdrop-blur-xl border-b border-dark-700/50 flex items-center justify-between px-6 py-4">
        <Link to="/login" className="flex items-center gap-2 text-white font-display font-bold text-lg">
          🌍 Traveloop
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-dark-400 text-sm hidden sm:block">Shared itinerary</span>
          <button onClick={copyLink} className="btn-secondary text-sm py-1.5">
            {copied ? <><Check className="w-4 h-4 text-emerald-400" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy Link</>}
          </button>
          <Link to="/register" className="btn-primary text-sm py-1.5">
            Plan Your Own Trip
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Cover */}
        <div className="relative rounded-2xl overflow-hidden h-72">
          {trip.coverImage ? (
            <img src={trip.coverImage} alt={trip.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary-900/50 to-dark-800" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/40 to-transparent" />
          <div className="absolute bottom-6 left-6">
            <p className="text-dark-300 text-sm mb-1">
              Shared by <span className="text-white font-semibold">{trip.user?.name}</span>
            </p>
            <h1 className="font-display text-4xl font-bold text-white">{trip.title}</h1>
            {trip.description && (
              <p className="text-dark-200 mt-2 max-w-lg">{trip.description}</p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Duration', value: `${duration || 0} days`, icon: Calendar },
            { label: 'Cities', value: trip.stops?.length || 0, icon: MapPin },
            { label: 'Travelers', value: trip.travelerCount, icon: Users },
            { label: 'Budget', value: `${trip.currency} ${(trip.budget?.totalBudget || trip.totalBudget || 0).toLocaleString()}`, icon: DollarSign },
          ].map((stat) => (
            <div key={stat.label} className="glass-card p-4">
              <stat.icon className="w-4 h-4 text-primary-400 mb-2" />
              <p className="text-dark-400 text-xs">{stat.label}</p>
              <p className="text-white font-bold">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Itinerary */}
        <div className="glass-card p-6">
          <h2 className="font-display text-xl font-bold text-white mb-5">🗺️ Itinerary</h2>
          <div className="space-y-6">
            {trip.stops?.map((stop, i) => (
              <div key={stop.id} className="flex gap-4">
                {/* Timeline */}
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-primary-600/20 border-2 border-primary-500/40 flex items-center justify-center text-primary-400 font-bold flex-shrink-0">
                    {i + 1}
                  </div>
                  {i < trip.stops.length - 1 && (
                    <div className="w-px flex-1 bg-dark-700 mt-2 min-h-[2rem]" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 pb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-white font-bold text-lg">{stop.cityName}</h3>
                      <p className="text-dark-400 text-sm">{stop.country} · {stop.nights} nights</p>
                    </div>
                    {(stop.arrivalDate || stop.departureDate) && (
                      <div className="text-right text-xs text-dark-400">
                        <p>{stop.arrivalDate && format(new Date(stop.arrivalDate), 'dd MMM')}</p>
                        <p>{stop.departureDate && format(new Date(stop.departureDate), 'dd MMM yyyy')}</p>
                      </div>
                    )}
                  </div>

                  {/* Activities */}
                  {stop.activities?.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {stop.activities.map((act) => (
                        <div key={act.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-dark-800/50">
                          <div className="w-8 h-8 rounded-lg bg-primary-600/10 flex items-center justify-center text-sm flex-shrink-0">
                            {act.imageUrl ? (
                              <img src={act.imageUrl} alt={act.name} className="w-full h-full object-cover rounded-lg" />
                            ) : '🎯'}
                          </div>
                          <div className="flex-1">
                            <p className="text-white text-sm font-medium">{act.name}</p>
                            <p className="text-dark-400 text-xs">
                              {[
                                act.duration && `${act.duration} min`,
                                act.cost > 0 && `$${act.cost}`,
                                act.category
                              ].filter(Boolean).join(' · ')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="glass-card p-8 text-center">
          <p className="text-2xl mb-3">✈️</p>
          <h3 className="font-display text-xl font-bold text-white mb-2">Inspired? Plan your own!</h3>
          <p className="text-dark-400 text-sm mb-5">Create personalized AI-powered itineraries for free.</p>
          <Link to="/register" className="btn-primary mx-auto">
            Start Planning for Free
          </Link>
        </div>
      </div>
    </div>
  )
}

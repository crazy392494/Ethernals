import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  PlusCircle, MapPin, Calendar, DollarSign, TrendingUp,
  Plane, Globe, Star, ArrowRight, Sparkles
} from 'lucide-react'
import { tripApi, cityApi, aiApi } from '../services/api'
import { useAuthStore } from '../store/authStore'
import TripCard from '../components/trips/TripCard'
import StatCard from '../components/ui/StatCard'
import DestinationCard from '../components/ui/DestinationCard'
import LoadingSkeleton from '../components/ui/LoadingSkeleton'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
}
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

export default function DashboardPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [trips, setTrips] = useState([])
  const [popularCities, setPopularCities] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)
  const [aiLoading, setAiLoading] = useState(false)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const [tripsRes, citiesRes] = await Promise.all([
        tripApi.getAll({ sort: 'updatedAt', order: 'desc' }),
        cityApi.getPopular(),
      ])
      setTrips(tripsRes.data || [])
      setPopularCities(citiesRes.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const getAiRecommendations = async () => {
    setAiLoading(true)
    try {
      const { data } = await aiApi.recommendDestinations({
        interests: ['culture', 'food'],
        budget: 3000,
        duration: 10,
      })
      setRecommendations(data.recommendations || [])
      toast.success('AI recommendations generated! 🤖')
    } catch {
      toast.error('Failed to get AI recommendations')
    } finally {
      setAiLoading(false)
    }
  }

  const upcomingTrips = trips.filter(t => ['UPCOMING', 'PLANNING'].includes(t.status))
  const recentTrips = trips.slice(0, 4)
  const totalBudget = trips.reduce((sum, t) => sum + (t.totalBudget || 0), 0)
  const totalCities = trips.reduce((sum, t) => sum + (t.stops?.length || 0), 0)

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
      {/* Hero welcome section */}
      <motion.div variants={itemVariants} className="relative glass-card p-6 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-1/3 w-32 h-32 bg-accent-500/10 rounded-full blur-2xl translate-y-1/2" />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-dark-400 text-sm font-medium mb-1">
              {greeting()}, {user?.name?.split(' ')[0]} 👋
            </p>
            <h1 className="font-display text-3xl font-bold text-white mb-2">
              Where to next?
            </h1>
            <p className="text-dark-300 text-sm max-w-md">
              You have <span className="text-primary-400 font-semibold">{upcomingTrips.length} upcoming trip{upcomingTrips.length !== 1 ? 's' : ''}</span>. 
              {' '}Plan your next adventure with AI-powered suggestions.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={getAiRecommendations}
              disabled={aiLoading}
              className="btn-secondary text-xs sm:text-sm"
            >
              <Sparkles className="w-4 h-4 text-accent-400" />
              {aiLoading ? 'Thinking...' : 'AI Suggest'}
            </button>
            <button
              onClick={() => navigate('/trips/new')}
              className="btn-primary text-xs sm:text-sm"
            >
              <PlusCircle className="w-4 h-4" />
              Plan New Trip
            </button>
          </div>
        </div>
      </motion.div>

      {/* Stats row */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Plane}
          label="Total Trips"
          value={trips.length}
          color="primary"
          trend="+2 this month"
        />
        <StatCard
          icon={MapPin}
          label="Cities Visited"
          value={totalCities}
          color="accent"
          trend="12 countries"
        />
        <StatCard
          icon={DollarSign}
          label="Total Budget"
          value={`$${totalBudget.toLocaleString()}`}
          color="amber"
          trend="Well managed"
        />
        <StatCard
          icon={Globe}
          label="Upcoming"
          value={upcomingTrips.length}
          color="emerald"
          trend="Next adventure"
        />
      </motion.div>

      {/* Upcoming trips */}
      {upcomingTrips.length > 0 && (
        <motion.section variants={itemVariants}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="section-title">Upcoming Trips</h2>
              <p className="section-subtitle">Your planned adventures</p>
            </div>
            <button onClick={() => navigate('/trips')} className="btn-ghost text-xs">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {loading ? (
              Array.from({ length: 2 }).map((_, i) => <LoadingSkeleton key={i} className="h-52" />)
            ) : (
              upcomingTrips.slice(0, 3).map((trip) => (
                <TripCard key={trip.id} trip={trip} onRefresh={fetchDashboardData} />
              ))
            )}
          </div>
        </motion.section>
      )}

      {/* AI Recommendations */}
      {recommendations.length > 0 && (
        <motion.section variants={itemVariants} className="animate-fade-in">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-accent-400" />
            <div>
              <h2 className="section-title">AI Recommended for You</h2>
              <p className="section-subtitle">Based on your travel preferences</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {recommendations.map((rec, i) => (
              <div key={i} className="glass-card p-4 hover-card">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-semibold text-white text-sm">{rec.city}</p>
                    <p className="text-xs text-dark-400">{rec.country}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-amber-400">
                      <Star className="w-3 h-3 fill-current" />
                      <span className="text-xs">{rec.rating}</span>
                    </div>
                    <p className="text-xs text-emerald-400">Score: {rec.score}%</p>
                  </div>
                </div>
                <p className="text-xs text-dark-400 leading-relaxed">{rec.reason}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-dark-500">Cost index: {rec.costIndex}/100</span>
                  <button
                    onClick={() => navigate('/trips/new')}
                    className="text-xs text-primary-400 hover:text-primary-300 font-semibold"
                  >
                    Plan →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.section>
      )}

      {/* Recent trips */}
      <motion.section variants={itemVariants}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="section-title">Recent Trips</h2>
            <p className="section-subtitle">Your latest travel plans</p>
          </div>
          <button onClick={() => navigate('/trips')} className="btn-ghost text-xs">
            View all <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <LoadingSkeleton key={i} className="h-48" />)}
          </div>
        ) : recentTrips.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-primary-500/10 flex items-center justify-center mx-auto mb-4">
              <Plane className="w-8 h-8 text-primary-400" />
            </div>
            <h3 className="text-white font-semibold mb-2">No trips yet</h3>
            <p className="text-dark-400 text-sm mb-6">Start planning your first adventure!</p>
            <button onClick={() => navigate('/trips/new')} className="btn-primary mx-auto">
              <PlusCircle className="w-4 h-4" />
              Create First Trip
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {recentTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} compact onRefresh={fetchDashboardData} />
            ))}
          </div>
        )}
      </motion.section>

      {/* Popular destinations */}
      <motion.section variants={itemVariants}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="section-title">Popular Destinations</h2>
            <p className="section-subtitle">Trending cities worldwide</p>
          </div>
          <button onClick={() => navigate('/cities')} className="btn-ghost text-xs">
            Explore all <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => <LoadingSkeleton key={i} className="h-36" />)
          ) : (
            popularCities.slice(0, 6).map((city) => (
              <DestinationCard key={city.id} city={city} />
            ))
          )}
        </div>
      </motion.section>
    </motion.div>
  )
}

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { PlusCircle, Search, Filter, SortAsc, Grid, List } from 'lucide-react'
import { tripApi } from '../services/api'
import TripCard from '../components/trips/TripCard'
import LoadingSkeleton from '../components/ui/LoadingSkeleton'

const STATUSES = ['All', 'PLANNING', 'UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED']

export default function TripsPage() {
  const navigate = useNavigate()
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('All')
  const [viewMode, setViewMode] = useState('grid')
  const [sort, setSort] = useState('updatedAt')

  useEffect(() => {
    fetchTrips()
  }, [status, sort])

  const fetchTrips = async () => {
    setLoading(true)
    try {
      const params = {
        sort,
        order: 'desc',
        ...(status !== 'All' && { status }),
      }
      const { data } = await tripApi.getAll(params)
      setTrips(data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const filtered = trips.filter(t =>
    search ? t.title.toLowerCase().includes(search.toLowerCase()) : true
  )

  const statusBadgeClass = {
    PLANNING: 'badge-planning',
    UPCOMING: 'badge-upcoming',
    ONGOING: 'badge-ongoing',
    COMPLETED: 'badge-completed',
    CANCELLED: 'badge-cancelled',
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">My Trips</h1>
          <p className="text-dark-400 text-sm">{trips.length} trip{trips.length !== 1 ? 's' : ''} total</p>
        </div>
        <button onClick={() => navigate('/trips/new')} className="btn-primary">
          <PlusCircle className="w-4 h-4" />
          Plan New Trip
        </button>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search trips..."
            className="input-field pl-9 py-2 text-sm"
          />
        </div>

        {/* Status filter */}
        <div className="flex gap-1.5 flex-wrap">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
                ${status === s
                  ? 'bg-primary-600 text-white'
                  : 'bg-dark-700 text-dark-300 hover:text-white hover:bg-dark-600'
                }`}
            >
              {s.charAt(0) + s.slice(1).toLowerCase().replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Sort & View */}
        <div className="flex items-center gap-2">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="input-field py-2 text-sm w-auto"
          >
            <option value="updatedAt">Recently Updated</option>
            <option value="createdAt">Date Created</option>
            <option value="startDate">Start Date</option>
            <option value="title">Name</option>
          </select>
          <div className="flex border border-dark-600 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-dark-600 text-white' : 'text-dark-400 hover:text-white'}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-dark-600 text-white' : 'text-dark-400 hover:text-white'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Trips grid/list */}
      {loading ? (
        <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}>
          {Array.from({ length: 6 }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-60" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <p className="text-dark-300 text-4xl mb-4">✈️</p>
          <h3 className="text-white font-semibold mb-2">No trips found</h3>
          <p className="text-dark-400 text-sm mb-6">
            {search ? 'Try a different search term' : 'Start planning your first trip!'}
          </p>
          <button onClick={() => navigate('/trips/new')} className="btn-primary mx-auto">
            <PlusCircle className="w-4 h-4" />
            Create Trip
          </button>
        </div>
      ) : (
        <motion.div
          layout
          className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}
        >
          {filtered.map((trip) => (
            <TripCard
              key={trip.id}
              trip={trip}
              compact={viewMode === 'list'}
              onRefresh={fetchTrips}
            />
          ))}
        </motion.div>
      )}
    </div>
  )
}

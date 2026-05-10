import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors
} from '@dnd-kit/core'
import {
  SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy,
  useSortable, arrayMove
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Plus, GripVertical, Trash2, MapPin, Calendar, ChevronDown, ChevronUp,
  Sparkles, Search, X, Loader2, ArrowLeft, Clock, DollarSign, Star
} from 'lucide-react'
import { stopApi, activityApi, aiApi } from '../services/api'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const ACTIVITY_CATEGORIES = [
  { id: 'ALL', label: 'All', emoji: '🌐' },
  { id: 'SIGHTSEEING', label: 'Sights', emoji: '🏛️' },
  { id: 'ADVENTURE', label: 'Adventure', emoji: '🏔️' },
  { id: 'FOOD', label: 'Food', emoji: '🍜' },
  { id: 'NATURE', label: 'Nature', emoji: '🌿' },
  { id: 'CULTURE', label: 'Culture', emoji: '🎭' },
  { id: 'NIGHTLIFE', label: 'Nightlife', emoji: '🌙' },
]

function SortableStop({ stop, onDelete, onUpdate, onAddActivity }) {
  const [expanded, setExpanded] = useState(true)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: stop.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="glass-card overflow-hidden">
      {/* Stop header */}
      <div className="flex items-center gap-3 p-4 border-b border-dark-700/50">
        <button
          {...attributes}
          {...listeners}
          className="text-dark-500 hover:text-dark-300 cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="w-5 h-5" />
        </button>

        <div className="w-8 h-8 rounded-full bg-primary-600/20 border border-primary-500/40 flex items-center justify-center text-primary-400 font-bold text-sm flex-shrink-0">
          {stop.order + 1}
        </div>

        <div className="flex-1">
          <p className="text-white font-semibold text-sm">{stop.cityName}</p>
          <p className="text-dark-400 text-xs">{stop.country} · {stop.nights} nights</p>
        </div>

        <div className="flex items-center gap-2">
          {(stop.arrivalDate || stop.departureDate) && (
            <span className="text-xs text-dark-400 hidden sm:block">
              {stop.arrivalDate && format(new Date(stop.arrivalDate), 'dd MMM')}
              {stop.arrivalDate && stop.departureDate && ' → '}
              {stop.departureDate && format(new Date(stop.departureDate), 'dd MMM')}
            </span>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 rounded text-dark-400 hover:text-white transition-colors"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button
            onClick={() => onDelete(stop.id)}
            className="p-1 rounded text-dark-500 hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expanded activities */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-2">
              {stop.activities?.length === 0 && (
                <p className="text-dark-500 text-xs text-center py-2">No activities yet. Add some below!</p>
              )}
              {stop.activities?.map((act) => (
                <div key={act.id} className="flex items-center gap-2 p-2 rounded-lg bg-dark-800/50 group">
                  <div className="flex-1">
                    <p className="text-white text-xs font-medium">{act.name}</p>
                    <p className="text-dark-500 text-xs">
                      {act.duration ? `${act.duration} min` : ''}
                      {act.cost ? ` · $${act.cost}` : ''}
                      {act.category ? ` · ${act.category}` : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => onAddActivity(stop.id, null, act)}
                    className="p-1 rounded text-dark-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => onAddActivity(stop.id)}
                className="w-full py-2 rounded-lg border border-dashed border-dark-600 text-dark-400 hover:border-primary-500/40 hover:text-primary-400 text-xs transition-all flex items-center justify-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Activity
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function ItineraryBuilderPage() {
  const { id: tripId } = useParams()
  const navigate = useNavigate()
  const [stops, setStops] = useState([])
  const [loading, setLoading] = useState(true)
  const [addingStop, setAddingStop] = useState(false)
  const [citySearch, setCitySearch] = useState('')
  const [cityResults, setCityResults] = useState([])
  const [activitySearch, setActivitySearch] = useState('')
  const [activityResults, setActivityResults] = useState([])
  const [activeStopId, setActiveStopId] = useState(null)
  const [activityCategory, setActivityCategory] = useState('ALL')
  const [aiLoading, setAiLoading] = useState(false)
  const [showActivityPanel, setShowActivityPanel] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  useEffect(() => { fetchStops() }, [])

  const fetchStops = async () => {
    setLoading(true)
    try {
      const { data } = await stopApi.getByTrip(tripId)
      setStops(data || [])
    } catch {
      toast.error('Failed to load itinerary')
    } finally {
      setLoading(false)
    }
  }

  const handleCitySearch = async (q) => {
    setCitySearch(q)
    if (q.length < 2) { setCityResults([]); return }
    try {
      const { data } = await activityApi.search ? {} : {}
      // Use city search
      const res = await fetch(`/api/cities/search?q=${encodeURIComponent(q)}`)
      const cities = await res.json()
      setCityResults(cities || [])
    } catch {}
  }

  const addStop = async (city) => {
    try {
      const { data } = await stopApi.create({
        tripId,
        cityName: city.name,
        country: city.country,
        latitude: city.latitude,
        longitude: city.longitude,
      })
      setStops(prev => [...prev, { ...data, activities: [] }])
      setCitySearch('')
      setCityResults([])
      setAddingStop(false)
      toast.success(`${city.name} added to itinerary!`)
    } catch {
      toast.error('Failed to add city')
    }
  }

  const deleteStop = async (stopId) => {
    if (!window.confirm('Remove this city from itinerary?')) return
    try {
      await stopApi.delete(stopId)
      setStops(prev => prev.filter(s => s.id !== stopId))
      toast.success('City removed')
    } catch {
      toast.error('Failed to remove city')
    }
  }

  const handleDragEnd = async ({ active, over }) => {
    if (!over || active.id === over.id) return
    const oldIdx = stops.findIndex(s => s.id === active.id)
    const newIdx = stops.findIndex(s => s.id === over.id)
    const reordered = arrayMove(stops, oldIdx, newIdx)
    setStops(reordered)
    try {
      await stopApi.reorder(tripId, reordered.map(s => s.id))
    } catch {
      toast.error('Failed to reorder')
      fetchStops()
    }
  }

  const searchActivities = async (q, category) => {
    try {
      const params = { q, ...(category && category !== 'ALL' && { category }) }
      const { data } = await activityApi.search(params)
      setActivityResults(data || [])
    } catch {}
  }

  useEffect(() => {
    searchActivities(activitySearch, activityCategory)
  }, [activitySearch, activityCategory])

  const openActivityPanel = (stopId, remove = null) => {
    if (remove) {
      // Remove activity
      removeActivity(remove.id)
      return
    }
    setActiveStopId(stopId)
    setShowActivityPanel(true)
  }

  const addActivity = async (activity) => {
    if (!activeStopId) return
    try {
      const { data } = await activityApi.create({
        stopId: activeStopId,
        name: activity.name,
        description: activity.description,
        category: activity.category,
        duration: activity.duration,
        cost: activity.cost,
        imageUrl: activity.imageUrl,
      })
      setStops(prev => prev.map(s =>
        s.id === activeStopId
          ? { ...s, activities: [...(s.activities || []), data] }
          : s
      ))
      toast.success(`${activity.name} added!`)
    } catch {
      toast.error('Failed to add activity')
    }
  }

  const removeActivity = async (activityId) => {
    try {
      await activityApi.delete(activityId)
      setStops(prev => prev.map(s => ({
        ...s,
        activities: s.activities?.filter(a => a.id !== activityId) || []
      })))
      toast.success('Activity removed')
    } catch {
      toast.error('Failed to remove activity')
    }
  }

  const generateAIItinerary = async () => {
    if (stops.length === 0) return toast.error('Add some cities first')
    setAiLoading(true)
    try {
      const { data } = await aiApi.suggestItinerary({
        cities: stops.map(s => s.cityName),
        days: stops.reduce((s, stop) => s + (stop.nights || 2), 0),
        travelStyle: 'culture',
      })
      toast.success(`AI generated ${data.itinerary.length} city plans! 🤖`)
    } catch {
      toast.error('AI suggestion failed')
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(`/trips/${tripId}`)} className="p-2 rounded-lg text-dark-400 hover:text-white hover:bg-dark-700/50 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-display text-xl font-bold text-white">Itinerary Builder</h1>
            <p className="text-dark-400 text-sm">{stops.length} cities planned</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={generateAIItinerary}
            disabled={aiLoading}
            className="btn-secondary text-sm"
          >
            <Sparkles className={`w-4 h-4 text-accent-400 ${aiLoading ? 'animate-spin' : ''}`} />
            {aiLoading ? 'Generating...' : 'AI Plan'}
          </button>
          <button
            onClick={() => setAddingStop(true)}
            className="btn-primary text-sm"
          >
            <Plus className="w-4 h-4" /> Add City
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Stops column */}
        <div className="lg:col-span-3 space-y-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="glass-card h-24 animate-pulse" />
            ))
          ) : stops.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <p className="text-4xl mb-3">🗺️</p>
              <p className="text-white font-semibold mb-2">No cities added yet</p>
              <p className="text-dark-400 text-sm mb-4">Start by adding your first destination</p>
              <button onClick={() => setAddingStop(true)} className="btn-primary mx-auto">
                <Plus className="w-4 h-4" /> Add First City
              </button>
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={stops.map(s => s.id)} strategy={verticalListSortingStrategy}>
                {stops.map((stop) => (
                  <SortableStop
                    key={stop.id}
                    stop={stop}
                    onDelete={deleteStop}
                    onUpdate={fetchStops}
                    onAddActivity={openActivityPanel}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}

          {/* Add stop inline */}
          {addingStop && (
            <div className="glass-card p-4 animate-scale-in">
              <div className="flex items-center gap-2 mb-3">
                <Search className="w-4 h-4 text-dark-400" />
                <input
                  autoFocus
                  type="text"
                  value={citySearch}
                  onChange={(e) => handleCitySearch(e.target.value)}
                  placeholder="Search city..."
                  className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-dark-500"
                />
                <button onClick={() => { setAddingStop(false); setCitySearch(''); setCityResults([]) }} className="text-dark-500 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
              {cityResults.length > 0 && (
                <div className="space-y-1">
                  {cityResults.map((city) => (
                    <button
                      key={city.id}
                      onClick={() => addStop(city)}
                      className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-dark-700/50 transition-colors text-left"
                    >
                      <MapPin className="w-4 h-4 text-primary-400 flex-shrink-0" />
                      <div>
                        <p className="text-white text-sm font-medium">{city.name}</p>
                        <p className="text-dark-400 text-xs">{city.country} · ⭐ {city.rating}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Activity panel */}
        <div className="lg:col-span-2">
          <div className="glass-card p-4 sticky top-4">
            <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
              <Search className="w-4 h-4 text-primary-400" />
              Activity Library
            </h3>

            {/* Category filter */}
            <div className="flex gap-1.5 flex-wrap mb-3">
              {ACTIVITY_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActivityCategory(cat.id)}
                  className={`category-pill px-2.5 py-1 text-xs transition-all
                    ${activityCategory === cat.id
                      ? 'bg-primary-600/20 text-primary-400 border border-primary-500/30'
                      : 'bg-dark-700/50 text-dark-400 hover:text-white border border-transparent'
                    }`}
                >
                  {cat.emoji} {cat.label}
                </button>
              ))}
            </div>

            {/* Activity search */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-dark-400" />
              <input
                type="text"
                value={activitySearch}
                onChange={(e) => setActivitySearch(e.target.value)}
                placeholder="Search activities..."
                className="input-field pl-8 py-2 text-xs"
              />
            </div>

            {/* Active stop selector */}
            {stops.length > 0 && (
              <div className="mb-3">
                <label className="text-xs text-dark-400 mb-1 block">Add to city:</label>
                <select
                  value={activeStopId || ''}
                  onChange={(e) => setActiveStopId(e.target.value)}
                  className="input-field py-2 text-xs"
                >
                  <option value="">Select a city...</option>
                  {stops.map(s => (
                    <option key={s.id} value={s.id}>{s.cityName}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Activity results */}
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {activityResults.length === 0 ? (
                <p className="text-dark-500 text-xs text-center py-4">No activities found</p>
              ) : (
                activityResults.map((activity) => (
                  <div key={activity.id} className="flex gap-2 p-2 rounded-lg bg-dark-800/50 hover:bg-dark-700/50 transition-colors group">
                    {activity.imageUrl && (
                      <img src={activity.imageUrl} alt={activity.name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-semibold truncate">{activity.name}</p>
                      <p className="text-dark-400 text-xs truncate">{activity.city}, {activity.country}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {activity.duration && (
                          <span className="text-dark-500 text-xs flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />{activity.duration}m
                          </span>
                        )}
                        {activity.cost > 0 && (
                          <span className="text-dark-500 text-xs flex items-center gap-1">
                            <DollarSign className="w-2.5 h-2.5" />{activity.cost}
                          </span>
                        )}
                        {activity.rating && (
                          <span className="text-amber-400 text-xs flex items-center gap-0.5">
                            <Star className="w-2.5 h-2.5 fill-current" />{activity.rating}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => addActivity(activity)}
                      disabled={!activeStopId}
                      className="p-1.5 rounded-lg bg-primary-600/20 text-primary-400 hover:bg-primary-600/30 disabled:opacity-30 disabled:cursor-not-allowed opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

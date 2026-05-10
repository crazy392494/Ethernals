import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Search, MapPin, Star, DollarSign, TrendingUp, Globe, Bookmark } from 'lucide-react'
import { cityApi, userApi } from '../services/api'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

const CONTINENTS = ['All', 'Europe', 'Asia', 'North America', 'South America', 'Africa', 'Oceania']

export default function CitiesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const [cities, setCities] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState(searchParams.get('q') || '')
  const [continent, setContinent] = useState('All')
  const [saved, setSaved] = useState(new Set())

  useEffect(() => {
    fetchCities()
  }, [search, continent])

  const fetchCities = async () => {
    setLoading(true)
    try {
      const params = {
        ...(search && { q: search }),
        ...(continent !== 'All' && { continent }),
      }
      const { data } = search || continent !== 'All'
        ? await cityApi.search(params)
        : await cityApi.getPopular()
      setCities(data || [])
    } catch {
      toast.error('Failed to load cities')
    } finally {
      setLoading(false)
    }
  }

  const saveDestination = async (city) => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    if (saved.has(city.id)) return
    try {
      await userApi.saveDestination({ cityName: city.name, country: city.country, imageUrl: city.imageUrl })
      setSaved(prev => new Set([...prev, city.id]))
      toast.success(`${city.name} saved to favorites!`)
    } catch (err) {
      if (err.response?.status === 409) {
        toast.error('Already saved')
      } else {
        toast.error('Failed to save')
      }
    }
  }

  const getCostLabel = (costIndex) => {
    if (costIndex < 40) return { label: 'Budget', color: 'text-emerald-400' }
    if (costIndex < 70) return { label: 'Moderate', color: 'text-amber-400' }
    return { label: 'Premium', color: 'text-red-400' }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-white mb-1">Explore Cities</h1>
        <p className="text-dark-400 text-sm">Discover and plan your next destination</p>
      </div>

      {/* Search & filter */}
      <div className="glass-card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search cities or countries..."
            className="input-field pl-9 py-2 text-sm"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {CONTINENTS.map((c) => (
            <button
              key={c}
              onClick={() => setContinent(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                ${continent === c
                  ? 'bg-primary-600 text-white'
                  : 'bg-dark-700 text-dark-300 hover:text-white hover:bg-dark-600'
                }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Cities grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="glass-card h-64 animate-pulse" />
          ))}
        </div>
      ) : cities.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <Globe className="w-12 h-12 text-dark-500 mx-auto mb-3" />
          <p className="text-white font-semibold mb-2">No cities found</p>
          <p className="text-dark-400 text-sm">Try a different search term or continent</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {cities.map((city) => {
            const cost = getCostLabel(city.costIndex)
            return (
              <div key={city.id} className="glass-card overflow-hidden hover-card group">
                {/* Image */}
                <div className="relative h-44 overflow-hidden">
                  {city.imageUrl ? (
                    <img
                      src={city.imageUrl}
                      alt={city.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary-900/50 to-dark-800" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-dark-950/80 to-transparent" />

                  {/* Save button */}
                  <button
                    onClick={() => saveDestination(city)}
                    className={`absolute top-3 right-3 p-2 rounded-lg backdrop-blur-sm transition-all
                      ${saved.has(city.id)
                        ? 'bg-amber-500/80 text-white'
                        : 'bg-dark-900/60 text-dark-300 hover:text-amber-400 opacity-0 group-hover:opacity-100'
                      }`}
                  >
                    <Bookmark className={`w-4 h-4 ${saved.has(city.id) ? 'fill-current' : ''}`} />
                  </button>

                  {/* Popularity badge */}
                  <div className="absolute top-3 left-3 px-2 py-1 rounded-lg bg-dark-900/60 backdrop-blur-sm text-xs text-primary-400 font-semibold flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    #{city.popularity}
                  </div>

                  {/* City name */}
                  <div className="absolute bottom-3 left-3">
                    <p className="text-white font-bold text-lg leading-tight">{city.name}</p>
                    <p className="text-dark-300 text-xs">{city.country}</p>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <p className="text-dark-300 text-xs leading-relaxed mb-3 line-clamp-2">
                    {city.description || `Explore the best of ${city.name}.`}
                  </p>
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1 text-amber-400">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span className="font-semibold">{city.rating}</span>
                    </div>
                    <span className={`font-semibold ${cost.color}`}>{cost.label}</span>
                    {city.continent && (
                      <div className="flex items-center gap-1 text-dark-400">
                        <Globe className="w-3 h-3" />
                        <span>{city.continent}</span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => navigate('/trips/new')}
                    className="w-full mt-3 py-2 rounded-lg border border-dark-600 hover:border-primary-500/40 text-dark-300 hover:text-primary-400 text-xs font-medium transition-all"
                  >
                    Plan Trip to {city.name} →
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

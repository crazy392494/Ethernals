import { useNavigate } from 'react-router-dom'
import { Star, TrendingUp } from 'lucide-react'

export default function DestinationCard({ city }) {
  const navigate = useNavigate()

  return (
    <div
      onClick={() => navigate(`/cities?q=${encodeURIComponent(city.name)}`)}
      className="glass-card overflow-hidden hover-card cursor-pointer group"
    >
      <div className="relative h-28 overflow-hidden">
        {city.imageUrl ? (
          <img
            src={city.imageUrl}
            alt={city.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary-900/30 to-dark-800" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-dark-950/90 via-dark-950/20 to-transparent" />

        <div className="absolute bottom-2 left-2 right-2">
          <p className="text-white font-bold text-sm leading-tight truncate">{city.name}</p>
          <p className="text-dark-300 text-xs truncate">{city.country}</p>
        </div>

        <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-dark-900/70 backdrop-blur-sm">
          <Star className="w-2.5 h-2.5 text-amber-400 fill-current" />
          <span className="text-xs text-amber-400 font-semibold">{city.rating}</span>
        </div>
      </div>
    </div>
  )
}

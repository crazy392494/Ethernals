import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Menu, Search, Bell, Plus } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'

export default function Header({ onMenuClick }) {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/cities?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
    }
  }

  return (
    <header className="sticky top-0 z-10 h-16 bg-dark-900/80 backdrop-blur-xl border-b border-dark-700/50 flex items-center gap-4 px-4 sm:px-6">
      {/* Mobile menu button */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg text-dark-400 hover:text-white hover:bg-dark-700/50 transition-colors"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search cities, destinations..."
            className="w-full pl-9 pr-4 py-2 rounded-xl text-sm bg-dark-800 border border-dark-600 text-dark-100 placeholder:text-dark-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20 transition-all"
          />
        </div>
      </form>

      <div className="flex items-center gap-2 ml-auto">
        {/* Quick create button */}
        <button
          onClick={() => navigate('/trips/new')}
          className="hidden sm:flex btn-primary text-xs py-2"
        >
          <Plus className="w-3.5 h-3.5" />
          New Trip
        </button>

        {/* Notification bell */}
        <button className="relative p-2 rounded-lg text-dark-400 hover:text-white hover:bg-dark-700/50 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary-500" />
        </button>

        {/* Avatar */}
        <button
          onClick={() => navigate('/profile')}
          className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold text-sm overflow-hidden hover:ring-2 hover:ring-primary-500/50 transition-all"
        >
          {user?.avatar ? (
            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
          ) : (
            user?.name?.charAt(0)?.toUpperCase()
          )}
        </button>
      </div>
    </header>
  )
}

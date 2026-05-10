import { Outlet, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Compass } from 'lucide-react'

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-dark-950 flex">
      {/* Left decorative panel */}
      <div className="hidden lg:flex flex-col w-1/2 relative bg-gradient-to-br from-dark-900 via-primary-950/30 to-dark-900 overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 bg-hero-pattern opacity-50" />

        {/* Gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-accent-500/20 rounded-full blur-3xl" />
        <div className="absolute top-3/4 left-1/3 w-32 h-32 bg-primary-400/15 rounded-full blur-2xl" />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full p-12">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-lg shadow-primary-900/50">
              <Compass className="w-6 h-6 text-white" />
            </div>
            <span className="font-display font-bold text-xl text-white">Traveloop</span>
          </div>

          {/* Hero content */}
          <div className="flex-1 flex flex-col justify-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="font-display text-5xl font-bold text-white leading-tight mb-6">
                Plan Your
                <span className="block gradient-text">Perfect Journey</span>
              </h1>
              <p className="text-dark-300 text-lg leading-relaxed mb-8">
                AI-powered travel planning with multi-city itineraries, smart budgeting, and seamless collaboration.
              </p>

              {/* Feature list */}
              <div className="space-y-3">
                {[
                  { emoji: '🤖', text: 'AI itinerary suggestions' },
                  { emoji: '🗺️', text: 'Multi-city trip planning' },
                  { emoji: '💰', text: 'Smart budget tracking' },
                  { emoji: '🤝', text: 'Share & collaborate' },
                ].map((f) => (
                  <div key={f.text} className="flex items-center gap-3 text-dark-200">
                    <span className="text-xl">{f.emoji}</span>
                    <span className="text-sm font-medium">{f.text}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Destination cards preview */}
          <div className="flex gap-3 mt-8">
            {[
              { city: 'Paris', img: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=200&h=140&fit=crop' },
              { city: 'Tokyo', img: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=200&h=140&fit=crop' },
              { city: 'Bali', img: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=200&h=140&fit=crop' },
            ].map((dest) => (
              <motion.div
                key={dest.city}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex-1 rounded-xl overflow-hidden relative"
              >
                <img src={dest.img} alt={dest.city} className="w-full h-24 object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <p className="absolute bottom-2 left-2 text-white text-xs font-semibold">{dest.city}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — auth form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
              <Compass className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-xl text-white">Traveloop</span>
          </div>

          <Outlet />
        </motion.div>
      </div>
    </div>
  )
}

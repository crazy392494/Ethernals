import { Link } from 'react-router-dom'
import { Home, Compass } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-dark-950 flex flex-col items-center justify-center gap-4 px-4">
      <div className="text-center">
        <p className="font-display text-[8rem] font-bold gradient-text leading-none">404</p>
        <h1 className="font-display text-2xl font-bold text-white mb-2">Page not found</h1>
        <p className="text-dark-400 mb-8">Looks like you've wandered off the map!</p>
        <div className="flex items-center justify-center gap-3">
          <Link to="/dashboard" className="btn-primary">
            <Home className="w-4 h-4" /> Go Home
          </Link>
          <Link to="/cities" className="btn-secondary">
            <Compass className="w-4 h-4" /> Explore Cities
          </Link>
        </div>
      </div>
    </div>
  )
}

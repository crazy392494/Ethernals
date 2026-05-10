import { useNavigate } from 'react-router-dom'
import { Compass } from 'lucide-react'

export default function TravelloopLogo({ size = 'md' }) {
  const navigate = useNavigate()
  
  const sizes = {
    sm: { container: 'w-7 h-7', icon: 'w-4 h-4', text: 'text-base' },
    md: { container: 'w-9 h-9', icon: 'w-5 h-5', text: 'text-lg' },
    lg: { container: 'w-12 h-12', icon: 'w-6 h-6', text: 'text-2xl' },
  }

  const s = sizes[size] || sizes.md

  return (
    <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2.5 group">
      <div className={`${s.container} rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-lg shadow-primary-900/30 group-hover:shadow-primary-900/50 transition-shadow`}>
        <Compass className={`${s.icon} text-white`} />
      </div>
      <span className={`font-display font-bold ${s.text} text-white`}>Traveloop</span>
    </button>
  )
}

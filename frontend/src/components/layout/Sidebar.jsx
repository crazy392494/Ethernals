import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Map, PlusCircle, Globe, Wallet,
  Package, BookOpen, User, Shield, LogOut, Compass, X
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', to: '/dashboard' },
  { icon: Map, label: 'My Trips', to: '/trips' },
  { icon: PlusCircle, label: 'Plan New Trip', to: '/trips/new', highlight: true },
  { icon: Globe, label: 'Explore Cities', to: '/cities' },
]

const bottomItems = [
  { icon: User, label: 'Profile', to: '/profile' },
]

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
    navigate('/login')
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-dark-700/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-lg shadow-primary-900/30">
            <Compass className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-display font-bold text-lg text-white">Traveloop</span>
            <div className="text-xs text-dark-400">AI Travel Planner</div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-dark-700/50 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* User info */}
      <div className="px-4 py-4 border-b border-dark-700/50">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-dark-800/60">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 overflow-hidden">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              user?.name?.charAt(0)?.toUpperCase()
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
            <p className="text-xs text-dark-400 truncate">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="text-xs font-semibold text-dark-500 uppercase tracking-wider px-3 mb-2">Navigation</p>

        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/trips/new' ? false : true}
            className={({ isActive }) =>
              `nav-item group ${isActive ? 'nav-item-active' : ''} ${item.highlight ? 'mt-2' : ''}`
            }
          >
            {({ isActive }) => (
              <>
                {item.highlight ? (
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                    <item.icon className="w-3.5 h-3.5 text-white" />
                  </div>
                ) : (
                  <item.icon className={`w-4.5 h-4.5 transition-colors ${isActive ? 'text-primary-400' : 'text-dark-400 group-hover:text-dark-200'}`} />
                )}
                <span>{item.label}</span>
                {item.highlight && (
                  <span className="ml-auto text-xs bg-primary-500/20 text-primary-400 px-1.5 py-0.5 rounded-md font-semibold">AI</span>
                )}
              </>
            )}
          </NavLink>
        ))}

        {/* Admin link */}
        {user?.role === 'ADMIN' && (
          <>
            <div className="pt-4 pb-2">
              <p className="text-xs font-semibold text-dark-500 uppercase tracking-wider px-3">Admin</p>
            </div>
            <NavLink
              to="/admin"
              className={({ isActive }) => `nav-item group ${isActive ? 'nav-item-active' : ''}`}
            >
              {({ isActive }) => (
                <>
                  <Shield className={`w-4.5 h-4.5 ${isActive ? 'text-primary-400' : 'text-dark-400 group-hover:text-dark-200'}`} />
                  <span>Admin Panel</span>
                </>
              )}
            </NavLink>
          </>
        )}
      </nav>

      {/* Bottom section */}
      <div className="px-3 py-4 border-t border-dark-700/50 space-y-1">
        {bottomItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `nav-item group ${isActive ? 'nav-item-active' : ''}`}
          >
            {({ isActive }) => (
              <>
                <item.icon className={`w-4.5 h-4.5 ${isActive ? 'text-primary-400' : 'text-dark-400 group-hover:text-dark-200'}`} />
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
        <button
          onClick={handleLogout}
          className="nav-item w-full text-red-400 hover:text-red-300 hover:bg-red-500/10"
        >
          <LogOut className="w-4.5 h-4.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-full w-[260px] bg-dark-900 border-r border-dark-700/50 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="lg:hidden fixed left-0 top-0 h-full w-[260px] bg-dark-900 border-r border-dark-700/50 z-30 flex flex-col"
          >
            {sidebarContent}
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  )
}

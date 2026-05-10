import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, PieChart, Pie, Cell
} from 'recharts'
import { Users, Map, Globe, TrendingUp, Loader2, Shield, Trash2 } from 'lucide-react'
import { adminApi } from '../services/api'
import StatCard from '../components/ui/StatCard'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981']

export default function AdminPage() {
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('overview')

  useEffect(() => { fetchData() }, [tab])

  const fetchData = async () => {
    setLoading(true)
    try {
      if (tab === 'overview') {
        const { data } = await adminApi.getStats()
        setStats(data)
      } else if (tab === 'users') {
        const { data } = await adminApi.getUsers()
        setUsers(data.users || [])
      } else if (tab === 'trips') {
        const { data } = await adminApi.getTrips()
        setTrips(data.trips || [])
      }
    } catch {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const deleteUser = async (id) => {
    if (!window.confirm('Delete this user? All their data will be removed.')) return
    try {
      await adminApi.deleteUser(id)
      setUsers(prev => prev.filter(u => u.id !== id))
      toast.success('User deleted')
    } catch {
      toast.error('Failed to delete user')
    }
  }

  const TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'users', label: 'Users' },
    { id: 'trips', label: 'Trips' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
          <Shield className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-dark-400 text-sm">Platform analytics and management</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-dark-800 rounded-xl w-fit">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all
              ${tab === t.id ? 'bg-dark-700 text-white' : 'text-dark-400 hover:text-white'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary-400" />
        </div>
      ) : (
        <>
          {/* Overview */}
          {tab === 'overview' && stats && (
            <div className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={Users} label="Total Users" value={stats.totalUsers} color="primary" trend={`+${stats.activeUsers} this month`} />
                <StatCard icon={Map} label="Total Trips" value={stats.totalTrips} color="accent" trend={`+${stats.recentTrips} this week`} />
                <StatCard icon={Globe} label="Active Users" value={stats.activeUsers} color="amber" trend="Last 30 days" />
                <StatCard icon={TrendingUp} label="Recent Trips" value={stats.recentTrips} color="emerald" trend="Last 7 days" />
              </div>

              {/* Charts row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Popular cities */}
                <div className="glass-card p-5">
                  <h2 className="text-white font-semibold mb-4">Most Visited Cities</h2>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={stats.popularCities?.slice(0, 8)} barSize={24}>
                      <XAxis dataKey="city" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', fontSize: '12px' }} />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]} fill="#6366f1" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Trip status breakdown */}
                <div className="glass-card p-5">
                  <h2 className="text-white font-semibold mb-4">Trip Status Breakdown</h2>
                  <div className="flex items-center">
                    <ResponsiveContainer width="60%" height={200}>
                      <PieChart>
                        <Pie
                          data={stats.tripsByStatus?.map(s => ({
                            name: s.status,
                            value: s._count
                          }))}
                          cx="50%" cy="50%"
                          innerRadius={50} outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {stats.tripsByStatus?.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', fontSize: '12px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-2">
                      {stats.tripsByStatus?.map((s, i) => (
                        <div key={s.status} className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                          <span className="text-dark-300 text-xs">{s.status}</span>
                          <span className="text-white text-xs font-bold ml-auto pl-4">{s._count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Popular cities table */}
              <div className="glass-card p-5">
                <h2 className="text-white font-semibold mb-4">Top Destinations</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-dark-400 text-xs border-b border-dark-700">
                        <th className="text-left pb-2 font-medium">#</th>
                        <th className="text-left pb-2 font-medium">City</th>
                        <th className="text-left pb-2 font-medium">Country</th>
                        <th className="text-right pb-2 font-medium">Trips</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-800">
                      {stats.popularCities?.slice(0, 10).map((city, i) => (
                        <tr key={i} className="hover:bg-dark-700/20 transition-colors">
                          <td className="py-2.5 text-dark-500 text-xs">#{i + 1}</td>
                          <td className="py-2.5 text-white font-medium">{city.city}</td>
                          <td className="py-2.5 text-dark-400">{city.country}</td>
                          <td className="py-2.5 text-right text-primary-400 font-semibold">{city.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Users table */}
          {tab === 'users' && (
            <div className="glass-card p-5">
              <h2 className="text-white font-semibold mb-4">All Users ({users.length})</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-dark-400 text-xs border-b border-dark-700">
                      <th className="text-left pb-2 font-medium">User</th>
                      <th className="text-left pb-2 font-medium">Role</th>
                      <th className="text-left pb-2 font-medium">Trips</th>
                      <th className="text-left pb-2 font-medium">Joined</th>
                      <th className="text-right pb-2 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-800">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-dark-700/20 transition-colors">
                        <td className="py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 overflow-hidden">
                              {u.avatar ? <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" /> : u.name?.charAt(0)}
                            </div>
                            <div>
                              <p className="text-white font-medium">{u.name}</p>
                              <p className="text-dark-400 text-xs">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3">
                          <span className={`badge ${u.role === 'ADMIN' ? 'badge-upcoming' : 'badge-planning'}`}>{u.role}</span>
                        </td>
                        <td className="py-3 text-dark-300">{u._count?.trips || 0}</td>
                        <td className="py-3 text-dark-400 text-xs">
                          {format(new Date(u.createdAt), 'dd MMM yyyy')}
                        </td>
                        <td className="py-3 text-right">
                          {u.role !== 'ADMIN' && (
                            <button onClick={() => deleteUser(u.id)} className="p-1.5 rounded hover:bg-red-500/10 text-dark-500 hover:text-red-400 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Trips table */}
          {tab === 'trips' && (
            <div className="glass-card p-5">
              <h2 className="text-white font-semibold mb-4">All Trips ({trips.length})</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-dark-400 text-xs border-b border-dark-700">
                      <th className="text-left pb-2 font-medium">Trip</th>
                      <th className="text-left pb-2 font-medium">Owner</th>
                      <th className="text-left pb-2 font-medium">Status</th>
                      <th className="text-left pb-2 font-medium">Stops</th>
                      <th className="text-left pb-2 font-medium">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-800">
                    {trips.map((t) => (
                      <tr key={t.id} className="hover:bg-dark-700/20 transition-colors">
                        <td className="py-3">
                          <p className="text-white font-medium">{t.title}</p>
                          <p className="text-dark-400 text-xs">{t.currency} {t.totalBudget?.toLocaleString()}</p>
                        </td>
                        <td className="py-3 text-dark-300 text-xs">
                          <p>{t.user?.name}</p>
                          <p className="text-dark-500">{t.user?.email}</p>
                        </td>
                        <td className="py-3">
                          <span className={`badge badge-${t.status?.toLowerCase()}`}>{t.status}</span>
                        </td>
                        <td className="py-3 text-dark-300">{t._count?.stops || 0}</td>
                        <td className="py-3 text-dark-400 text-xs">
                          {format(new Date(t.createdAt), 'dd MMM yyyy')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

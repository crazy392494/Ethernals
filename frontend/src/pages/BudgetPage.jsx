import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from 'recharts'
import { DollarSign, TrendingUp, AlertTriangle, ArrowLeft, Save, Loader2, Sparkles } from 'lucide-react'
import { budgetApi, aiApi } from '../services/api'
import toast from 'react-hot-toast'

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981']

const BudgetInput = ({ label, icon: Icon, value, onChange, color }) => (
  <div className="glass-card p-4">
    <div className="flex items-center gap-2 mb-2">
      <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center`}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <span className="text-dark-300 text-sm font-medium">{label}</span>
    </div>
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400 text-sm">$</span>
      <input
        type="number"
        min="0"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="input-field pl-7 text-lg font-bold text-white"
      />
    </div>
  </div>
)

export default function BudgetPage() {
  const { id: tripId } = useParams()
  const navigate = useNavigate()
  const [budget, setBudget] = useState({
    transportCost: 0,
    hotelCost: 0,
    foodCost: 0,
    activityCost: 0,
    miscCost: 0,
    currency: 'USD',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)

  useEffect(() => { fetchBudget() }, [])

  const fetchBudget = async () => {
    setLoading(true)
    try {
      const { data } = await budgetApi.getByTrip(tripId)
      setBudget(data)
    } catch {
      toast.error('Failed to load budget')
    } finally {
      setLoading(false)
    }
  }

  const updateBudget = (key, value) => {
    setBudget(prev => ({ ...prev, [key]: value }))
  }

  const save = async () => {
    setSaving(true)
    try {
      await budgetApi.update(tripId, budget)
      toast.success('Budget saved!')
      fetchBudget()
    } catch {
      toast.error('Failed to save budget')
    } finally {
      setSaving(false)
    }
  }

  const getAiEstimate = async () => {
    setAiLoading(true)
    try {
      const { data } = await aiApi.estimateBudget({
        days: 10,
        travelers: 2,
        travelStyle: 'comfort',
      })
      const est = data.estimate
      setBudget(prev => ({
        ...prev,
        transportCost: est.transport,
        hotelCost: est.hotel,
        foodCost: est.food,
        activityCost: est.activities,
        miscCost: est.misc,
      }))
      toast.success('AI budget estimate applied!')
    } catch {
      toast.error('Failed to get AI estimate')
    } finally {
      setAiLoading(false)
    }
  }

  const total = (budget.transportCost || 0) + (budget.hotelCost || 0) + (budget.foodCost || 0) + (budget.activityCost || 0) + (budget.miscCost || 0)

  const pieData = [
    { name: 'Transport', value: budget.transportCost || 0, color: COLORS[0] },
    { name: 'Hotel', value: budget.hotelCost || 0, color: COLORS[1] },
    { name: 'Food', value: budget.foodCost || 0, color: COLORS[2] },
    { name: 'Activities', value: budget.activityCost || 0, color: COLORS[3] },
    { name: 'Misc', value: budget.miscCost || 0, color: COLORS[4] },
  ].filter(d => d.value > 0)

  const barData = [
    { name: 'Transport', amount: budget.transportCost || 0 },
    { name: 'Hotel', amount: budget.hotelCost || 0 },
    { name: 'Food', amount: budget.foodCost || 0 },
    { name: 'Activities', amount: budget.activityCost || 0 },
    { name: 'Misc', amount: budget.miscCost || 0 },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(`/trips/${tripId}`)} className="p-2 rounded-lg text-dark-400 hover:text-white hover:bg-dark-700/50">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-display text-xl font-bold text-white">Budget Manager</h1>
            <p className="text-dark-400 text-sm">Track and manage your travel expenses</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={getAiEstimate} disabled={aiLoading} className="btn-secondary text-sm">
            <Sparkles className="w-4 h-4 text-accent-400" />
            {aiLoading ? 'Estimating...' : 'AI Estimate'}
          </button>
          <button onClick={save} disabled={saving} className="btn-primary text-sm">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save
          </button>
        </div>
      </div>

      {/* Total budget card */}
      <div className="glass-card p-6 flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div>
          <p className="text-dark-400 text-sm mb-1">Total Budget</p>
          <p className="font-display text-5xl font-bold gradient-text">
            ${total.toLocaleString()}
          </p>
          <p className="text-dark-400 text-sm mt-2">
            Daily avg: ${budget.dailyAverage ? Math.round(budget.dailyAverage).toLocaleString() : '--'}
          </p>
        </div>

        {/* Donut chart */}
        {pieData.length > 0 && (
          <div className="w-48 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(value) => [`$${value}`, '']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Legend */}
        <div className="space-y-2">
          {pieData.map((item) => (
            <div key={item.name} className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: item.color }} />
              <span className="text-dark-300 text-xs">{item.name}</span>
              <span className="text-white text-xs font-semibold ml-auto pl-4">
                ${item.value.toLocaleString()} ({total > 0 ? Math.round((item.value / total) * 100) : 0}%)
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Budget inputs grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <BudgetInput label="Transport" icon={DollarSign} value={budget.transportCost} onChange={(v) => updateBudget('transportCost', v)} color="bg-primary-600" />
        <BudgetInput label="Hotel / Accommodation" icon={DollarSign} value={budget.hotelCost} onChange={(v) => updateBudget('hotelCost', v)} color="bg-accent-600" />
        <BudgetInput label="Food & Dining" icon={DollarSign} value={budget.foodCost} onChange={(v) => updateBudget('foodCost', v)} color="bg-pink-600" />
        <BudgetInput label="Activities & Experiences" icon={DollarSign} value={budget.activityCost} onChange={(v) => updateBudget('activityCost', v)} color="bg-amber-600" />
        <BudgetInput label="Miscellaneous" icon={DollarSign} value={budget.miscCost} onChange={(v) => updateBudget('miscCost', v)} color="bg-emerald-600" />
      </div>

      {/* Bar chart */}
      <div className="glass-card p-6">
        <h2 className="text-white font-semibold mb-4">Budget Breakdown</h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={barData} barSize={36}>
            <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', fontSize: '12px' }}
              formatter={(value) => [`$${value}`, 'Amount']}
            />
            <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
              {barData.map((_, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Budget alert */}
      {total > 10000 && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">
            Your budget exceeds $10,000. Make sure to plan for unexpected expenses — consider adding a 10-15% buffer.
          </p>
        </div>
      )}
    </div>
  )
}

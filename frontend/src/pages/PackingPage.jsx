import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Check, Trash2, RotateCcw, ArrowLeft, Package, ChevronDown, ChevronRight
} from 'lucide-react'
import { packingApi } from '../services/api'
import toast from 'react-hot-toast'

const CATEGORIES = [
  { id: 'CLOTHING', label: 'Clothing', emoji: '👕', color: 'text-blue-400' },
  { id: 'DOCUMENTS', label: 'Documents', emoji: '📄', color: 'text-amber-400' },
  { id: 'ELECTRONICS', label: 'Electronics', emoji: '📱', color: 'text-primary-400' },
  { id: 'MEDICINES', label: 'Medicines', emoji: '💊', color: 'text-red-400' },
  { id: 'TOILETRIES', label: 'Toiletries', emoji: '🧴', color: 'text-teal-400' },
  { id: 'OTHER', label: 'Other', emoji: '📦', color: 'text-dark-300' },
]

const DEFAULT_ITEMS = {
  DOCUMENTS: ['Passport', 'Travel insurance', 'Visa', 'Flight tickets', 'Hotel bookings'],
  CLOTHING: ['T-shirts', 'Pants', 'Underwear', 'Socks', 'Walking shoes', 'Jacket'],
  ELECTRONICS: ['Phone charger', 'Power bank', 'Travel adapter', 'Camera', 'Earphones'],
  MEDICINES: ['Pain relievers', 'Antacids', 'Band-aids', 'Prescription meds'],
  TOILETRIES: ['Toothbrush', 'Sunscreen', 'Deodorant', 'Shampoo'],
}

export default function PackingPage() {
  const { id: tripId } = useParams()
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [newItem, setNewItem] = useState('')
  const [newCategory, setNewCategory] = useState('OTHER')
  const [collapsedCats, setCollapsedCats] = useState({})
  const [listId, setListId] = useState(null)

  useEffect(() => { fetchList() }, [])

  const fetchList = async () => {
    setLoading(true)
    try {
      const { data } = await packingApi.getByTrip(tripId)
      setItems(data.items || [])
      setListId(data.id)
    } catch {
      toast.error('Failed to load packing list')
    } finally {
      setLoading(false)
    }
  }

  const addItem = async (e) => {
    e.preventDefault()
    if (!newItem.trim()) return
    try {
      const { data } = await packingApi.addItem({
        tripId,
        name: newItem.trim(),
        category: newCategory,
      })
      setItems(prev => [...prev, data])
      setNewItem('')
      toast.success('Item added!')
    } catch {
      toast.error('Failed to add item')
    }
  }

  const addDefaultItems = async (category) => {
    const defaults = DEFAULT_ITEMS[category] || []
    const existing = items.filter(i => i.category === category).map(i => i.name.toLowerCase())
    const toAdd = defaults.filter(d => !existing.includes(d.toLowerCase()))

    for (const name of toAdd) {
      try {
        const { data } = await packingApi.addItem({ tripId, name, category })
        setItems(prev => [...prev, data])
      } catch {}
    }
    if (toAdd.length > 0) toast.success(`${toAdd.length} items added!`)
  }

  const toggleItem = async (item) => {
    try {
      const { data } = await packingApi.updateItem(item.id, { isPacked: !item.isPacked })
      setItems(prev => prev.map(i => i.id === item.id ? data : i))
    } catch {
      toast.error('Failed to update item')
    }
  }

  const deleteItem = async (id) => {
    try {
      await packingApi.deleteItem(id)
      setItems(prev => prev.filter(i => i.id !== id))
    } catch {
      toast.error('Failed to delete item')
    }
  }

  const resetAll = async () => {
    if (!window.confirm('Mark all items as unpacked?')) return
    try {
      await packingApi.reset(tripId)
      setItems(prev => prev.map(i => ({ ...i, isPacked: false })))
      toast.success('Checklist reset!')
    } catch {
      toast.error('Failed to reset')
    }
  }

  const grouped = CATEGORIES.reduce((acc, cat) => {
    acc[cat.id] = items.filter(i => i.category === cat.id)
    return acc
  }, {})

  const packed = items.filter(i => i.isPacked).length
  const progress = items.length > 0 ? Math.round((packed / items.length) * 100) : 0

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(`/trips/${tripId}`)} className="p-2 rounded-lg text-dark-400 hover:text-white hover:bg-dark-700/50">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-display text-xl font-bold text-white">Packing Checklist</h1>
            <p className="text-dark-400 text-sm">{packed}/{items.length} items packed</p>
          </div>
        </div>
        <button onClick={resetAll} className="btn-ghost text-sm text-dark-400">
          <RotateCcw className="w-4 h-4" /> Reset
        </button>
      </div>

      {/* Progress bar */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-white font-semibold">Packing Progress</span>
          <span className={`text-sm font-bold ${progress === 100 ? 'text-emerald-400' : 'text-primary-400'}`}>
            {progress}%
          </span>
        </div>
        <div className="h-2.5 bg-dark-700 rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${progress === 100 ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-gradient-to-r from-primary-600 to-accent-500'}`}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        {progress === 100 && (
          <p className="text-emerald-400 text-sm mt-2 flex items-center gap-1">
            <Check className="w-4 h-4" /> All packed! You're ready to go! 🎉
          </p>
        )}
      </div>

      {/* Add item form */}
      <form onSubmit={addItem} className="glass-card p-4 flex gap-2">
        <input
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          placeholder="Add new item..."
          className="input-field flex-1 py-2"
        />
        <select
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          className="input-field py-2 w-auto"
        >
          {CATEGORIES.map(c => (
            <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>
          ))}
        </select>
        <button type="submit" className="btn-primary py-2 px-4">
          <Plus className="w-4 h-4" />
        </button>
      </form>

      {/* Category sections */}
      {loading ? (
        Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass-card h-20 animate-pulse" />
        ))
      ) : (
        CATEGORIES.map((cat) => {
          const catItems = grouped[cat.id] || []
          const catPacked = catItems.filter(i => i.isPacked).length
          const isCollapsed = collapsedCats[cat.id]

          return (
            <div key={cat.id} className="glass-card overflow-hidden">
              {/* Category header */}
              <button
                onClick={() => setCollapsedCats(prev => ({ ...prev, [cat.id]: !prev[cat.id] }))}
                className="w-full flex items-center gap-3 p-4 hover:bg-dark-700/20 transition-colors"
              >
                <span className="text-xl">{cat.emoji}</span>
                <span className={`font-semibold text-sm ${cat.color}`}>{cat.label}</span>
                <span className="text-xs text-dark-500 ml-1">
                  {catPacked}/{catItems.length} packed
                </span>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); addDefaultItems(cat.id) }}
                  className="ml-auto mr-2 text-xs text-dark-400 hover:text-primary-400 transition-colors px-2 py-1 rounded border border-dark-600 hover:border-primary-500/40"
                >
                  + Defaults
                </button>
                {isCollapsed ? <ChevronRight className="w-4 h-4 text-dark-500" /> : <ChevronDown className="w-4 h-4 text-dark-500" />}
              </button>

              {/* Items */}
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                    <div className="px-4 pb-4 space-y-1.5">
                      {catItems.length === 0 ? (
                        <p className="text-dark-600 text-xs py-2">No items. Add some or use Defaults.</p>
                      ) : (
                        catItems.map((item) => (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-3 group"
                          >
                            <button
                              onClick={() => toggleItem(item)}
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all
                                ${item.isPacked
                                  ? 'bg-emerald-500 border-emerald-500'
                                  : 'border-dark-500 hover:border-primary-400'
                                }`}
                            >
                              {item.isPacked && <Check className="w-3 h-3 text-white" />}
                            </button>
                            <span className={`text-sm flex-1 transition-all ${item.isPacked ? 'line-through text-dark-500' : 'text-dark-200'}`}>
                              {item.name}
                              {item.quantity > 1 && (
                                <span className="ml-2 text-xs text-dark-500">×{item.quantity}</span>
                              )}
                            </span>
                            <button
                              onClick={() => deleteItem(item.id)}
                              className="p-1 text-dark-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </motion.div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })
      )}
    </div>
  )
}

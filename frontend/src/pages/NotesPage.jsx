import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Edit2, Trash2, Pin, ArrowLeft, BookOpen,
  Bell, Calendar, FileText, Save, X, Loader2
} from 'lucide-react'
import { noteApi } from '../services/api'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const NOTE_TYPES = [
  { id: 'GENERAL', label: 'General', icon: FileText, color: 'text-primary-400', bg: 'bg-primary-500/10' },
  { id: 'REMINDER', label: 'Reminder', icon: Bell, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  { id: 'DAY_NOTE', label: 'Day Note', icon: Calendar, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
]

function NoteCard({ note, onEdit, onDelete, onPin }) {
  const typeInfo = NOTE_TYPES.find(t => t.id === note.type) || NOTE_TYPES[0]

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`glass-card p-4 group hover-card ${note.isPinned ? 'border border-amber-500/30' : ''}`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded-md ${typeInfo.bg} flex items-center justify-center`}>
            <typeInfo.icon className={`w-3.5 h-3.5 ${typeInfo.color}`} />
          </div>
          {note.isPinned && (
            <Pin className="w-3.5 h-3.5 text-amber-400 fill-current" />
          )}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onPin(note)} className="p-1 rounded hover:bg-dark-700 text-dark-400 hover:text-amber-400 transition-colors">
            <Pin className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onEdit(note)} className="p-1 rounded hover:bg-dark-700 text-dark-400 hover:text-primary-400 transition-colors">
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onDelete(note.id)} className="p-1 rounded hover:bg-dark-700 text-dark-400 hover:text-red-400 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {note.title && (
        <h3 className="text-white font-semibold text-sm mb-1">{note.title}</h3>
      )}
      <p className="text-dark-300 text-sm leading-relaxed whitespace-pre-wrap">{note.content}</p>

      <div className="flex items-center gap-3 mt-3 text-xs text-dark-500">
        <span>{format(new Date(note.createdAt), 'dd MMM yyyy, HH:mm')}</span>
        {note.day && <span>Day {note.day}</span>}
        {note.updatedAt !== note.createdAt && <span>Edited</span>}
      </div>
    </motion.div>
  )
}

function NoteModal({ note, onSave, onClose, tripId }) {
  const [form, setForm] = useState({
    title: note?.title || '',
    content: note?.content || '',
    type: note?.type || 'GENERAL',
    day: note?.day || '',
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!form.content.trim()) return toast.error('Content is required')
    setSaving(true)
    try {
      if (note?.id) {
        await noteApi.update(note.id, form)
      } else {
        await noteApi.create({ ...form, tripId })
      }
      onSave()
      toast.success(note?.id ? 'Note updated!' : 'Note added!')
    } catch {
      toast.error('Failed to save note')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-semibold">{note?.id ? 'Edit Note' : 'New Note'}</h2>
          <button onClick={onClose} className="p-1.5 rounded text-dark-400 hover:text-white hover:bg-dark-700/50">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="input-label">Type</label>
            <div className="flex gap-2">
              {NOTE_TYPES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setForm({ ...form, type: t.id })}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all
                    ${form.type === t.id
                      ? `${t.bg} ${t.color} border border-current/30`
                      : 'bg-dark-700/50 text-dark-400 hover:text-white border border-transparent'
                    }`}
                >
                  <t.icon className="w-3.5 h-3.5" />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="input-label">Title (optional)</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Note title..."
              className="input-field"
            />
          </div>

          <div>
            <label className="input-label">Content *</label>
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="Write your note..."
              rows={5}
              className="input-field resize-none"
              autoFocus
            />
          </div>

          {form.type === 'DAY_NOTE' && (
            <div>
              <label className="input-label">Day</label>
              <input
                type="number"
                min="1"
                value={form.day}
                onChange={(e) => setForm({ ...form, day: e.target.value })}
                placeholder="Trip day number"
                className="input-field"
              />
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 justify-center">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save Note</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function NotesPage() {
  const { id: tripId } = useParams()
  const navigate = useNavigate()
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')
  const [showModal, setShowModal] = useState(false)
  const [editNote, setEditNote] = useState(null)

  useEffect(() => { fetchNotes() }, [])

  const fetchNotes = async () => {
    setLoading(true)
    try {
      const { data } = await noteApi.getByTrip(tripId)
      setNotes(data || [])
    } catch {
      toast.error('Failed to load notes')
    } finally {
      setLoading(false)
    }
  }

  const deleteNote = async (id) => {
    if (!window.confirm('Delete this note?')) return
    try {
      await noteApi.delete(id)
      setNotes(prev => prev.filter(n => n.id !== id))
      toast.success('Note deleted')
    } catch {
      toast.error('Failed to delete')
    }
  }

  const togglePin = async (note) => {
    try {
      await noteApi.update(note.id, { isPinned: !note.isPinned })
      setNotes(prev => prev.map(n =>
        n.id === note.id ? { ...n, isPinned: !n.isPinned } : n
      ))
    } catch {}
  }

  const openEdit = (note) => {
    setEditNote(note)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditNote(null)
  }

  const filtered = filter === 'ALL' ? notes : notes.filter(n => n.type === filter)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(`/trips/${tripId}`)} className="p-2 rounded-lg text-dark-400 hover:text-white hover:bg-dark-700/50">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-display text-xl font-bold text-white">Notes & Journal</h1>
            <p className="text-dark-400 text-sm">{notes.length} notes</p>
          </div>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary text-sm">
          <Plus className="w-4 h-4" /> New Note
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {[{ id: 'ALL', label: 'All' }, ...NOTE_TYPES].map((t) => (
          <button
            key={t.id}
            onClick={() => setFilter(t.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all
              ${filter === t.id
                ? 'bg-primary-600/20 text-primary-400 border border-primary-500/30'
                : 'bg-dark-700/50 text-dark-400 hover:text-white'
              }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Notes grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glass-card h-36 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <BookOpen className="w-10 h-10 text-dark-500 mx-auto mb-3" />
          <p className="text-white font-semibold mb-2">No notes yet</p>
          <p className="text-dark-400 text-sm mb-6">Start journaling your trip experiences!</p>
          <button onClick={() => setShowModal(true)} className="btn-primary mx-auto">
            <Plus className="w-4 h-4" /> Write First Note
          </button>
        </div>
      ) : (
        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filtered.map((note) => (
              <NoteCard key={note.id} note={note} onEdit={openEdit} onDelete={deleteNote} onPin={togglePin} />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Modal */}
      {showModal && (
        <NoteModal
          note={editNote}
          tripId={tripId}
          onSave={() => { fetchNotes(); closeModal() }}
          onClose={closeModal}
        />
      )}
    </div>
  )
}

import { motion } from 'framer-motion'

const COLOR_VARIANTS = {
  primary: {
    icon: 'bg-primary-600/20 text-primary-400',
    glow: 'shadow-primary-900/20',
    value: 'text-primary-400',
  },
  accent: {
    icon: 'bg-accent-600/20 text-accent-400',
    glow: 'shadow-accent-900/20',
    value: 'text-accent-400',
  },
  amber: {
    icon: 'bg-amber-600/20 text-amber-400',
    glow: 'shadow-amber-900/20',
    value: 'text-amber-400',
  },
  emerald: {
    icon: 'bg-emerald-600/20 text-emerald-400',
    glow: 'shadow-emerald-900/20',
    value: 'text-emerald-400',
  },
}

export default function StatCard({ icon: Icon, label, value, color = 'primary', trend }) {
  const variant = COLOR_VARIANTS[color] || COLOR_VARIANTS.primary

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="glass-card p-5 flex flex-col gap-3"
    >
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-xl ${variant.icon} flex items-center justify-center`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div>
        <p className="text-dark-400 text-xs font-medium mb-1">{label}</p>
        <p className={`font-display text-2xl font-bold ${variant.value}`}>{value}</p>
        {trend && (
          <p className="text-dark-500 text-xs mt-1">{trend}</p>
        )}
      </div>
    </motion.div>
  )
}

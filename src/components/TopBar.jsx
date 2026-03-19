import { motion } from 'framer-motion'
import { Bell, Wifi, Battery, Clock } from 'lucide-react'

/**
 * TopBar — the main content area's header with status information.
 */
export default function TopBar() {
  // In future tasks these will be driven by real state
  const timeStr = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date())

  return (
    <header
      className="flex items-center justify-between px-6 py-4 border-b-2 border-gray-800 bg-gray-950/80 backdrop-blur-sm"
      role="banner"
    >
      {/* Left: page title */}
      <div>
        <h1 className="text-2xl font-extrabold text-white leading-none tracking-tight">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Interaction control panel</p>
      </div>

      {/* Right: status strip */}
      <div className="flex items-center gap-4">
        {/* Connection status */}
        <StatusPill icon={Wifi} label="Connected" colorClass="text-emerald-400" dotClass="bg-emerald-400" />

        {/* Battery (static placeholder) */}
        <StatusPill icon={Battery} label="87%" colorClass="text-gray-400" />

        {/* Clock */}
        <div className="hidden sm:flex items-center gap-1.5 text-gray-400">
          <Clock className="w-4 h-4" aria-hidden="true" />
          <span className="text-sm font-mono font-medium">{timeStr}</span>
        </div>

        {/* Notifications */}
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          className="relative p-2.5 rounded-xl bg-gray-800 border border-gray-700
                     text-gray-400 hover:text-white hover:border-gray-600
                     transition-colors duration-150
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          aria-label="Notifications (1 unread)"
          id="topbar-notifications-btn"
        >
          <Bell className="w-5 h-5" aria-hidden="true" />
          {/* Unread dot */}
          <motion.span
            className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500"
            animate={{ scale: [1, 1.4, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            aria-hidden="true"
          />
        </motion.button>
      </div>
    </header>
  )
}

function StatusPill({ icon: Icon, label, colorClass, dotClass }) {
  return (
    <div className={`hidden md:flex items-center gap-1.5 ${colorClass}`} aria-label={label}>
      {dotClass && (
        <motion.span
          className={`w-2 h-2 rounded-full ${dotClass}`}
          animate={{ opacity: [1, 0.4, 1] }}
          transition={{ duration: 1.8, repeat: Infinity }}
          aria-hidden="true"
        />
      )}
      <Icon className="w-4 h-4" aria-hidden="true" />
      <span className="text-sm font-medium">{label}</span>
    </div>
  )
}

import { motion } from 'framer-motion'
import {
  Activity, Settings, Eye, Accessibility,
  Volume2, Sliders, ChevronRight, Info,
  Moon, Maximize2,
} from 'lucide-react'

/**
 * Sidebar — left navigation panel with settings controls.
 * All settings are static UI; logic will be wired in future tasks.
 */
export default function Sidebar({ collapsed, onToggle }) {
  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 280 }}
      transition={{ type: 'spring', stiffness: 280, damping: 28 }}
      className="relative flex-shrink-0 h-full flex flex-col bg-gray-900 border-r-2 border-gray-800 overflow-hidden"
      aria-label="Settings sidebar"
    >
      {/* ── Brand header ── */}
      <div className="flex items-center gap-3 px-4 py-5 border-b-2 border-gray-800">
        <div className="flex-shrink-0 rounded-xl bg-cyan-500/15 border border-cyan-500/40 p-2.5">
          <Activity className="w-6 h-6 text-cyan-400" aria-hidden="true" />
        </div>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.05 }}
          >
            <p className="text-lg font-extrabold text-white leading-none tracking-tight">KinetiCalm</p>
            <p className="text-xs text-cyan-400 font-medium mt-0.5">Accessibility Suite</p>
          </motion.div>
        )}
      </div>

      {/* ── Nav sections ── */}
      <nav className="flex flex-col gap-1 flex-1 overflow-y-auto p-3" aria-label="Sidebar navigation">
        <SidebarSection label="Tracking" collapsed={collapsed}>
          <SidebarItem icon={Eye} label="Gaze Mode" badge="Off" collapsed={collapsed} />
          <SidebarItem icon={Activity} label="Tremor Filter" badge="On" active collapsed={collapsed} />
          <SidebarItem icon={Maximize2} label="Dwell Time" badge="1.2s" collapsed={collapsed} />
        </SidebarSection>

        <SidebarSection label="Display" collapsed={collapsed}>
          <SidebarItem icon={Moon} label="Dark Mode" badge="On" active collapsed={collapsed} />
          <SidebarItem icon={Sliders} label="Contrast" badge="High" collapsed={collapsed} />
          <SidebarItem icon={Accessibility} label="Large Targets" badge="On" active collapsed={collapsed} />
        </SidebarSection>

        <SidebarSection label="Audio" collapsed={collapsed}>
          <SidebarItem icon={Volume2} label="Voice Feedback" badge="Off" collapsed={collapsed} />
        </SidebarSection>
      </nav>

      {/* ── Footer ── */}
      <div className="mt-auto border-t-2 border-gray-800 p-3 flex flex-col gap-1">
        <SidebarItem icon={Settings} label="Preferences" collapsed={collapsed} />
        <SidebarItem icon={Info} label="About" collapsed={collapsed} />
      </div>

      {/* ── Collapse toggle ── */}
      <button
        onClick={onToggle}
        className="absolute -right-3.5 top-1/2 -translate-y-1/2 z-10
                   w-7 h-7 flex items-center justify-center
                   rounded-full bg-gray-800 border-2 border-gray-700
                   text-gray-400 hover:text-white hover:border-cyan-500
                   transition-all duration-200 shadow-lg"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        id="sidebar-toggle-btn"
      >
        <motion.div animate={{ rotate: collapsed ? 0 : 180 }} transition={{ duration: 0.25 }}>
          <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
        </motion.div>
      </button>
    </motion.aside>
  )
}

/* ── Sub-components ── */

function SidebarSection({ label, collapsed, children }) {
  return (
    <div className="mb-1">
      {!collapsed && (
        <p className="px-3 pt-3 pb-1 text-xs font-semibold text-gray-500 uppercase tracking-widest select-none">
          {label}
        </p>
      )}
      {children}
    </div>
  )
}

function SidebarItem({ icon: Icon, label, badge, active = false, collapsed }) {
  return (
    <button
      className={[
        'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150 group',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-1 focus-visible:ring-offset-gray-900',
        active
          ? 'bg-cyan-500/15 text-white border border-cyan-500/30'
          : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200 border border-transparent',
      ].join(' ')}
      aria-label={badge ? `${label}: ${badge}` : label}
      id={`sidebar-item-${label.toLowerCase().replace(/\s+/g, '-')}`}
      title={collapsed ? label : undefined}
    >
      <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-cyan-400' : 'text-gray-500 group-hover:text-gray-300'}`} aria-hidden="true" />
      {!collapsed && (
        <>
          <span className="flex-1 text-sm font-medium truncate">{label}</span>
          {badge && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
              active ? 'bg-cyan-500/25 text-cyan-300' : 'bg-gray-700 text-gray-400'
            }`}>
              {badge}
            </span>
          )}
        </>
      )}
    </button>
  )
}

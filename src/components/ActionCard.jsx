import { useState } from 'react'
import { motion } from 'framer-motion'

/**
 * ActionCard — a large, high-contrast interactive tile for tremor-friendly use.
 *
 * Props:
 *   icon       — Lucide icon component
 *   label      — primary button label
 *   description — secondary hint text
 *   accentColor — Tailwind color token key (e.g. 'cyan', 'violet', 'rose')
 *   onClick    — callback
 *   disabled   — whether the card is disabled
 */

const colorMap = {
  cyan:   { border: 'border-cyan-500/50',   bg: 'bg-cyan-500/10',   icon: 'text-cyan-400',   ring: 'focus-visible:ring-cyan-400',   active: 'active:bg-cyan-500/20' },
  violet: { border: 'border-violet-500/50', bg: 'bg-violet-500/10', icon: 'text-violet-400', ring: 'focus-visible:ring-violet-400', active: 'active:bg-violet-500/20' },
  rose:   { border: 'border-rose-500/50',   bg: 'bg-rose-500/10',   icon: 'text-rose-400',   ring: 'focus-visible:ring-rose-400',   active: 'active:bg-rose-500/20' },
  amber:  { border: 'border-amber-500/50',  bg: 'bg-amber-500/10',  icon: 'text-amber-400',  ring: 'focus-visible:ring-amber-400',  active: 'active:bg-amber-500/20' },
  emerald:{ border: 'border-emerald-500/50',bg: 'bg-emerald-500/10',icon: 'text-emerald-400',ring: 'focus-visible:ring-emerald-400',active: 'active:bg-emerald-500/20' },
  sky:    { border: 'border-sky-500/50',    bg: 'bg-sky-500/10',    icon: 'text-sky-400',    ring: 'focus-visible:ring-sky-400',    active: 'active:bg-sky-500/20' },
}

export default function ActionCard({
  icon: Icon,
  label,
  description,
  accentColor = 'cyan',
  onClick,
  disabled = false,
}) {
  const [isClicked, setIsClicked] = useState(false)
  const c = colorMap[accentColor] ?? colorMap.cyan

  const handleClick = (e) => {
    if (disabled) return
    setIsClicked(true)
    setTimeout(() => setIsClicked(false), 300)
    if (onClick) onClick(e)
  }

  return (
    <motion.button
      onClick={handleClick}
      disabled={disabled}
      whileHover={!disabled && !isClicked ? { scale: 1.03, y: -3 } : {}}
      whileTap={!disabled ? { scale: 0.97 } : {}}
      animate={
        isClicked
          ? { scale: 0.95, borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.2)' }
          : { scale: 1, borderColor: '', backgroundColor: '' }
      }
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      className={[
        'group relative w-full flex flex-col items-center justify-center gap-4 p-7 rounded-2xl',
        'border-2 bg-gray-900/80 backdrop-blur-sm text-left cursor-pointer',
        'transition-all duration-200 outline-none',
        'focus-visible:ring-4 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950',
        c.border, c.ring,
        disabled ? 'opacity-40 cursor-not-allowed' : `hover:${c.bg} ${c.active}`,
      ].join(' ')}
      aria-label={`${label}: ${description}`}
      id={`action-card-${label.toLowerCase().replace(/\s+/g, '-')}`}
      data-dwellable={!disabled ? 'true' : 'false'}
    >
      {/* Icon container */}
      <div className={`rounded-2xl p-4 ${c.bg} border ${c.border} transition-transform duration-200 group-hover:scale-105`}>
        <Icon className={`w-10 h-10 ${c.icon}`} aria-hidden="true" strokeWidth={1.75} />
      </div>

      {/* Text */}
      <div className="text-center">
        <p className="text-2xl font-bold text-white leading-tight">{label}</p>
        <p className="text-sm text-gray-400 mt-1 leading-snug">{description}</p>
      </div>

      {/* Subtle glow on hover — purely decorative */}
      <motion.div
        className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`}
        style={{
          background: `radial-gradient(ellipse at center, ${getGlowColor(accentColor)} 0%, transparent 70%)`,
        }}
      />
    </motion.button>
  )
}

function getGlowColor(color) {
  const glows = {
    cyan:    'rgba(6,182,212,0.06)',
    violet:  'rgba(139,92,246,0.06)',
    rose:    'rgba(244,63,94,0.06)',
    amber:   'rgba(245,158,11,0.06)',
    emerald: 'rgba(16,185,129,0.06)',
    sky:     'rgba(14,165,233,0.06)',
  }
  return glows[color] ?? glows.cyan
}

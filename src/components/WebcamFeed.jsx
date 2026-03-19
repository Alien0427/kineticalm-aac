import { motion } from 'framer-motion'
import { Camera, Wifi, WifiOff, AlertCircle } from 'lucide-react'

/**
 * WebcamFeed — styled placeholder for the live webcam tracking feed.
 * Tremor-tracking logic will be wired up in a future task.
 */
export default function WebcamFeed() {
  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden border-2 border-cyan-500/40 bg-gray-900"
      style={{ aspectRatio: '16/9', maxHeight: '340px' }}
      role="img"
      aria-label="Webcam feed placeholder — tremor tracking will appear here"
    >
      {/* Animated scanning gradient overlay */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 via-transparent to-cyan-500/10"
        animate={{ opacity: [0.4, 0.8, 0.4] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Scan-line effect */}
      <motion.div
        className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-60"
        animate={{ top: ['0%', '100%'], opacity: [0, 0.8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
      />

      {/* Corner brackets — HUD-style framing */}
      {['top-3 left-3', 'top-3 right-3', 'bottom-3 left-3', 'bottom-3 right-3'].map((pos, i) => (
        <div
          key={i}
          className={`absolute ${pos} w-6 h-6 border-cyan-400`}
          style={{
            borderTopWidth: i < 2 ? 2 : 0,
            borderBottomWidth: i >= 2 ? 2 : 0,
            borderLeftWidth: i % 2 === 0 ? 2 : 0,
            borderRightWidth: i % 2 === 1 ? 2 : 0,
            borderRadius: i < 2
              ? (i === 0 ? '4px 0 0 0' : '0 4px 0 0')
              : (i === 2 ? '0 0 0 4px' : '0 0 4px 0'),
          }}
        />
      ))}

      {/* Central content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center p-6">
        <motion.div
          className="rounded-full p-5 bg-gray-800/80 border border-cyan-500/30"
          animate={{ scale: [1, 1.04, 1] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Camera className="w-10 h-10 text-cyan-400" aria-hidden="true" />
        </motion.div>

        <div>
          <p className="text-xl font-bold text-white">Webcam Feed</p>
          <p className="text-sm text-gray-400 mt-1 max-w-sm">
            Live tremor tracking will appear here. Camera permission required.
          </p>
        </div>

        {/* Status badges */}
        <div className="flex items-center gap-3 flex-wrap justify-center">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-sm font-medium">
            <AlertCircle className="w-4 h-4" aria-hidden="true" />
            Camera Inactive
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-800 border border-gray-700 text-gray-400 text-sm font-medium">
            <WifiOff className="w-4 h-4" aria-hidden="true" />
            Tracking Off
          </span>
        </div>
      </div>

      {/* Live indicator (pulsing dot in top-right) */}
      <div className="absolute top-4 right-14 flex items-center gap-2">
        <motion.span
          className="w-2.5 h-2.5 rounded-full bg-amber-400"
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        />
        <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Waiting</span>
      </div>
    </div>
  )
}

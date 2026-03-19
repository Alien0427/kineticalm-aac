import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Droplet, Check, X, Sofa,
  Bed, Activity, BellRing, Heart
} from 'lucide-react'

import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import WebcamFeed from './components/WebcamFeed'
import ActionCard from './components/ActionCard'
import KinetiCalmCursor from './components/KinetiCalmCursor'
import useFaceTracking from './hooks/useFaceTracking'

/**
 * Utility function to synthesize speech.
 * Kept outside the component so it doesn't recreate on re-renders.
 */
function speakText(text) {
  if (!('speechSynthesis' in window)) {
    console.warn("Web Speech API not supported in this browser.")
    return
  }

  window.speechSynthesis.cancel()

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.rate = 0.9
  utterance.pitch = 1

  const voices = window.speechSynthesis.getVoices()
  const clearVoice = voices.find((v) => v.lang.startsWith('en-') && v.name.includes('Google')) || voices[0]
  if (clearVoice) {
    utterance.voice = clearVoice
  }

  window.speechSynthesis.speak(utterance)
}

/* ── Initial AAC State ── */
const INITIAL_AAC_CARDS = [
  { id: 1, text: 'I need water', icon: Droplet, accentColor: 'cyan' },
  { id: 2, text: 'Yes', icon: Check, accentColor: 'emerald' },
  { id: 3, text: 'No', icon: X, accentColor: 'rose' },
  { id: 4, text: 'Please adjust my chair', icon: Sofa, accentColor: 'violet' },
  { id: 5, text: 'I want to rest', icon: Bed, accentColor: 'sky' },
  { id: 6, text: 'I am in pain', icon: Activity, accentColor: 'rose' },
  { id: 7, text: 'Call caregiver', icon: BellRing, accentColor: 'amber' },
  { id: 8, text: 'Thank you', icon: Heart, accentColor: 'emerald' },
]

/* ── Animation variants for staggered card entrance ── */
const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.15,
    },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 260, damping: 24 },
  },
}

export default function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [aacCards] = useState(INITIAL_AAC_CARDS)

  // Hardware Tracking Setup
  const videoRef = useRef(null)
  const nosePosRef = useFaceTracking(videoRef)

  // 🧪 [TESTING BACKDOOR] Expose synthetic coordinate overriding to Playwright
  useEffect(() => {
    // Only expose this globally in development builds for security
    if (import.meta.env.MODE !== 'production') {
      window.forceCursorPosition = (viewportX, viewportY) => {
        // Playwright inputs raw screen pixels. We must calculate the inverse math
        // to pass MediaPipe's normalized [0,1] format back into your KinetiCalmCursor.
        // Because X is inverted/mirrored: screenX = (1 - x) * window.innerWidth
        const rawX = 1 - (viewportX / window.innerWidth)
        const rawY = viewportY / window.innerHeight
        
        nosePosRef.current = { x: rawX, y: rawY }
      }
    }
    
    return () => delete window.forceCursorPosition
  }, [nosePosRef])

  // Handlers
  const handleCardClick = (text) => {
    console.log(`AAC Triggered: ${text}`)
    speakText(text)
  }

  return (
    <div className="flex h-screen w-screen bg-gray-950 overflow-hidden" id="app-root">
      {/* ── Hidden Video feed for MediaPipe ── */}
      <video ref={videoRef} className="hidden" autoPlay playsInline muted />

      {/* ── The Custom Dwell-to-Click Cursor ── */}
      <KinetiCalmCursor nosePosRef={nosePosRef} />

      {/* ── Sidebar ── */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((c) => !c)}
      />

      {/* ── Main content column ── */}
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">
        {/* Top bar */}
        <TopBar />

        {/* Scrollable content */}
        <main
          className="flex-1 overflow-y-auto p-6 space-y-8"
          id="main-content"
          aria-label="Main interaction area"
        >
          {/* ── Section 1: Webcam tracking feed ── */}
          <section aria-labelledby="webcam-section-heading">
            <div className="flex items-center justify-between mb-4">
              <h2
                id="webcam-section-heading"
                className="text-lg font-bold text-white"
              >
                Tremor Tracking Feed
              </h2>
              <span className="text-xs px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-medium">
                Setup Required
              </span>
            </div>
            <WebcamFeed />
          </section>

          {/* ── Section divider ── */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-gray-800" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 bg-gray-950 text-xs text-gray-600 font-medium uppercase tracking-widest">
                Quick Actions
              </span>
            </div>
          </div>

          {/* ── Section 2: Action cards grid ── */}
          <section aria-labelledby="actions-section-heading">
            <h2
              id="actions-section-heading"
              className="sr-only"
            >
              Action Cards
            </h2>

            <motion.div
              className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              role="list"
              aria-label="Available actions"
            >
              {aacCards.map((card) => (
                <motion.div
                  key={card.id}
                  variants={cardVariants}
                  role="listitem"
                >
                  <ActionCard
                    icon={card.icon}
                    label={card.text}
                    description="Dwell to speak"
                    accentColor={card.accentColor}
                    onClick={() => handleCardClick(card.text)}
                  />
                </motion.div>
              ))}
            </motion.div>
          </section>

          {/* ── Accessibility status footer bar ── */}
          <div
            className="flex flex-wrap items-center gap-3 p-4 rounded-2xl
                        bg-gray-900/60 border border-gray-800"
            role="status"
            aria-live="polite"
            aria-label="Accessibility status"
          >
            <span className="text-sm font-semibold text-gray-400">Active Aids:</span>
            {[
              { label: 'Tremor Filter', on: true },
              { label: 'High Contrast', on: true },
              { label: 'Large Targets', on: true },
              { label: 'Gaze Tracking', on: false },
              { label: 'Voice Output', on: false },
            ].map(({ label, on }) => (
              <span
                key={label}
                className={`text-xs px-3 py-1.5 rounded-full font-semibold border ${
                  on
                    ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300'
                    : 'bg-gray-800 border-gray-700 text-gray-500'
                }`}
              >
                {label}: {on ? 'On' : 'Off'}
              </span>
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}

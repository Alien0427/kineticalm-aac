import { useEffect, useRef } from 'react'
import { motion, useAnimation } from 'framer-motion'

/**
 * KinetiCalmCursor - Overlays a custom cursor driven by webcam nose tracking.
 * It demonstrates a Simple Moving Average (SMA) algorithm to smooth out motor tremors.
 * Now equipped with "Dwell-to-Click" logic using document.elementFromPoint.
 * 
 * @param {React.MutableRefObject} nosePosRef - A ref containing normalized {x, y} coordinates.
 */
export default function KinetiCalmCursor({ nosePosRef }) {
  // DOM Refs
  const smoothCursorRef = useRef(null)
  const rawCursorRef = useRef(null)

  // Tracking history for SMA algorithm
  const historyX = useRef([])
  const historyY = useRef([])
  const HISTORY_SIZE = 15

  // Dwell-to-Click Refs
  const dwellTargetRef = useRef(null)
  const dwellStartTimeRef = useRef(0)
  const isDwellingRef = useRef(false)
  const DWELL_TIME_MS = 1500

  // Framer Motion controls for the dynamic SVG progress ring
  const svgControls = useAnimation()
  const CIRCUMFERENCE = 164 // ~ 2 * pi * 26 (radius)

  useEffect(() => {
    let animationFrameId
    
    // Ensure the ring starts empty
    svgControls.set({ strokeDashoffset: CIRCUMFERENCE })
    
    function renderLoop() {
      if (!nosePosRef || !nosePosRef.current) {
        animationFrameId = requestAnimationFrame(renderLoop)
        return
      }

      const { x, y } = nosePosRef.current
      
      const screenX = (1 - x) * window.innerWidth
      const screenY = y * window.innerHeight

      // 1. Raw Cursor
      if (rawCursorRef.current) {
        rawCursorRef.current.style.transform = `translate3d(${screenX}px, ${screenY}px, 0) translate(-50%, -50%)`
      }

      // 2. SMA Algorithm
      historyX.current.push(screenX)
      historyY.current.push(screenY)

      if (historyX.current.length > HISTORY_SIZE) {
        historyX.current.shift()
        historyY.current.shift()
      }

      const avgX = historyX.current.reduce((sum, val) => sum + val, 0) / historyX.current.length
      const avgY = historyY.current.reduce((sum, val) => sum + val, 0) / historyY.current.length

      // 3. Smoothed Cursor
      if (smoothCursorRef.current) {
        smoothCursorRef.current.style.transform = `translate3d(${avgX}px, ${avgY}px, 0) translate(-50%, -50%)`
      }

      // 4. Dwell-to-Click Logic
      // Only check if coordinates are valid numbers to prevent crashes
      if (!isNaN(avgX) && !isNaN(avgY)) {
        // Find what element is beneath the smoothed cursor
        const hoveredElement = document.elementFromPoint(avgX, avgY)
        const dwellableElement = hoveredElement ? hoveredElement.closest('[data-dwellable="true"]') : null

        if (dwellableElement) {
          if (dwellTargetRef.current !== dwellableElement) {
            // Started hovering a NEW dwellable element
            dwellTargetRef.current = dwellableElement
            dwellStartTimeRef.current = performance.now()
            isDwellingRef.current = true
            
            // Start the SVG ring fill animation
            svgControls.start({
              strokeDashoffset: 0,
              transition: { duration: DWELL_TIME_MS / 1000, ease: 'linear' }
            })
          } else if (isDwellingRef.current) {
            // Continuing to hover the same element
            const elapsed = performance.now() - dwellStartTimeRef.current
            if (elapsed >= DWELL_TIME_MS) {
              // Time's up! Trigger native click programmatically
              dwellableElement.click()
              
              // Reset so it doesn't multi-click immediately
              isDwellingRef.current = false
              dwellTargetRef.current = null
              svgControls.stop()
              svgControls.set({ strokeDashoffset: CIRCUMFERENCE })
            }
          }
        } else {
          // Moved off dwellable elements
          if (dwellTargetRef.current !== null) {
            dwellTargetRef.current = null
            isDwellingRef.current = false
            svgControls.stop()
            svgControls.set({ strokeDashoffset: CIRCUMFERENCE })
          }
        }
      }

      animationFrameId = requestAnimationFrame(renderLoop)
    }

    renderLoop()

    return () => cancelAnimationFrame(animationFrameId)
  }, [nosePosRef, svgControls])

  return (
    <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden">
      
      {/* Raw Jittery Red Dot */}
      <div
        ref={rawCursorRef}
        className="absolute top-0 left-0 w-3 h-3 bg-red-500 rounded-full opacity-60 shadow-[0_0_12px_rgba(239,68,68,0.8)] pointer-events-none will-change-transform"
        style={{ transform: `translate3d(-50%, -50%, 0)` }}
        aria-hidden="true"
      />
      
      {/* Smoothed Cursor Container */}
      <div
        ref={smoothCursorRef}
        className="absolute top-0 left-0 w-16 h-16 pointer-events-none will-change-transform flex justify-center items-center"
        style={{ transform: `translate3d(-50%, -50%, 0)` }}
        aria-hidden="true"
      >
        {/* The visual inner ring */}
        <div className="absolute inset-0 border-[3px] border-cyan-400/40 bg-cyan-400/10 rounded-full backdrop-blur-[1px] shadow-[0_0_20px_rgba(34,211,238,0.3)]" />
        
        {/* The animated progressive SVG fill ring */}
        <svg width="64" height="64" className="absolute inset-0 -rotate-90">
          <motion.circle
            cx="32"
            cy="32"
            r="26"
            fill="transparent"
            stroke="#22d3ee" // cyan-400
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            animate={svgControls}
            initial={{ strokeDashoffset: CIRCUMFERENCE }}
          />
        </svg>

        {/* Center pinpoint */}
        <div className="w-1.5 h-1.5 bg-cyan-300 rounded-full shadow-[0_0_8px_rgba(34,211,238,1)] z-10" />
      </div>

    </div>
  )
}

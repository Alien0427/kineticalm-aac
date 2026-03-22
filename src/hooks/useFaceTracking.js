import { useEffect, useRef, useState, useCallback } from 'react'
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision'

/**
 * useFaceTracking - Custom hook to integrate MediaPipe FaceLandmarker with the webcam.
 *
 * Design decisions:
 *  - startTracking() is ONLY ever called from a user-gesture handler (button click),
 *    satisfying browser autoplay / getUserMedia policies.
 *  - predictWebcam() is defined inside startTracking so it closes over the
 *    correct landmarker + videoRef references without stale-closure risk.
 *  - lastVideoTime is kept in a ref so it is NOT reset on every render.
 *
 * @param {React.RefObject} videoRef - React ref attached to the <video> element.
 * @returns {{ nosePosRef, isTracking, startTracking }}
 */
export default function useFaceTracking(videoRef) {
  const nosePosRef   = useRef({ x: 0.5, y: 0.5 })
  const [isTracking, setIsTracking] = useState(false)

  const faceLandmarkerRef    = useRef(null)
  const animationFrameIdRef  = useRef(null)
  const activeRef            = useRef(false)
  const lastVideoTimeRef     = useRef(-1)   // <-- fix: was a plain variable, reset on every render

  /**
   * startTracking — must be triggered by a physical user gesture (button click).
   * Requesting getUserMedia outside a gesture handler will be blocked by most browsers.
   */
  const startTracking = useCallback(async () => {
    // Guard: do nothing if already tracking or initialising
    if (isTracking || activeRef.current) return
    activeRef.current = true

    try {
      // ── Step 1: Load MediaPipe WASM + FaceLandmarker model ──────────────────
      const filesetResolver = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      )

      const landmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          delegate: 'GPU',
        },
        outputFaceBlendshapes: false,
        runningMode: 'VIDEO',
        numFaces: 1,
      })

      // If the component unmounted while we were loading, bail cleanly
      if (!activeRef.current) {
        landmarker.close()
        return
      }

      faceLandmarkerRef.current = landmarker

      // ── Step 2: Request webcam access (requires the user gesture above) ──────
      // If videoRef hasn't mounted yet, we cannot proceed
      if (!videoRef.current) {
        console.error('useFaceTracking: videoRef is not attached to a <video> element.')
        activeRef.current = false
        return
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width:      1280,
          height:     720,
          facingMode: 'user',
        },
      })

      // Another unmount guard after the async permission prompt
      if (!activeRef.current) {
        stream.getTracks().forEach((t) => t.stop())
        return
      }

      videoRef.current.srcObject = stream

      // ── Step 3: Start the prediction loop once the video data is ready ───────
      // onloadeddata fires when the first frame is available and the video
      // dimensions are known — exactly what MediaPipe needs.
      videoRef.current.onloadeddata = () => {
        if (!activeRef.current || !videoRef.current) return
        videoRef.current
          .play()
          .then(() => {
            setIsTracking(true)   // <-- UI: hides placeholder, shows live feed
            predictWebcam()
          })
          .catch((err) => {
            console.error('useFaceTracking: video.play() failed:', err)
            activeRef.current = false
            setIsTracking(false)
          })
      }
    } catch (error) {
      console.error('useFaceTracking: setup failed:', error)
      activeRef.current = false
      setIsTracking(false)
    }

    // ── Inner prediction loop ────────────────────────────────────────────────
    // Defined inside startTracking so it closes over `landmarker` and
    // `videoRef` at the time tracking started — no stale-closure risk.
    function predictWebcam() {
      if (!activeRef.current || !videoRef.current || !faceLandmarkerRef.current) return

      const video = videoRef.current

      // Only run inference when a new frame has arrived
      if (video.currentTime !== lastVideoTimeRef.current) {
        lastVideoTimeRef.current = video.currentTime

        const results = faceLandmarkerRef.current.detectForVideo(
          video,
          performance.now()
        )

        if (results.faceLandmarks && results.faceLandmarks.length > 0) {
          // Landmark index 1 == nose tip in the canonical MediaPipe 468-point map
          const noseTip = results.faceLandmarks[0][1]
          nosePosRef.current = { x: noseTip.x, y: noseTip.y }
        }
      }

      animationFrameIdRef.current = requestAnimationFrame(predictWebcam)
    }
  }, [isTracking, videoRef])

  // ── Cleanup on unmount ───────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      activeRef.current = false

      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current)
      }

      if (faceLandmarkerRef.current) {
        faceLandmarkerRef.current.close()
        faceLandmarkerRef.current = null
      }

      // Release the camera hardware
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((t) => t.stop())
        videoRef.current.srcObject = null
      }
    }
  }, [videoRef])

  return { nosePosRef, isTracking, startTracking }
}

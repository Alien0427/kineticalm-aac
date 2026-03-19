import { useEffect, useRef } from 'react'
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision'

/**
 * useFaceTracking - Custom hook to integrate MediaPipe FaceLandmarker with the webcam.
 *
 * @param {React.RefObject} videoRef - React ref attached to the <video> element.
 * @returns {React.MutableRefObject} nosePosRef - A ref holding the raw, normalized {x, y} coordinates of the nose tip.
 */
export default function useFaceTracking(videoRef) {
  // Silent ref to store coordinates without triggering re-renders
  const nosePosRef = useRef({ x: 0.5, y: 0.5 })

  useEffect(() => {
    let active = true
    let faceLandmarker = null
    let animationFrameId = null
    let lastVideoTime = -1
    let hasLoggedActive = false

    async function setupTracking() {
      try {
        // 1. Initialize FaceLandmarker using WebAssembly files
        const filesetResolver = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        )

        faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
            delegate: 'GPU',
          },
          outputFaceBlendshapes: false,
          runningMode: 'VIDEO',
          numFaces: 1,
        })

        if (!active) {
          faceLandmarker.close()
          return
        }

        // 2. Initialize the Webcam stream
        if (!videoRef.current) return

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: 1280,
            height: 720,
            facingMode: 'user',
          },
        })

        if (!active) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }

        videoRef.current.srcObject = stream
        videoRef.current.onloadeddata = () => {
          if (active) {
            videoRef.current.play()
            predictWebcam()
          }
        }
      } catch (error) {
        console.error('Error setting up face tracking:', error)
      }
    }

    // 3. Animation loop using requestAnimationFrame
    function predictWebcam() {
      if (!active || !videoRef.current || !faceLandmarker) return

      // Only process when video frame has advanced
      if (videoRef.current.currentTime !== lastVideoTime) {
        lastVideoTime = videoRef.current.currentTime
        const startTimeMs = performance.now()
        
        // Detect face landmarks for the current video frame
        const results = faceLandmarker.detectForVideo(videoRef.current, startTimeMs)

        if (results.faceLandmarks && results.faceLandmarks.length > 0) {
          // Log exactly once per continuous active tracking session
          if (!hasLoggedActive) {
            console.log('Tracking Active')
            hasLoggedActive = true
          }

          // 4. Extract the coordinates of the nose tip (landmark 1)
          const noseTip = results.faceLandmarks[0][1]

          // 5. Update the ref silently
          nosePosRef.current = { x: noseTip.x, y: noseTip.y }
        } else {
          // Reset logging tracker if face goes out of view
          hasLoggedActive = false
        }
      }

      animationFrameId = requestAnimationFrame(predictWebcam)
    }

    setupTracking()

    // Cleanup phase on component unmount
    return () => {
      active = false
      if (animationFrameId) cancelAnimationFrame(animationFrameId)
      if (faceLandmarker) faceLandmarker.close()
      
      // Stop webcam tracks
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop())
      }
    }
  }, [videoRef])

  // Return the mutable ref that holds coordinates WITHOUT triggering renders
  return nosePosRef
}

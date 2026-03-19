import { useEffect, useRef, useState, useCallback } from 'react'
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision'

/**
 * useFaceTracking - Custom hook to integrate MediaPipe FaceLandmarker with the webcam.
 *
 * @param {React.RefObject} videoRef - React ref attached to the <video> element.
 * @returns {Object} { nosePosRef, isTracking, startTracking }
 */
export default function useFaceTracking(videoRef) {
  const nosePosRef = useRef({ x: 0.5, y: 0.5 })
  const [isTracking, setIsTracking] = useState(false)
  const faceLandmarkerRef = useRef(null)
  const animationFrameIdRef = useRef(null)
  const activeRef = useRef(false)

  const startTracking = useCallback(async () => {
    if (isTracking || activeRef.current) return
    activeRef.current = true

    try {
      // 1. Initialize FaceLandmarker using WebAssembly files
      const filesetResolver = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      )

      const landmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          delegate: 'GPU',
        },
        outputFaceBlendshapes: false,
        runningMode: 'VIDEO',
        numFaces: 1,
      })

      if (!activeRef.current) {
        landmarker.close()
        return
      }

      faceLandmarkerRef.current = landmarker

      // 2. Initialize the Webcam stream (Requires User Gesture on Vercel/Prod)
      if (!videoRef.current) return

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: 1280,
          height: 720,
          facingMode: 'user',
        },
      })

      if (!activeRef.current) {
        stream.getTracks().forEach((track) => track.stop())
        return
      }

      videoRef.current.srcObject = stream
      videoRef.current.onloadeddata = () => {
        if (activeRef.current) {
          videoRef.current.play()
          setIsTracking(true)
          predictWebcam()
        }
      }
    } catch (error) {
      console.error('Error setting up face tracking:', error)
      activeRef.current = false
      setIsTracking(false)
    }
  }, [videoRef, isTracking])

  // 3. Animation loop using requestAnimationFrame
  let lastVideoTime = -1
  let hasLoggedActive = false

  function predictWebcam() {
    if (!activeRef.current || !videoRef.current || !faceLandmarkerRef.current) return

    if (videoRef.current.currentTime !== lastVideoTime) {
      lastVideoTime = videoRef.current.currentTime
      const startTimeMs = performance.now()
      
      const results = faceLandmarkerRef.current.detectForVideo(videoRef.current, startTimeMs)

      if (results.faceLandmarks && results.faceLandmarks.length > 0) {
        if (!hasLoggedActive) {
          console.log('Tracking Active')
          hasLoggedActive = true
        }
        const noseTip = results.faceLandmarks[0][1]
        nosePosRef.current = { x: noseTip.x, y: noseTip.y }
      } else {
        hasLoggedActive = false
      }
    }

    animationFrameIdRef.current = requestAnimationFrame(predictWebcam)
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      activeRef.current = false
      setIsTracking(false)
      if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current)
      if (faceLandmarkerRef.current) faceLandmarkerRef.current.close()
      
      // Stop webcam tracks
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop())
      }
    }
  }, [videoRef])

  return { nosePosRef, isTracking, startTracking }
}

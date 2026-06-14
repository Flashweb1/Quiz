import { useEffect, useRef, useState } from 'react'
import { Camera, CameraOff } from 'lucide-react'
import useExamStore from '../store/examStore'

export default function ProctoringOverlay() {
  const { trustScore, isQuizActive } = useExamStore()
  const videoRef = useRef(null)
  const [webcamActive, setWebcamActive] = useState(false)
  const [webcamError, setWebcamError] = useState(null)
  const streamRef = useRef(null)

  useEffect(() => {
    if (!isQuizActive) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
      }
      return
    }
    async function startWebcam() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 160 }, height: { ideal: 120 } }
        })
        streamRef.current = stream
        if (videoRef.current) videoRef.current.srcObject = stream
        setWebcamActive(true)
        setWebcamError(null)
      } catch (err) {
        setWebcamError('Camera blocked')
        trustScore.addViolation('FACE_LOST', 'Camera denied')
      }
    }
    startWebcam()
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
    }
  }, [isQuizActive])

  if (!isQuizActive) return null

  return (
    <div className="relative w-10 h-8 sm:w-14 sm:h-11 rounded-lg overflow-hidden bg-slate-800 border border-slate-700/50 flex-shrink-0">
      {webcamActive ? (
        <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          {webcamError ? <CameraOff className="w-3.5 h-3.5 text-red-400" /> : <Camera className="w-3.5 h-3.5 text-slate-600" />}
        </div>
      )}
      <div className={`absolute bottom-0 left-0 right-0 h-0.5 transition-all duration-500 ${
        trustScore.getScore() >= 80 ? 'bg-emerald-500' : trustScore.getScore() >= 50 ? 'bg-amber-500' : 'bg-red-500'
      }`} />
    </div>
  )
}

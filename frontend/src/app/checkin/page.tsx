'use client'
import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, XCircle, Camera, RefreshCw, BookOpen } from 'lucide-react'
import { attendanceAPI } from '@/lib/api'

type Status = 'idle' | 'scanning' | 'success' | 'error' | 'already'

export default function CheckInPage() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const intervalRef = useRef<any>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [result, setResult] = useState<any>(null)
  const [message, setMessage] = useState('')
  const [cameraError, setCameraError] = useState('')
  const [scanning, setScanning] = useState(false)

  const startCamera = async () => {
    setCameraError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
        setScanning(true)
        setStatus('scanning')
        startScanning()
      }
    } catch (err) {
      setCameraError('Camera access denied. Please allow camera permission and try again.')
    }
  }

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
      tracks.forEach(t => t.stop())
      videoRef.current.srcObject = null
    }
    if (intervalRef.current) clearInterval(intervalRef.current)
    setScanning(false)
  }

  const startScanning = () => {
    // Use jsQR library loaded via script tag
    intervalRef.current = setInterval(() => {
      if (!videoRef.current || !canvasRef.current) return
      const video = videoRef.current
      const canvas = canvasRef.current
      if (video.readyState !== video.HAVE_ENOUGH_DATA) return
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      // @ts-ignore
      const code = window.jsQR?.(imageData.data, imageData.width, imageData.height)
      if (code?.data) {
        clearInterval(intervalRef.current)
        handleQRData(code.data)
      }
    }, 300)
  }

  const handleQRData = async (data: string) => {
    stopCamera()
    setStatus('scanning')
    try {
      const parsed = JSON.parse(data)
      if (!parsed.studentId) throw new Error('Invalid QR')
      const res = await attendanceAPI.qrCheckin(data)
      setResult(res.data.student)
      setMessage(res.data.message)
      setStatus('success')
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Invalid QR code'
      if (msg.toLowerCase().includes('already')) {
        setStatus('already')
        setMessage('Already checked in today!')
      } else {
        setStatus('error')
        setMessage(msg)
      }
    }
  }

  const reset = () => {
    setStatus('idle')
    setResult(null)
    setMessage('')
    stopCamera()
  }

  useEffect(() => () => stopCamera(), [])

  return (
    <>
      {/* Load jsQR from CDN */}
      <script src="https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js" async />

      <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden"
        style={{ background: 'var(--bg-primary)' }}>

        {/* Background glow */}
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(255,125,15,0.5) 0%, transparent 70%)' }} />

        <div className="w-full max-w-sm">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-3 shadow-lg"
              style={{ background: 'linear-gradient(135deg, var(--saffron), #c74608)' }}>
              <BookOpen size={24} color="white" />
            </div>
            <h1 className="text-2xl font-display font-bold" style={{ color: 'var(--text-primary)' }}>
              Attendance Check-In
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              Scan your QR code to mark attendance
            </p>
          </div>

          {/* Idle state */}
          {status === 'idle' && (
            <div className="card p-6 text-center animate-in">
              <Camera size={40} className="mx-auto mb-4" style={{ color: 'var(--saffron)' }} />
              <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>
                Tap the button below to open your camera and scan the QR code shown by the admin
              </p>
              {cameraError && (
                <p className="text-xs mb-4 p-3 rounded-lg" style={{ background: 'var(--red-light)', color: 'var(--red)' }}>
                  {cameraError}
                </p>
              )}
              <button onClick={startCamera} className="btn-primary w-full justify-center py-3">
                <Camera size={18} /> Open Camera & Scan
              </button>
            </div>
          )}

          {/* Scanning state */}
          {status === 'scanning' && (
            <div className="card overflow-hidden animate-in">
              <div className="relative">
                <video ref={videoRef} className="w-full" playsInline muted />
                <canvas ref={canvasRef} className="hidden" />
                {/* Scanner overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="relative w-52 h-52">
                    {/* Corner brackets */}
                    {[
                      'top-0 left-0 border-t-4 border-l-4 rounded-tl-lg',
                      'top-0 right-0 border-t-4 border-r-4 rounded-tr-lg',
                      'bottom-0 left-0 border-b-4 border-l-4 rounded-bl-lg',
                      'bottom-0 right-0 border-b-4 border-r-4 rounded-br-lg',
                    ].map((cls, i) => (
                      <div key={i} className={`absolute w-8 h-8 ${cls}`}
                        style={{ borderColor: 'var(--saffron)' }} />
                    ))}
                    {/* Scan line animation */}
                    <div className="absolute left-1 right-1 h-0.5 animate-bounce"
                      style={{ background: 'var(--saffron)', top: '50%', animationDuration: '1.5s' }} />
                  </div>
                </div>
                {/* Dark overlay outside scan area */}
                <div className="absolute inset-0 pointer-events-none"
                  style={{ background: 'linear-gradient(rgba(0,0,0,0.4) 0%, transparent 25%, transparent 75%, rgba(0,0,0,0.4) 100%)' }} />
              </div>
              <div className="p-4 text-center">
                <p className="text-sm font-medium animate-pulse" style={{ color: 'var(--saffron)' }}>
                  📷 Scanning... Point camera at QR code
                </p>
                <button onClick={reset} className="btn-secondary text-xs mt-3 mx-auto">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Success state */}
          {status === 'success' && result && (
            <div className="card p-6 text-center animate-in">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: 'var(--green-light)' }}>
                <CheckCircle2 size={32} style={{ color: 'var(--green)' }} />
              </div>
              <h2 className="text-xl font-display font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                Welcome, {result.name}! 👋
              </h2>
              <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
                Attendance marked for today
              </p>
              <div className="p-4 rounded-xl mb-5 space-y-2" style={{ background: 'var(--green-light)' }}>
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'var(--text-muted)' }}>Seat</span>
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>#{result.seatNumber || 'N/A'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'var(--text-muted)' }}>Shift</span>
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{result.shift}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'var(--text-muted)' }}>Time</span>
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                    {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'var(--text-muted)' }}>Date</span>
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                    {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>
              <button onClick={reset} className="btn-primary w-full justify-center">
                <RefreshCw size={15} /> Scan Another
              </button>
            </div>
          )}

          {/* Already checked in */}
          {status === 'already' && (
            <div className="card p-6 text-center animate-in">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: 'var(--amber-light)' }}>
                <CheckCircle2 size={32} style={{ color: 'var(--amber)' }} />
              </div>
              <h2 className="text-xl font-display font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                Already Checked In
              </h2>
              <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>
                {message}
              </p>
              <button onClick={reset} className="btn-secondary w-full justify-center">
                <RefreshCw size={15} /> Scan Another
              </button>
            </div>
          )}

          {/* Error state */}
          {status === 'error' && (
            <div className="card p-6 text-center animate-in">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: 'var(--red-light)' }}>
                <XCircle size={32} style={{ color: 'var(--red)' }} />
              </div>
              <h2 className="text-xl font-display font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                Scan Failed
              </h2>
              <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>{message}</p>
              <button onClick={reset} className="btn-primary w-full justify-center">
                <RefreshCw size={15} /> Try Again
              </button>
            </div>
          )}

          <p className="text-center text-xs mt-5" style={{ color: 'var(--text-muted)' }}>
            📚 Smart Study Library · Abhyasika
          </p>
        </div>
      </div>
    </>
  )
}

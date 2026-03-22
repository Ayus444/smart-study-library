'use client'
import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, XCircle, Camera, RefreshCw, BookOpen, AlertCircle } from 'lucide-react'

type Status = 'idle' | 'scanning' | 'processing' | 'success' | 'error' | 'already'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

export default function CheckInPage() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [result, setResult] = useState<any>(null)
  const [message, setMessage] = useState('')
  const [camError, setCamError] = useState('')
  const streamRef = useRef<MediaStream | null>(null)
  const detectorRef = useRef<any>(null)
  const rafRef = useRef<any>(null)

  const stopCamera = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) videoRef.current.srcObject = null
  }

  const handleQRData = async (data: string) => {
    stopCamera()
    setStatus('processing')
    try {
      const parsed = JSON.parse(data)
      if (!parsed.studentId) throw new Error('Invalid QR code')
      const res = await fetch(`${API}/attendance/qr-checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrData: data })
      })
      const json = await res.json()
      if (json.success) {
        setResult(json.student)
        setStatus('success')
      } else {
        setMessage(json.message || 'Check-in failed')
        setStatus('error')
      }
    } catch (err: any) {
      if (err.message?.includes('already') || err.message?.includes('Already')) {
        setMessage('Already checked in today!')
        setStatus('already')
      } else {
        setMessage(err.message || 'Invalid QR code')
        setStatus('error')
      }
    }
  }

  const startCamera = async () => {
    setCamError('')
    setStatus('scanning')

    try {
      // Request camera — prefer back camera on phones
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      })
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      // Try native BarcodeDetector first (Android Chrome 83+, Samsung Browser)
      // @ts-ignore
      if ('BarcodeDetector' in window) {
        // @ts-ignore
        detectorRef.current = new BarcodeDetector({ formats: ['qr_code'] })
        scanWithBarcodeDetector()
      } else {
        // Fallback: load jsQR from CDN
        await loadJsQR()
        scanWithJsQR()
      }
    } catch (err: any) {
      setStatus('idle')
      if (err.name === 'NotAllowedError') {
        setCamError('Camera permission denied. Please allow camera access in your browser settings and try again.')
      } else if (err.name === 'NotFoundError') {
        setCamError('No camera found on this device.')
      } else {
        setCamError(`Camera error: ${err.message}. Try using Chrome browser.`)
      }
    }
  }

  const scanWithBarcodeDetector = () => {
    const detect = async () => {
      if (!videoRef.current || !detectorRef.current) return
      if (videoRef.current.readyState < 2) {
        rafRef.current = requestAnimationFrame(detect)
        return
      }
      try {
        const codes = await detectorRef.current.detect(videoRef.current)
        if (codes.length > 0) {
          handleQRData(codes[0].rawValue)
          return
        }
      } catch {}
      rafRef.current = requestAnimationFrame(detect)
    }
    rafRef.current = requestAnimationFrame(detect)
  }

  const loadJsQR = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      // @ts-ignore
      if (window.jsQR) { resolve(); return }
      const script = document.createElement('script')
      script.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js'
      script.onload = () => resolve()
      script.onerror = () => reject(new Error('Failed to load QR scanner'))
      document.head.appendChild(script)
    })
  }

  const scanWithJsQR = () => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const scan = () => {
      if (!videoRef.current || !ctx) return
      if (videoRef.current.readyState < 2) {
        rafRef.current = requestAnimationFrame(scan)
        return
      }
      canvas.width = videoRef.current.videoWidth
      canvas.height = videoRef.current.videoHeight
      ctx.drawImage(videoRef.current, 0, 0)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      // @ts-ignore
      const code = window.jsQR?.(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' })
      if (code?.data) {
        handleQRData(code.data)
        return
      }
      rafRef.current = requestAnimationFrame(scan)
    }
    rafRef.current = requestAnimationFrame(scan)
  }

  const reset = () => {
    stopCamera()
    setStatus('idle')
    setResult(null)
    setMessage('')
    setCamError('')
  }

  useEffect(() => () => stopCamera(), [])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'var(--bg-primary)' }}>

      {/* Glow */}
      <div className="absolute top-0 right-0 w-72 h-72 rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(255,125,15,0.5) 0%, transparent 70%)' }} />
      <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(45,122,79,0.5) 0%, transparent 70%)' }} />

      <div className="w-full max-w-sm relative z-10">
        {/* Header */}
        <div className="text-center mb-6 animate-in">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-3 shadow-lg"
            style={{ background: 'linear-gradient(135deg, var(--saffron), #c74608)' }}>
            <BookOpen size={24} color="white" />
          </div>
          <h1 className="text-2xl font-display font-bold" style={{ color: 'var(--text-primary)' }}>
            Attendance Check-In
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Scan student QR code to mark attendance
          </p>
        </div>

        {/* IDLE */}
        {status === 'idle' && (
          <div className="card p-6 text-center animate-in">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: 'var(--saffron-light)' }}>
              <Camera size={28} style={{ color: 'var(--saffron)' }} />
            </div>
            <p className="text-sm mb-2 font-medium" style={{ color: 'var(--text-primary)' }}>
              Ready to scan
            </p>
            <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>
              Point camera at the student's QR code to mark them present
            </p>

            {camError && (
              <div className="flex items-start gap-2 p-3 rounded-lg mb-4 text-left"
                style={{ background: 'var(--red-light)' }}>
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--red)' }} />
                <p className="text-xs" style={{ color: 'var(--red)' }}>{camError}</p>
              </div>
            )}

            <button onClick={startCamera} className="btn-primary w-full justify-center py-3 text-base">
              <Camera size={18} /> Open Camera
            </button>

            <div className="mt-4 p-3 rounded-lg text-xs" style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>
              💡 Use <strong>Chrome browser</strong> on Android for best results
            </div>
          </div>
        )}

        {/* SCANNING */}
        {status === 'scanning' && (
          <div className="card overflow-hidden animate-in">
            <div className="relative bg-black" style={{ aspectRatio: '4/3' }}>
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
                autoPlay
              />
              {/* Scanner overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {/* Dark corners */}
                <div className="absolute inset-0"
                  style={{ background: 'radial-gradient(ellipse 55% 55% at 50% 50%, transparent 60%, rgba(0,0,0,0.6) 100%)' }} />
                {/* Scan box */}
                <div className="relative w-52 h-52">
                  {/* 4 corner brackets */}
                  <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 rounded-tl-lg" style={{ borderColor: 'var(--saffron)' }} />
                  <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 rounded-tr-lg" style={{ borderColor: 'var(--saffron)' }} />
                  <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 rounded-bl-lg" style={{ borderColor: 'var(--saffron)' }} />
                  <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 rounded-br-lg" style={{ borderColor: 'var(--saffron)' }} />
                  {/* Scanning line */}
                  <div className="absolute left-2 right-2 h-0.5 rounded-full"
                    style={{ background: 'var(--saffron)', animation: 'scanLine 2s ease-in-out infinite', top: '10%' }} />
                </div>
              </div>
            </div>
            <div className="p-4 text-center">
              <p className="text-sm font-medium" style={{ color: 'var(--saffron)' }}>
                📷 Scanning... Hold QR code steady
              </p>
              <button onClick={reset} className="btn-secondary text-xs mt-3 mx-auto px-6">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* PROCESSING */}
        {status === 'processing' && (
          <div className="card p-8 text-center animate-in">
            <div className="w-12 h-12 rounded-full border-3 border-t-transparent animate-spin mx-auto mb-4"
              style={{ borderColor: 'var(--saffron)', borderTopColor: 'transparent', borderWidth: 3 }} />
            <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Marking attendance...</p>
          </div>
        )}

        {/* SUCCESS */}
        {status === 'success' && result && (
          <div className="card p-6 text-center animate-in">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: 'var(--green-light)' }}>
              <CheckCircle2 size={40} style={{ color: 'var(--green)' }} />
            </div>
            <h2 className="text-2xl font-display font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
              Welcome! 👋
            </h2>
            <p className="text-lg font-semibold mb-4" style={{ color: 'var(--green)' }}>{result.name}</p>

            <div className="rounded-xl p-4 mb-5 space-y-2.5 text-left"
              style={{ background: 'var(--green-light)' }}>
              {[
                { label: '🪑 Seat', value: `#${result.seatNumber || 'N/A'}` },
                { label: '⏰ Shift', value: result.shift },
                { label: '🕐 Time', value: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) },
                { label: '📅 Date', value: new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center">
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{label}</span>
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{value}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-center gap-2 mb-5 py-2 px-4 rounded-full text-sm font-medium"
              style={{ background: 'var(--green)', color: 'white' }}>
              <CheckCircle2 size={16} /> Attendance Marked ✓
            </div>

            <button onClick={reset} className="btn-primary w-full justify-center py-3">
              <Camera size={16} /> Scan Next Student
            </button>
          </div>
        )}

        {/* ALREADY */}
        {status === 'already' && (
          <div className="card p-6 text-center animate-in">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: 'var(--amber-light)' }}>
              <CheckCircle2 size={32} style={{ color: 'var(--amber)' }} />
            </div>
            <h2 className="text-xl font-display font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              Already Checked In
            </h2>
            <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>
              This student has already marked attendance today
            </p>
            <button onClick={reset} className="btn-primary w-full justify-center">
              <Camera size={16} /> Scan Another
            </button>
          </div>
        )}

        {/* ERROR */}
        {status === 'error' && (
          <div className="card p-6 text-center animate-in">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: 'var(--red-light)' }}>
              <XCircle size={32} style={{ color: 'var(--red)' }} />
            </div>
            <h2 className="text-xl font-display font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
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

      <style>{`
        @keyframes scanLine {
          0% { top: 10%; opacity: 1; }
          50% { top: 85%; opacity: 0.8; }
          100% { top: 10%; opacity: 1; }
        }
      `}</style>
    </div>
  )
}

'use client'
import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpen, Eye, EyeOff, Lock, Mail } from 'lucide-react'
import toast from 'react-hot-toast'
import { AuthProvider, useAuth } from '@/lib/auth'

function LoginForm() {
  const [email, setEmail] = useState('admin@library.com')
  const [password, setPassword] = useState('admin123')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(email, password)
      toast.success('Welcome back!')
      router.push('/dashboard')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: 'var(--bg-primary)' }}>
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-30 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(255,125,15,0.4) 0%, transparent 70%)' }} />
      <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(45,122,79,0.4) 0%, transparent 70%)' }} />
      <div className="absolute inset-0 opacity-20 pointer-events-none"
        style={{ backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />

      <div className="w-full max-w-sm mx-auto px-4 relative z-10 animate-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-lg"
            style={{ background: 'linear-gradient(135deg, var(--saffron), #c74608)' }}>
            <BookOpen size={28} color="white" />
          </div>
          <h1 className="text-3xl font-display font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
            Smart Study
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Abhyasika Library Management</p>
        </div>

        <div className="card p-7">
          <h2 className="font-display text-xl font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>Admin Login</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  className="input" style={{paddingLeft: "2.25rem"}} placeholder="admin@library.com" required />
              </div>
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  className="input" style={{paddingLeft: "2.25rem", paddingRight: "2.25rem"}} placeholder="••••••••" required />
                <button type="button" onClick={() => setShowPw(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="btn-primary w-full justify-center py-3 mt-2 disabled:opacity-50">
              {loading ? 'Signing in...' : 'Sign In →'}
            </button>
          </form>
          <p className="text-center text-xs mt-4" style={{ color: 'var(--text-muted)' }}>
            Default: admin@library.com / admin123
          </p>
        </div>
        <p className="text-center text-xs mt-6" style={{ color: 'var(--text-muted)' }}>
          📚 Abhyasika — Empowering every student
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return <AuthProvider><LoginForm /></AuthProvider>
}

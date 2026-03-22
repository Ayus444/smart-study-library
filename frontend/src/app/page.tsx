'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Cookies from 'js-cookie'

export default function Home() {
  const router = useRouter()
  useEffect(() => {
    const token = Cookies.get('token')
    if (token) router.replace('/dashboard')
    else router.replace('/login')
  }, [router])
  return (
    <div className="min-h-screen flex items-center justify-center" style={{background:'var(--bg-primary)'}}>
      <div className="animate-pulse-soft text-2xl font-display" style={{color:'var(--saffron)'}}>
        📚 Loading...
      </div>
    </div>
  )
}

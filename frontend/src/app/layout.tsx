import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: 'Smart Study Library | Abhyasika',
  description: 'Complete management system for Indian study libraries',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#2d7a4f', secondary: '#fff' } },
            error: { iconTheme: { primary: '#c0392b', secondary: '#fff' } },
          }}
        />
      </body>
    </html>
  )
}

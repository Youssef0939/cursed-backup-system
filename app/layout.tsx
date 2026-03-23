import type { Metadata } from 'next'
import './globals.css'
import { Navbar } from '@/components/layout/Navbar'
import { StatusBar } from '@/components/layout/StatusBar'
import { ToastProvider } from '@/components/ui/ToastProvider'

export const metadata: Metadata = {
  title: 'SummonFighter — Get Help Now',
  description: 'Real fighters. Real skill. One click and a fighter shows up.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>
          <StatusBar />
          <Navbar />
          <main style={{ position: 'relative', zIndex: 2 }}>
            {children}
          </main>
        </ToastProvider>
      </body>
    </html>
  )
}

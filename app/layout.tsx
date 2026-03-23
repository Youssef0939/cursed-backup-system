import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'
import { Navbar } from '@/components/layout/Navbar'
import { StatusBar } from '@/components/layout/StatusBar'

export const metadata: Metadata = {
  title: 'SummonFighter — Get Help Now',
  description: 'Real fighters. Real skill. One click and a fighter shows up.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <StatusBar />
          <Navbar />
          <main style={{ position: 'relative', zIndex: 2 }}>{children}</main>
        </Providers>
      </body>
    </html>
  )
}

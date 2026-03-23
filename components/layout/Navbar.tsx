'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useUser } from '@/hooks/useUser'
import { calcRank, getAvgRating } from '@/types'

const TABS = [
  { label: 'Home',     href: '/' },
  { label: 'Fighters', href: '/fighters' },
  { label: 'Profile',  href: '/profile' },
  { label: 'Settings', href: '/settings' },
]

export function Navbar() {
  const pathname = usePathname()
  const router   = useRouter()
  const { profile, signOut } = useUser()

  const rank = profile ? calcRank(profile.wins, getAvgRating(profile)) : null

  const handleLogout = async () => {
    await signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <nav className="z2" style={{
      borderBottom: '1px solid var(--border)',
      background: 'rgba(5,3,8,.97)',
      backdropFilter: 'blur(20px)',
      position: 'sticky', top: 0, zIndex: 200,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center',
        maxWidth: 1100, margin: '0 auto', padding: '0 24px',
      }}>
        {/* LOGO */}
        <Link href="/" style={{ textDecoration: 'none' }}>
          <div style={{
            fontFamily: "'Bebas Neue', cursive", fontSize: 22,
            letterSpacing: 4, color: 'white', padding: '13px 0',
            marginRight: 32, whiteSpace: 'nowrap',
          }}>
            SUMMON<span style={{ color: 'var(--cg)' }}>/</span>FIGHTER
          </div>
        </Link>

        {/* TABS */}
        <div style={{ display: 'flex', flex: 1 }}>
          {TABS.map(tab => {
            const active = pathname === tab.href || (tab.href !== '/' && pathname.startsWith(tab.href))
            return (
              <Link key={tab.href} href={tab.href} style={{ textDecoration: 'none' }}>
                <div style={{
                  padding: '14px 16px', fontSize: 11, fontWeight: 700,
                  letterSpacing: 2, textTransform: 'uppercase',
                  color: active ? 'var(--cg)' : 'var(--muted)',
                  borderBottom: active ? '2px solid var(--cg)' : '2px solid transparent',
                  transition: 'all .2s', whiteSpace: 'nowrap',
                  fontFamily: "'Rajdhani', sans-serif",
                }}>
                  {tab.label}
                </div>
              </Link>
            )
          })}
        </div>

        {/* RIGHT */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto' }}>
          {profile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="pulse-dot green" />
              <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 12, color: 'var(--green)' }}>
                {profile.username}
              </span>
              {rank && (
                <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: 1 }}>
                  {rank.label}
                </span>
              )}
            </div>
          )}

          {profile ? (
            <button className="btn-ghost" onClick={handleLogout}>Logout</button>
          ) : (
            <Link href="/auth">
              <button className="btn-ghost">Login</button>
            </Link>
          )}

          <Link href="/dashboard">
            <button className="btn-ghost gold">👑 Owner</button>
          </Link>
        </div>
      </div>
    </nav>
  )
}

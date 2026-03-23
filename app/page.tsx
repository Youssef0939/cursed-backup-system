'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { FighterCard } from '@/components/fighters/FighterCard'
import { RequestModal } from '@/components/requests/RequestModal'
import { timeAgo, getAvgRating, getWinRate } from '@/types'
import type { UserRow, RequestRow } from '@/types'

export default function HomePage() {
  const router = useRouter()
  const [fighters, setFighters]   = useState<UserRow[]>([])
  const [reqs, setReqs]           = useState<RequestRow[]>([])
  const [stats, setStats]         = useState({ fighters: 0, battles: 0, winrate: 0, rating: '—' })
  const [showReq, setShowReq]     = useState(false)
  const [loading, setLoading]     = useState(true)

  const load = useCallback(async () => {
    const [{ data: users }, { data: requests }] = await Promise.all([
      supabase.from('users').select('*'),
      supabase.from('requests').select('*').order('created_at', { ascending: false }).limit(60),
    ])

    const u = users as UserRow[] || []
    const r = requests as RequestRow[] || []

    setFighters(u.filter(x => x.is_online).slice(0, 3))
    setReqs(r.slice(0, 5))

    const done = r.filter(x => x.status === 'done').length
    const avgWR = u.length ? Math.round(u.map(x => getWinRate(x)).reduce((a, b) => a + b, 0) / u.length) : 0
    const rated = u.filter(x => x.rating_count > 0)
    const avgR = rated.length ? (rated.reduce((a, x) => a + getAvgRating(x), 0) / rated.length).toFixed(1) : '—'

    setStats({ fighters: u.length, battles: done, winrate: avgWR, rating: avgR })
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
    const ch = supabase.channel('home')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'requests' }, load)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [load])

  const feedIcons: Record<string, string> = { pending: '🔴', accepted: '🟡', done: '🟢', ignored: '⚫' }
  const feedLabel: Record<string, string> = { pending: 'needs help', accepted: 'got a fighter', done: 'battle over', ignored: 'request ignored' }

  const handleSubmitted = (reqId: string) => {
    router.push(`/pending/${reqId}`)
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 80px' }}>

      {/* HERO */}
      <div style={{ padding: '68px 0 48px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 48, alignItems: 'start' }} className="hero-grid">

          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
              <div className="pulse-dot red" style={{ animation: 'gpulse 1.5s infinite' }} />
              <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 11, fontWeight: 700, letterSpacing: 3, color: 'var(--cg)' }}>
                {fighters.length} FIGHTERS READY NOW
              </span>
            </div>

            <h1 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 'clamp(52px, 8vw, 92px)', lineHeight: .92, letterSpacing: 3, marginBottom: 20 }}>
              <span style={{ display: 'block', color: 'var(--text)' }}>YOU'RE</span>
              <span style={{ display: 'block', color: 'var(--cg)', textShadow: '0 0 40px rgba(255,23,68,.4)' }}>LOSING.</span>
              <span style={{ display: 'block', color: 'var(--pg2)' }}>GET HELP NOW.</span>
            </h1>

            <div style={{
              background: 'rgba(255,23,68,.07)', border: '1px solid rgba(255,23,68,.22)',
              borderLeft: '3px solid var(--cg)', padding: '13px 18px', marginBottom: 28,
              fontFamily: "'Share Tech Mono', monospace", fontSize: 12, color: 'var(--cg)', lineHeight: 1.7,
            }}>
              ▶ GETTING DOMINATED? CALL A FIGHTER — THEY RESPOND IN UNDER 60 SECONDS.
            </div>

            <p style={{ fontSize: 17, color: 'var(--muted)', lineHeight: 1.7, maxWidth: 460, marginBottom: 32 }}>
              Real players. Real skill. <strong style={{ color: 'var(--text)' }}>One click and a fighter shows up.</strong> No waiting. No excuses.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <button className="btn-primary" onClick={() => setShowReq(true)}>⚡ CALL A FIGHTER</button>
              <button className="btn-secondary" onClick={() => router.push('/fighters')}>VIEW FIGHTERS</button>
            </div>
          </div>

          {/* LIVE PANEL */}
          <div className="card card-accent-top hide-mobile" style={{ padding: 20 }}>
            <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 16, letterSpacing: 3, color: 'var(--cg)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="pulse-dot green" />LIVE ACTIVITY
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
              {loading ? (
                <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 12, color: 'var(--dim)', textAlign: 'center', padding: 12 }}>Loading feed...</div>
              ) : reqs.length === 0 ? (
                <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 12, color: 'var(--dim)', textAlign: 'center', padding: 12 }}>No activity yet.</div>
              ) : reqs.map(r => (
                <div key={r.id} style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px',
                  background: 'var(--surface)', borderLeft: '2px solid var(--dim)',
                  fontSize: 11, fontFamily: "'Share Tech Mono', monospace", color: 'var(--muted)',
                }}>
                  <span>{feedIcons[r.status] || '⚡'}</span>
                  <span style={{ color: 'var(--text)', fontWeight: 700 }}>{r.requester_name}</span>
                  <span>{feedLabel[r.status] || r.status}</span>
                  <span style={{ marginLeft: 'auto', color: 'var(--dim)', fontSize: 10 }}>{timeAgo(r.created_at)}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { n: fighters.length, l: 'Online', c: 'var(--green)' },
                { n: stats.battles, l: 'Battles Done', c: 'var(--cg)' },
              ].map((s, i) => (
                <div key={i} style={{ background: 'var(--surface)', padding: 12, textAlign: 'center' }}>
                  <span style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 28, color: s.c, display: 'block', marginBottom: 2, letterSpacing: 2 }}>{s.n}</span>
                  <span style={{ fontSize: 9, color: 'var(--muted)', letterSpacing: 2, textTransform: 'uppercase' }}>{s.l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* STATS STRIP */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 1, background: 'var(--border)', border: '1px solid var(--border)', margin: '0 0 52px' }}>
        {[
          { n: stats.fighters, l: 'Total Fighters', c: 'var(--pg)', acc: 'var(--pg)' },
          { n: stats.battles,  l: 'Battles Done',   c: 'var(--cg)', acc: 'var(--cg)' },
          { n: `${stats.winrate}%`, l: 'AVG Win Rate', c: 'var(--gold)', acc: 'var(--gold)' },
          { n: stats.rating !== '—' ? `${stats.rating}★` : '—', l: 'AVG Rating', c: 'var(--green)', acc: 'var(--green)' },
        ].map((s, i) => (
          <div key={i} style={{ background: 'var(--surface)', padding: 20, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: s.acc }} />
            <span style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 34, display: 'block', marginBottom: 2, letterSpacing: 2, color: s.c }}>{s.n}</span>
            <span style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' }}>{s.l}</span>
          </div>
        ))}
      </div>

      {/* TOP FIGHTERS */}
      <div className="sec-hdr">
        <h2>FIGHTERS ONLINE</h2>
        <div className="sec-line" />
        <div className="sec-tag">AVAILABLE NOW</div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--dim)', fontFamily: "'Share Tech Mono', monospace" }}>
          <span className="spin">⚡</span> Scanning the network...
        </div>
      ) : fighters.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 52, color: 'var(--dim)', fontFamily: "'Share Tech Mono', monospace" }}>
          No fighters online right now. Check back soon.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 12 }}>
          {fighters.map(f => <FighterCard key={f.id} fighter={f} onCall={() => setShowReq(true)} />)}
        </div>
      )}

      <RequestModal open={showReq} onClose={() => setShowReq(false)} onSubmitted={handleSubmitted} />
    </div>
  )
}

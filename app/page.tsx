'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { RequestModal } from '@/components/requests/RequestModal'
import { calcRank, getAvgRating, getWinRate, timeAgo, FIGHT_ICONS, RANKS } from '@/types'
import type { UserRow, RequestRow } from '@/types'

export default function HomePage() {
  const router = useRouter()
  const [fighters, setFighters]     = useState<UserRow[]>([])
  const [feed, setFeed]             = useState<RequestRow[]>([])
  const [stats, setStats]           = useState({ total: 0, battles: 0, winrate: 0, rating: '—' })
  const [onlineCount, setOnline]    = useState(0)
  const [pendingCount, setPending]  = useState(0)
  const [showReq, setShowReq]       = useState(false)
  const [loading, setLoading]       = useState(true)

  const load = useCallback(async () => {
    const [{ data: u }, { data: r }] = await Promise.all([
      supabase.from('users').select('*').eq('role', 'fighter').eq('fighter_status', 'approved'),
      supabase.from('requests').select('*').order('created_at', { ascending: false }).limit(60),
    ])
    const users = (u as UserRow[]) || []
    const reqs  = (r as RequestRow[]) || []
    const online = users.filter(x => x.is_online)
    setFighters(online.slice(0, 3))
    setOnline(online.length)
    setPending(reqs.filter(x => x.status === 'pending').length)
    setFeed(reqs.slice(0, 6))

    const done = reqs.filter(x => x.status === 'done').length
    const avgWR = users.length ? Math.round(users.map(x => getWinRate(x)).reduce((a, b) => a + b, 0) / users.length) : 0
    const rated = users.filter(x => x.rating_count > 0)
    const avgR = rated.length ? (rated.reduce((a, x) => a + getAvgRating(x), 0) / rated.length).toFixed(1) : '—'
    setStats({ total: users.length, battles: done, winrate: avgWR, rating: avgR })
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
    const ch = supabase.channel('home-v2')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'requests' }, load)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [load])

  const feedIcon: Record<string, string> = { pending: '🔴', accepted: '🟡', in_progress: '🟢', done: '✅', ignored: '⚫' }
  const feedLabel: Record<string, string> = { pending: 'needs help', accepted: 'got a fighter', in_progress: 'in battle now', done: 'rescued', ignored: 'no response' }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 80px' }}>

      {/* HERO */}
      <div style={{ padding: '68px 0 48px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 48, alignItems: 'start' }}>
          <div>
            {/* Eyebrow */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
              <div className="pdot pdot-red" style={{ animation: 'gpulse 1.5s infinite' }} />
              <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 11, fontWeight: 700, letterSpacing: 3, color: 'var(--cg)' }}>
                {onlineCount > 0 ? `${onlineCount} ELITE FIGHTERS ON STANDBY` : 'FIGHTER NETWORK ACTIVE'}
              </span>
            </div>

            <h1 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 'clamp(52px, 8vw, 92px)', lineHeight: .92, letterSpacing: 3, marginBottom: 20 }}>
              <span style={{ display: 'block', color: 'var(--text)' }}>YOU'RE</span>
              <span style={{ display: 'block', color: 'var(--cg)', textShadow: '0 0 40px rgba(255,23,68,.4)' }}>LOSING.</span>
              <span style={{ display: 'block', color: 'var(--pg2)' }}>GET HELP NOW.</span>
            </h1>

            {/* Scarcity bar */}
            {onlineCount > 0 && onlineCount <= 5 && (
              <div style={{ background: 'rgba(251,191,36,.07)', border: '1px solid rgba(251,191,36,.25)', borderLeft: '3px solid var(--gold)', padding: '10px 16px', marginBottom: 16, fontFamily: "'Share Tech Mono', monospace", fontSize: 12, color: 'var(--gold)' }}>
                ⚠ Only {onlineCount} elite fighter{onlineCount > 1 ? 's' : ''} available right now. Don't wait.
              </div>
            )}

            <div className="urgency-bar" style={{ marginBottom: 28 }}>
              <span className="blink">▶</span> GETTING DOMINATED? CALL A FIGHTER — THEY RESPOND IN UNDER 60 SECONDS.
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
          <div className="card card-top-red hide-mobile" style={{ padding: 20 }}>
            <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 16, letterSpacing: 3, color: 'var(--cg)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="pdot pdot-green" /> LIVE ACTIVITY
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
              {loading ? (
                <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 12, color: 'var(--dim)', textAlign: 'center', padding: 12 }}>Loading feed...</div>
              ) : feed.length === 0 ? (
                <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 12, color: 'var(--dim)', textAlign: 'center', padding: 12 }}>No activity yet.</div>
              ) : feed.map(r => (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', background: 'var(--surface)', borderLeft: `2px solid ${r.status === 'done' ? 'var(--green)' : r.status === 'in_progress' ? 'var(--teal)' : 'var(--dim)'}`, fontSize: 11, fontFamily: "'Share Tech Mono', monospace", color: 'var(--muted)', transition: 'all .3s' }}>
                  <span>{feedIcon[r.status] || '⚡'}</span>
                  <span style={{ color: 'var(--text)', fontWeight: 700 }}>{r.requester_name}</span>
                  <span>{feedLabel[r.status] || r.status}</span>
                  <span style={{ marginLeft: 'auto', color: 'var(--dim)', fontSize: 10 }}>{timeAgo(r.created_at)}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { n: onlineCount,  l: 'Fighters Online', c: 'var(--green)' },
                { n: pendingCount, l: 'Need Help Now',   c: 'var(--cg)' },
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
          { n: stats.total, l: 'Total Fighters', c: 'var(--pg)', a: 'var(--pg)' },
          { n: stats.battles, l: 'Rescues Done', c: 'var(--cg)', a: 'var(--cg)' },
          { n: `${stats.winrate}%`, l: 'AVG Win Rate', c: 'var(--gold)', a: 'var(--gold)' },
          { n: stats.rating !== '—' ? `${stats.rating}★` : '—', l: 'AVG Rating', c: 'var(--green)', a: 'var(--green)' },
        ].map((s, i) => (
          <div key={i} style={{ background: 'var(--surface)', padding: 20, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: s.a }} />
            <span style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 34, display: 'block', marginBottom: 2, letterSpacing: 2, color: s.c }}>{s.n}</span>
            <span style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' }}>{s.l}</span>
          </div>
        ))}
      </div>

      {/* RANK LADDER */}
      <div className="sec-hdr"><h2>RANK SYSTEM</h2><div className="sec-line" /></div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 8, marginBottom: 52 }}>
        {RANKS.map((rk, i) => (
          <div key={rk.label} className="card hov-card" style={{ padding: '16px 12px', textAlign: 'center', borderTop: `2px solid ${rk.color}`, cursor: 'default' }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>
              {['🪖','⚔️','🧠','🔥','💀'][i]}
            </div>
            <div className={`rank-badge ${rk.cls}`} style={{ fontSize: 9 }}>{rk.label}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: "'Share Tech Mono', monospace", marginTop: 8, lineHeight: 1.5 }}>
              {rk.minWins}+ wins
            </div>
            <div style={{ fontSize: 10, color: 'var(--dim)', fontFamily: "'Share Tech Mono', monospace", marginTop: 4 }}>
              {rk.description}
            </div>
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
          <div style={{ fontSize: 32, marginBottom: 12 }}>😴</div>
          No fighters online right now. Check back soon.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 12 }}>
          {fighters.map(f => {
            const avg = getAvgRating(f); const wr = getWinRate(f); const rk = calcRank(f.wins, avg)
            return (
              <div key={f.id} className="card hov-card" style={{ borderTop: '2px solid transparent', padding: 20, cursor: 'pointer' }} onClick={() => setShowReq(true)}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
                  <div style={{ position: 'relative', width: 50, height: 50, background: 'var(--surface)', border: '2px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Bebas Neue', cursive", fontSize: 18, color: rk.color, clipPath: 'polygon(6px 0%,100% 0%,calc(100% - 6px) 100%,0% 100%)', flexShrink: 0 }}>
                    {f.username.substring(0, 2).toUpperCase()}
                    <div style={{ position: 'absolute', bottom: -3, right: -3, width: 10, height: 10, borderRadius: '50%', background: 'var(--green)', border: '2px solid var(--card)' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 19, letterSpacing: 2, color: 'var(--text)' }}>{f.username}</div>
                    <span className={`rank-badge ${rk.cls}`} style={{ marginTop: 4 }}>{rk.label}</span>
                    {f.roblox_username && (
                      <div style={{ fontSize: 10, color: 'var(--dim)', fontFamily: "'Share Tech Mono', monospace", marginTop: 3 }}>
                        🎮 {f.roblox_username}
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6, marginBottom: 12 }}>
                  {[
                    { n: f.wins, l: 'Wins', c: 'var(--pg)' },
                    { n: avg ? `${avg}★` : '—', l: 'Rating', c: 'var(--gold)' },
                    { n: `${wr}%`, l: 'Win Rate', c: 'var(--green)' },
                  ].map((s, i) => (
                    <div key={i} style={{ background: 'var(--surface)', padding: 8, textAlign: 'center' }}>
                      <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 14, fontWeight: 700, display: 'block', marginBottom: 1, color: s.c }}>{s.n}</span>
                      <span style={{ fontSize: 9, color: 'var(--muted)', letterSpacing: 1, textTransform: 'uppercase' }}>{s.l}</span>
                    </div>
                  ))}
                </div>
                <button className="btn-form" style={{ clipPath: 'none', fontSize: 14, padding: 10 }}>CALL THIS FIGHTER</button>
              </div>
            )
          })}
        </div>
      )}

      <RequestModal open={showReq} onClose={() => setShowReq(false)} />
    </div>
  )
}

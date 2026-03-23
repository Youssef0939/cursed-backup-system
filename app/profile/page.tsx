'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/hooks/useUser'
import { calcRank, getAvgRating, getWinRate, starsDisplay, timeAgo } from '@/types'
import type { RequestRow } from '@/types'

export default function ProfilePage() {
  const router = useRouter()
  const { profile, loading } = useUser()
  const [matches, setMatches] = useState<RequestRow[]>([])
  const [loadingMatches, setLoadingMatches] = useState(true)

  useEffect(() => {
    if (!profile) return
    const fetchMatches = async () => {
      const { data } = await supabase
        .from('requests').select('*')
        .or(`requester_id.eq.${profile.id},fighter_id.eq.${profile.id}`)
        .order('created_at', { ascending: false }).limit(10)
      setMatches((data as RequestRow[]) || [])
      setLoadingMatches(false)
    }
    fetchMatches()
  }, [profile])

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 80, color: 'var(--dim)', fontFamily: "'Share Tech Mono', monospace" }}>
      <span className="spin">⚡</span> Loading...
    </div>
  )

  if (!profile) return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>
      <div className="card" style={{ maxWidth: 520, margin: '60px auto', padding: '52px 36px', textAlign: 'center' }}>
        <span style={{ fontSize: 52, display: 'block', marginBottom: 20 }}>💀</span>
        <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 28, letterSpacing: 4, color: 'var(--muted)', marginBottom: 10 }}>NO IDENTITY</div>
        <div style={{ fontSize: 13, color: 'var(--muted)', fontFamily: "'Share Tech Mono', monospace" }}>Login to see your stats and history.</div>
        <button className="btn-form" style={{ marginTop: 24, clipPath: 'none', maxWidth: 240, marginLeft: 'auto', marginRight: 'auto', display: 'block' }} onClick={() => router.push('/auth')}>
          LOGIN NOW ⚡
        </button>
      </div>
    </div>
  )

  const avg = getAvgRating(profile)
  const wr  = getWinRate(profile)
  const rk  = calcRank(profile.wins, avg)

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 80px' }}>
      <div style={{ paddingTop: 32 }}>

        {/* PROFILE HERO */}
        <div className="card card-accent-top" style={{ padding: 28, display: 'flex', gap: 24, marginBottom: 16 }}>
          <div style={{
            width: 76, height: 76, background: 'var(--surface)', border: '2px solid var(--purple)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Bebas Neue', cursive", fontSize: 26, flexShrink: 0, color: 'var(--pg)',
            clipPath: 'polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)',
          }}>
            {profile.username.substring(0, 2).toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 28, letterSpacing: 3, color: 'var(--text)', marginBottom: 5 }}>
              {profile.username}
            </div>
            <span className={`rank-badge ${rk.cls}`}>{rk.label}</span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: 14 }}>
              {[
                { n: profile.wins,          l: 'Wins',     c: 'var(--pg)' },
                { n: profile.losses,        l: 'Losses',   c: 'var(--cg)' },
                { n: `${wr}%`,              l: 'Win Rate', c: 'var(--gold)' },
                { n: avg ? `${avg}★` : '—', l: 'AVG Rating', c: 'var(--gold)' },
              ].map((s, i) => (
                <div key={i} style={{ background: 'var(--surface)', padding: 12, textAlign: 'center' }}>
                  <span style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 26, display: 'block', marginBottom: 2, letterSpacing: 2, color: s.c }}>{s.n}</span>
                  <span style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: 2, textTransform: 'uppercase' }}>{s.l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* BATTLE HISTORY */}
        <div className="sec-hdr"><h2>BATTLE HISTORY</h2><div className="sec-line" /></div>
        <div className="card">
          {loadingMatches ? (
            <div style={{ textAlign: 'center', padding: 32, color: 'var(--dim)', fontFamily: "'Share Tech Mono', monospace" }}>
              <span className="spin">⚡</span> Loading history...
            </div>
          ) : matches.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 52, color: 'var(--dim)', fontFamily: "'Share Tech Mono', monospace" }}>
              📭 No battles yet. Start fighting.
            </div>
          ) : matches.map(m => {
            const isF = m.fighter_id === profile.id
            let res = '', cls = ''
            if (m.result) {
              const won = (m.result === 'win' && isF) || (m.result === 'loss' && !isF)
              res = won ? 'WIN' : 'LOSS'; cls = won ? 'mwin' : 'mlose'
            } else { res = m.status.toUpperCase(); cls = 'mpend' }

            return (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', borderBottom: '1px solid rgba(37,21,69,.4)' }}>
                <div className={`mres ${cls}`}>{res}</div>
                <div style={{ flex: 1, fontSize: 12, color: 'var(--muted)', fontFamily: "'Share Tech Mono', monospace" }}>
                  {isF ? `Helped: ${m.requester_name}` : `vs: ${m.fighter_name || 'Waiting'}`} · {m.fight_type} · {timeAgo(m.created_at)}
                </div>
                <div style={{ color: 'var(--gold)', fontSize: 12, whiteSpace: 'nowrap' }}>
                  {m.rating ? starsDisplay(m.rating) : ''}
                  {m.rating_comment && <span style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 6 }}>"{m.rating_comment}"</span>}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

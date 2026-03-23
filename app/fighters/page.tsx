'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { calcRank, getAvgRating, getWinRate } from '@/types'
import { RequestModal } from '@/components/requests/RequestModal'
import type { UserRow } from '@/types'

export default function FightersPage() {
  const router = useRouter()
  const [fighters, setFighters] = useState<UserRow[]>([])
  const [loading, setLoading]   = useState(true)
  const [showReq, setShowReq]   = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('users').select('*').eq('role', 'fighter').eq('fighter_status', 'approved').order('wins', { ascending: false })
      setFighters((data as UserRow[]) || []); setLoading(false)
    }
    load()
    const ch = supabase.channel('fighters-v2')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, load)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 80px' }}>
      <div style={{ paddingTop: 32 }}>
        <div className="sec-hdr">
          <h2>ALL FIGHTERS</h2>
          <div className="sec-line" />
          <button className="btn-primary" onClick={() => setShowReq(true)} style={{ fontSize: 14, padding: '10px 24px', clipPath: 'none' }}>⚡ CALL A FIGHTER</button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 48, color: 'var(--dim)', fontFamily: "'Share Tech Mono', monospace" }}>
            <span className="spin">⚡</span> Loading fighters...
          </div>
        ) : fighters.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 52, color: 'var(--dim)', fontFamily: "'Share Tech Mono', monospace" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⚔️</div>
            No approved fighters yet. Check back soon.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ minWidth: 700 }}>
              <thead>
                <tr><th>#</th><th>Fighter</th><th>Rank</th><th>Wins</th><th>Win Rate</th><th>Rating</th><th>Status</th><th></th></tr>
              </thead>
              <tbody>
                {fighters.map((f, i) => {
                  const avg = getAvgRating(f); const w = getWinRate(f); const rk = calcRank(f.wins, avg)
                  return (
                    <tr key={f.id}>
                      <td><span style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 22, color: i < 3 ? 'var(--gold)' : 'var(--dim)' }}>{i + 1}</span></td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 36, height: 36, background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Bebas Neue', cursive", fontSize: 14, color: rk.color, clipPath: 'polygon(5px 0%,100% 0%,calc(100% - 5px) 100%,0% 100%)' }}>
                            {f.username.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 17, letterSpacing: 1 }}>{f.username}</div>
                            <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: "'Share Tech Mono', monospace" }}>
                              {f.roblox_username ? `🎮 ${f.roblox_username}` : f.discord || '—'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td><span className={`rank-badge ${rk.cls}`}>{rk.label}</span></td>
                      <td style={{ fontFamily: "'Share Tech Mono', monospace", color: 'var(--pg)', fontWeight: 700 }}>{f.wins}</td>
                      <td>
                        <div style={{ width: 70, background: 'var(--surface)', height: 3, marginBottom: 3 }}>
                          <div style={{ height: '100%', background: 'linear-gradient(to right, var(--purple), var(--cg))', width: `${w}%` }} />
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: "'Share Tech Mono', monospace" }}>{w}%</div>
                      </td>
                      <td style={{ color: 'var(--gold)', fontFamily: "'Share Tech Mono', monospace" }}>{avg ? `${avg}★` : '—'}</td>
                      <td><span style={{ fontSize: 11, fontWeight: 700, color: f.is_online ? 'var(--green)' : 'var(--dim)' }}>{f.is_online ? '● ONLINE' : '○ OFFLINE'}</span></td>
                      <td>
                        <button disabled={!f.is_online} onClick={() => setShowReq(true)} style={{ padding: '6px 12px', fontFamily: "'Bebas Neue', cursive", fontSize: 11, letterSpacing: 2, cursor: f.is_online ? 'pointer' : 'not-allowed', border: `1px solid ${f.is_online ? 'var(--purple)' : 'var(--dim)'}`, color: f.is_online ? 'var(--pg)' : 'var(--dim)', background: 'transparent', transition: 'all .2s' }}>
                          CALL
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <RequestModal open={showReq} onClose={() => setShowReq(false)} />
    </div>
  )
}

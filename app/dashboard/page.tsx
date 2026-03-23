'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/hooks/useUser'
import { useToast } from '@/hooks/useToast'
import { timeAgo, starsDisplay } from '@/types'
import type { RequestRow } from '@/types'

const OWNER_CODE = process.env.NEXT_PUBLIC_OWNER_CODE || 'summon2025'

export default function DashboardPage() {
  const { profile } = useUser()
  const { showToast } = useToast()
  const [authed, setAuthed]     = useState(false)
  const [code, setCode]         = useState('')
  const [codeErr, setCodeErr]   = useState(false)
  const [requests, setRequests] = useState<RequestRow[]>([])
  const [loading, setLoading]   = useState(true)

  // Result modal state
  const [resultReqId, setResultReqId]         = useState<string | null>(null)
  const [resultFighterId, setResultFighterId]  = useState<string | null>(null)

  const loadRequests = useCallback(async () => {
    const { data } = await supabase.from('requests').select('*').order('created_at', { ascending: false })
    setRequests((data as RequestRow[]) || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!authed) return
    loadRequests()
    const ch = supabase.channel('dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'requests' }, loadRequests)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [authed, loadRequests])

  const tryLogin = () => {
    if (code === OWNER_CODE) { setAuthed(true); setCodeErr(false) }
    else setCodeErr(true)
  }

  const acceptReq = async (id: string) => {
    const name = profile?.username || 'Owner'
    const fid  = profile?.id || null
    await supabase.from('requests').update({
      status: 'accepted', fighter_id: fid, fighter_name: name,
      accepted_at: new Date().toISOString(),
    }).eq('id', id)
    showToast('✅ Accepted! User has been notified.')
    loadRequests()
  }

  const ignoreReq = async (id: string) => {
    await supabase.from('requests').update({ status: 'ignored' }).eq('id', id)
    loadRequests()
  }

  const recordResult = async (outcome: 'win' | 'loss') => {
    if (!resultReqId) return
    await supabase.from('requests').update({
      result: outcome, status: 'done', completed_at: new Date().toISOString(),
    }).eq('id', resultReqId)

    if (resultFighterId) {
      const { data: f } = await supabase.from('users').select('wins,losses').eq('id', resultFighterId).single()
      if (f) {
        await supabase.from('users').update({
          wins:   (f.wins   || 0) + (outcome === 'win'  ? 1 : 0),
          losses: (f.losses || 0) + (outcome === 'loss' ? 1 : 0),
        }).eq('id', resultFighterId)
      }
    }
    showToast('✅ Result saved!')
    setResultReqId(null); setResultFighterId(null)
    loadRequests()
  }

  // ── LOGIN SCREEN ──
  if (!authed) return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <div className="card card-accent-gold" style={{ width: '100%', maxWidth: 400, padding: '36px 28px' }}>
          <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 22, letterSpacing: 4, textAlign: 'center', color: 'var(--gold)', marginBottom: 6 }}>
            👑 COMMAND CENTER
          </div>
          <div style={{ fontSize: 12, color: 'var(--dim)', textAlign: 'center', fontFamily: "'Share Tech Mono', monospace", marginBottom: 22 }}>
            Owners only — secret code required
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
            <div>
              <label className="flabel">Secret Code</label>
              <input
                className="finput" type="password" value={code}
                onChange={e => setCode(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && tryLogin()}
                placeholder="••••••••"
              />
            </div>
            {codeErr && <div className="err-box">❌ Wrong code. Try again.</div>}
            <button className="btn-form" onClick={tryLogin}>ACCESS ⚡</button>
          </div>
        </div>
      </div>
    </div>
  )

  const active = requests.filter(r => r.status === 'pending').length

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 80px' }}>

      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '28px 0 20px', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 26, letterSpacing: 4, color: 'var(--gold)' }}>👑 COMMAND CENTER</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', fontFamily: "'Share Tech Mono', monospace", marginTop: 3 }}>
            {requests.length} total · {active} pending now
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-ghost green" onClick={loadRequests}>🔄 Refresh</button>
          <button className="btn-ghost" onClick={() => setAuthed(false)} style={{ borderColor: 'rgba(255,23,68,.3)', color: 'var(--cg)' }}>Exit</button>
        </div>
      </div>

      {/* REQUESTS */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--dim)', fontFamily: "'Share Tech Mono', monospace" }}>
          <span className="spin">⚡</span> Loading requests...
        </div>
      ) : requests.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--dim)', fontFamily: "'Share Tech Mono', monospace" }}>
          📭 No requests yet. Waiting for users...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {requests.map(r => (
            <div
              key={r.id}
              className="card"
              style={{
                borderLeft: `3px solid ${r.fight_type === 'Team Fight' ? 'var(--cg)' : 'var(--purple)'}`,
                padding: '16px 20px', display: 'flex', alignItems: 'flex-start', gap: 14,
                opacity: r.status === 'ignored' ? .3 : 1,
                transition: 'all .2s',
              }}
            >
              <div style={{
                width: 42, height: 42, background: 'var(--surface)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: "'Bebas Neue', cursive", fontSize: 16, flexShrink: 0,
                color: r.fight_type === 'Team Fight' ? 'var(--cg)' : 'var(--pg)',
                clipPath: 'polygon(5px 0%, 100% 0%, calc(100% - 5px) 100%, 0% 100%)',
              }}>
                {r.requester_name.substring(0, 2).toUpperCase()}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 17, letterSpacing: 2, color: 'var(--text)' }}>
                  {r.requester_name}
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)', fontFamily: "'Share Tech Mono', monospace", marginTop: 3, lineHeight: 1.6 }}>
                  <span className={`status-tag st-${r.status}`}>{r.status}</span>
                  &nbsp; {r.fight_type} &nbsp; ⏱ {timeAgo(r.created_at)}
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)', fontFamily: "'Share Tech Mono', monospace", marginTop: 4 }}>
                  {r.description}
                </div>
                {r.fighter_name && (
                  <div style={{ fontSize: 12, color: 'var(--pg)', fontFamily: "'Share Tech Mono', monospace" }}>
                    Fighter: {r.fighter_name}
                  </div>
                )}
                {r.rating && (
                  <div style={{ fontSize: 12, color: 'var(--gold)', fontFamily: "'Share Tech Mono', monospace" }}>
                    {starsDisplay(r.rating)} {r.rating_comment ? `"${r.rating_comment}"` : ''}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                {r.status === 'pending' ? (
                  <>
                    <button
                      onClick={() => acceptReq(r.id)}
                      style={{ padding: '7px 16px', fontFamily: "'Bebas Neue', cursive", fontSize: 13, letterSpacing: 2, cursor: 'pointer', border: '1px solid var(--purple)', color: 'var(--pg)', background: 'transparent', transition: 'all .2s', whiteSpace: 'nowrap' }}
                      onMouseEnter={e => { (e.target as HTMLButtonElement).style.background = 'var(--purple)'; (e.target as HTMLButtonElement).style.color = 'white' }}
                      onMouseLeave={e => { (e.target as HTMLButtonElement).style.background = 'transparent'; (e.target as HTMLButtonElement).style.color = 'var(--pg)' }}
                    >ACCEPT</button>
                    <button
                      onClick={() => ignoreReq(r.id)}
                      style={{ padding: '7px 16px', fontFamily: "'Bebas Neue', cursive", fontSize: 13, letterSpacing: 2, cursor: 'pointer', border: '1px solid var(--dim)', color: 'var(--dim)', background: 'transparent', transition: 'all .2s', whiteSpace: 'nowrap' }}
                      onMouseEnter={e => { (e.target as HTMLButtonElement).style.borderColor = 'var(--cg)'; (e.target as HTMLButtonElement).style.color = 'var(--cg)' }}
                      onMouseLeave={e => { (e.target as HTMLButtonElement).style.borderColor = 'var(--dim)'; (e.target as HTMLButtonElement).style.color = 'var(--dim)' }}
                    >IGNORE</button>
                  </>
                ) : r.status === 'accepted' ? (
                  <button
                    onClick={() => { setResultReqId(r.id); setResultFighterId(r.fighter_id) }}
                    style={{ padding: '7px 16px', fontFamily: "'Bebas Neue', cursive", fontSize: 13, letterSpacing: 2, cursor: 'pointer', border: '1px solid var(--gold)', color: 'var(--gold)', background: 'transparent', transition: 'all .2s', whiteSpace: 'nowrap' }}
                    onMouseEnter={e => { (e.target as HTMLButtonElement).style.background = 'var(--gold)'; (e.target as HTMLButtonElement).style.color = 'var(--void)' }}
                    onMouseLeave={e => { (e.target as HTMLButtonElement).style.background = 'transparent'; (e.target as HTMLButtonElement).style.color = 'var(--gold)' }}
                  >LOG RESULT</button>
                ) : (
                  <div style={{ fontSize: 11, color: 'var(--dim)', fontFamily: "'Share Tech Mono', monospace' "}}>{r.status.toUpperCase()}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* RESULT MODAL */}
      {resultReqId && (
        <div
          onClick={e => { if (e.target === e.currentTarget) { setResultReqId(null); setResultFighterId(null) } }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(5,3,8,.93)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
        >
          <div className="card card-accent-top" style={{ width: '100%', maxWidth: 380 }}>
            <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '15px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 17, letterSpacing: 3, color: 'var(--cg)' }}>📊 LOG RESULT</span>
              <button onClick={() => { setResultReqId(null); setResultFighterId(null) }} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: 15 }}>
              <div style={{ fontSize: 14, color: 'var(--muted)', fontFamily: "'Share Tech Mono', monospace", textAlign: 'center' }}>What happened in the battle?</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <button onClick={() => recordResult('win')} style={{ padding: 18, fontFamily: "'Bebas Neue', cursive", fontSize: 18, cursor: 'pointer', border: '1px solid var(--green)', color: 'var(--green)', background: 'transparent', transition: 'all .2s' }}>✅ WIN</button>
                <button onClick={() => recordResult('loss')} style={{ padding: 18, fontFamily: "'Bebas Neue', cursive", fontSize: 18, cursor: 'pointer', border: '1px solid var(--cg)', color: 'var(--cg)', background: 'transparent', transition: 'all .2s' }}>❌ LOSS</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

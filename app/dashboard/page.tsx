'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/hooks/useUser'
import { useToast } from '@/hooks/useToast'
import { timeAgo, starsDisplay, calcRank, getAvgRating } from '@/types'
import type { RequestRow, FighterApplication, UserRow } from '@/types'

const OWNER_CODE = process.env.NEXT_PUBLIC_OWNER_CODE || 'summon2025'
type Tab = 'requests' | 'applications' | 'fighters'

export default function DashboardPage() {
  const { profile } = useUser()
  const { showToast } = useToast()
  const [authed, setAuthed] = useState(false)
  const [code, setCode] = useState('')
  const [codeErr, setCE] = useState(false)
  const [tab, setTab] = useState<Tab>('requests')
  const [requests, setReqs] = useState<RequestRow[]>([])
  const [apps, setApps] = useState<FighterApplication[]>([])
  const [fighters, setFighters] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [resultId, setRID] = useState<string|null>(null)
  const [resultFid, setRFID] = useState<string|null>(null)

  const loadAll = useCallback(async () => {
    const [{ data: r }, { data: a }, { data: f }] = await Promise.all([
      supabase.from('requests').select('*').order('created_at', { ascending: false }),
      supabase.from('fighter_applications').select('*').order('created_at', { ascending: false }),
      supabase.from('users').select('*').eq('role', 'fighter').order('wins', { ascending: false }),
    ])
    setReqs((r as RequestRow[]) || [])
    setApps((a as FighterApplication[]) || [])
    setFighters((f as UserRow[]) || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!authed) return
    loadAll()
    const ch = supabase.channel('dash-v3')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'requests' }, loadAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fighter_applications' }, loadAll)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [authed, loadAll])

  const tryLogin = () => {
    if (code === OWNER_CODE) { setAuthed(true); setCE(false) } else setCE(true)
  }

  const acceptReq = async (id: string) => {
    const name = profile?.username || 'Owner'
    const fid  = profile?.id || null
    await supabase.from('requests').update({ status: 'accepted', fighter_id: fid, fighter_name: name, accepted_at: new Date().toISOString() }).eq('id', id)
    await supabase.from('chat_messages').insert({ request_id: id, sender_name: 'System', sender_role: 'system', content: `⚡ ${name} accepted your request. Coordinate in the chat!` })
    showToast('✅ Accepted! Chat opened.'); loadAll()
  }

  const ignoreReq  = async (id: string) => { await supabase.from('requests').update({ status: 'ignored' }).eq('id', id); loadAll() }
  const setInBattle = async (id: string) => { await supabase.from('requests').update({ status: 'in_progress' }).eq('id', id); loadAll() }

  const recordResult = async (outcome: 'win' | 'loss') => {
    if (!resultId) return
    await supabase.from('requests').update({ result: outcome, status: 'done', completed_at: new Date().toISOString() }).eq('id', resultId)
    if (resultFid) {
      const { data: f } = await supabase.from('users').select('wins,losses').eq('id', resultFid).single()
      if (f) await supabase.from('users').update({ wins: (f.wins||0)+(outcome==='win'?1:0), losses: (f.losses||0)+(outcome==='loss'?1:0) }).eq('id', resultFid)
    }
    setRID(null); setRFID(null); showToast('✅ Result saved!'); loadAll()
  }

  const approveApp = async (app: FighterApplication) => {
    await supabase.from('fighter_applications').update({ status: 'approved' }).eq('id', app.id)
    await supabase.from('users').update({ role: 'fighter', fighter_status: 'approved' }).eq('id', app.user_id)
    showToast(`✅ ${app.username} is now a fighter!`); loadAll()
  }

  const rejectApp = async (app: FighterApplication) => {
    await supabase.from('fighter_applications').update({ status: 'rejected' }).eq('id', app.id)
    await supabase.from('users').update({ fighter_status: 'rejected' }).eq('id', app.user_id)
    showToast(`❌ ${app.username} rejected.`); loadAll()
  }

  const removeFighter = async (id: string) => {
    await supabase.from('users').update({ role: 'client', fighter_status: null }).eq('id', id)
    showToast('Fighter removed.'); loadAll()
  }

  if (!authed) return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <div className="card card-top-gold fade-in" style={{ width: '100%', maxWidth: 400, padding: '36px 28px' }}>
          <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 22, letterSpacing: 4, textAlign: 'center', color: 'var(--gold)', marginBottom: 6 }}>👑 COMMAND CENTER</div>
          <div style={{ fontSize: 12, color: 'var(--dim)', textAlign: 'center', fontFamily: "'Share Tech Mono', monospace", marginBottom: 22 }}>Owners only</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
            <div><label className="flabel">Secret Code</label><input className="finput" type="password" value={code} onChange={e => setCode(e.target.value)} onKeyDown={e => e.key === 'Enter' && tryLogin()} placeholder="••••••••" /></div>
            {codeErr && <div className="err-box">❌ Wrong code.</div>}
            <button className="btn-form" onClick={tryLogin}>ACCESS ⚡</button>
          </div>
        </div>
      </div>
    </div>
  )

  const pending = requests.filter(r => r.status === 'pending').length
  const pendingApps = apps.filter(a => a.status === 'pending').length

  const TB = ({ t, label, count }: { t: Tab; label: string; count?: number }) => (
    <button onClick={() => setTab(t)} style={{ padding: '10px 20px', fontFamily: "'Bebas Neue', cursive", fontSize: 15, letterSpacing: 2, cursor: 'pointer', background: tab === t ? 'rgba(255,23,68,.1)' : 'var(--surface)', border: `1px solid ${tab === t ? 'var(--cg)' : 'var(--border)'}`, color: tab === t ? 'var(--cg)' : 'var(--muted)', transition: 'all .2s' }}>
      {label}{count ? <span style={{ background: 'var(--cg)', color: 'white', fontSize: 10, borderRadius: 9, padding: '1px 6px', marginLeft: 6 }}>{count}</span> : null}
    </button>
  )

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 80px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '28px 0 20px', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 26, letterSpacing: 4, color: 'var(--gold)' }}>👑 COMMAND CENTER</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', fontFamily: "'Share Tech Mono', monospace", marginTop: 3 }}>
            {requests.length} total · {pending} pending · {pendingApps} applications
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-ghost green" onClick={loadAll}>🔄 Refresh</button>
          <button className="btn-ghost" onClick={() => setAuthed(false)} style={{ borderColor: 'rgba(255,23,68,.3)', color: 'var(--cg)' }}>Exit</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <TB t="requests" label="REQUESTS" count={pending} />
        <TB t="applications" label="APPLICATIONS" count={pendingApps} />
        <TB t="fighters" label="FIGHTERS" />
      </div>

      {loading && <div style={{ textAlign: 'center', padding: 48, color: 'var(--dim)', fontFamily: "'Share Tech Mono', monospace" }}><span className="spin">⚡</span></div>}

      {/* REQUESTS */}
      {!loading && tab === 'requests' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {requests.length === 0
            ? <div style={{ textAlign: 'center', padding: 60, color: 'var(--dim)', fontFamily: "'Share Tech Mono', monospace" }}>📭 No requests yet.</div>
            : requests.map(r => (
            <div key={r.id} className="card" style={{ borderLeft: `3px solid ${r.status==='in_progress'?'var(--teal)':r.status==='done'?'var(--green)':r.status==='accepted'?'var(--blue)':'var(--purple)'}`, padding: '16px 20px', display: 'flex', alignItems: 'flex-start', gap: 14, opacity: r.status==='ignored'?.3:1, transition:'all .2s' }}>
              <div style={{ width: 42, height: 42, background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Bebas Neue', cursive", fontSize: 16, flexShrink: 0, color: 'var(--pg)', clipPath: 'polygon(5px 0%,100% 0%,calc(100% - 5px) 100%,0% 100%)' }}>
                {r.requester_name.substring(0,2).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 17, letterSpacing: 2 }}>{r.requester_name}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', fontFamily: "'Share Tech Mono', monospace", marginTop: 3, lineHeight: 1.6 }}>
                  <span className={`status-tag st-${r.status}`}>{r.status.replace('_',' ')}</span>
                  &nbsp; {r.fight_type}
                  {r.roblox_username && <span style={{ color: 'var(--teal)', marginLeft: 8 }}>🎮 {r.roblox_username}</span>}
                  &nbsp; ⏱ {timeAgo(r.created_at)}
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)', fontFamily: "'Share Tech Mono', monospace", marginTop: 4 }}>{r.description}</div>
                {r.fighter_name && <div style={{ fontSize: 12, color: 'var(--pg)' }}>Fighter: {r.fighter_name}</div>}
                {r.rating && <div style={{ fontSize: 12, color: 'var(--gold)' }}>{starsDisplay(r.rating)} {r.rating_comment ? `"${r.rating_comment}"` : ''}</div>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flexShrink: 0 }}>
                {r.status === 'pending' ? <>
                  <button className="btn-ghost teal" style={{ fontSize: 11, padding: '6px 14px' }} onClick={() => acceptReq(r.id)}>ACCEPT</button>
                  <button className="btn-ghost" style={{ fontSize: 11, padding: '6px 14px' }} onClick={() => ignoreReq(r.id)}>IGNORE</button>
                </> : r.status === 'accepted' ? <>
                  <button className="btn-ghost teal" style={{ fontSize: 11, padding: '6px 14px' }} onClick={() => setInBattle(r.id)}>IN BATTLE</button>
                  <button className="btn-ghost gold" style={{ fontSize: 11, padding: '6px 14px' }} onClick={() => { setRID(r.id); setRFID(r.fighter_id) }}>LOG RESULT</button>
                </> : r.status === 'in_progress' ? (
                  <button className="btn-ghost gold" style={{ fontSize: 11, padding: '6px 14px' }} onClick={() => { setRID(r.id); setRFID(r.fighter_id) }}>LOG RESULT</button>
                ) : (
                  <div style={{ fontSize: 11, color: 'var(--dim)', fontFamily: "'Share Tech Mono', monospace" }}>{r.status.toUpperCase()}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* APPLICATIONS */}
      {!loading && tab === 'applications' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {apps.length === 0
            ? <div style={{ textAlign: 'center', padding: 60, color: 'var(--dim)', fontFamily: "'Share Tech Mono', monospace" }}>📭 No applications yet.</div>
            : apps.map(app => (
            <div key={app.id} className="card" style={{ borderLeft: `3px solid ${app.status==='approved'?'var(--green)':app.status==='rejected'?'var(--cg)':'var(--gold)'}`, padding: '16px 20px', display: 'flex', alignItems: 'flex-start', gap: 14, opacity: app.status!=='pending'?.6:1 }}>
              <div style={{ width: 42, height: 42, background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Bebas Neue', cursive", fontSize: 16, flexShrink: 0, color: 'var(--gold)', clipPath: 'polygon(5px 0%,100% 0%,calc(100% - 5px) 100%,0% 100%)' }}>
                {app.username.substring(0,2).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 17, letterSpacing: 2 }}>{app.username}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', fontFamily: "'Share Tech Mono', monospace", marginTop: 3 }}>
                  <span className={`status-tag st-${app.status==='approved'?'accepted':app.status==='rejected'?'ignored':'pending'}`}>{app.status}</span>
                  {app.roblox_username && <span style={{ marginLeft: 8, color: 'var(--teal)' }}>🎮 {app.roblox_username}</span>}
                  &nbsp; ⏱ {timeAgo(app.created_at)}
                </div>
                <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 6, lineHeight: 1.5 }}>{app.reason}</div>
              </div>
              {app.status === 'pending' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flexShrink: 0 }}>
                  <button className="btn-ghost green" style={{ fontSize: 11, padding: '6px 14px' }} onClick={() => approveApp(app)}>APPROVE</button>
                  <button className="btn-ghost" style={{ fontSize: 11, padding: '6px 14px', borderColor: 'rgba(255,23,68,.3)', color: 'var(--cg)' }} onClick={() => rejectApp(app)}>REJECT</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* FIGHTERS */}
      {!loading && tab === 'fighters' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {fighters.length === 0
            ? <div style={{ textAlign: 'center', padding: 60, color: 'var(--dim)', fontFamily: "'Share Tech Mono', monospace" }}>No fighters yet.</div>
            : fighters.map(f => {
            const avg = getAvgRating(f); const rk = calcRank(f.wins, avg)
            return (
              <div key={f.id} className="card" style={{ borderLeft: `3px solid ${rk.color}`, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 40, height: 40, background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Bebas Neue', cursive", fontSize: 16, color: rk.color, clipPath: 'polygon(5px 0%,100% 0%,calc(100% - 5px) 100%,0% 100%)', flexShrink: 0 }}>
                  {f.username.substring(0,2).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 17, letterSpacing: 2 }}>{f.username}</div>
                    <span className={`rank-badge ${rk.cls}`}>{rk.label}</span>
                    <span style={{ fontSize: 11, color: f.is_online ? 'var(--green)' : 'var(--dim)', fontFamily: "'Share Tech Mono', monospace" }}>{f.is_online ? '● ONLINE' : '○ OFFLINE'}</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: "'Share Tech Mono', monospace", marginTop: 3 }}>
                    Wins: {f.wins} · Rating: {avg ? `${avg}★` : '—'} {f.roblox_username ? `· 🎮 ${f.roblox_username}` : ''} {f.discord ? `· 💬 ${f.discord}` : ''}
                  </div>
                </div>
                <button className="btn-ghost" style={{ fontSize: 11, borderColor: 'rgba(255,23,68,.3)', color: 'var(--cg)' }} onClick={() => removeFighter(f.id)}>REMOVE</button>
              </div>
            )
          })}
        </div>
      )}

      {/* RESULT MODAL */}
      {resultId && (
        <div onClick={e => { if (e.target===e.currentTarget) { setRID(null); setRFID(null) } }} style={{ position: 'fixed', inset: 0, background: 'rgba(5,3,8,.93)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div className="card card-top-red fade-in" style={{ width: '100%', maxWidth: 380 }}>
            <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '15px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 17, letterSpacing: 3, color: 'var(--cg)' }}>📊 LOG RESULT</span>
              <button onClick={() => { setRID(null); setRFID(null) }} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ fontSize: 14, color: 'var(--muted)', fontFamily: "'Share Tech Mono', monospace", textAlign: 'center' }}>What was the outcome?</div>
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

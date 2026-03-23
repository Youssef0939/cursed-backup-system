'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ChatBox } from '@/components/chat/ChatBox'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/hooks/useToast'
import type { RequestRow } from '@/types'

export default function PendingPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { showToast } = useToast()
  const reqId = params.id
  const [req, setReq]           = useState<RequestRow | null>(null)
  const [steps, setSteps]       = useState([false, false, false])
  const [showRate, setShowRate] = useState(false)
  const [stars, setStars]       = useState(0)
  const [comment, setComment]   = useState('')
  const [ratingDone, setRatingDone] = useState(false)
  const pollRef = useRef<NodeJS.Timeout>()
  const subRef  = useRef<any>()

  useEffect(() => {
    const timers = [
      setTimeout(() => setSteps([true, false, false]), 1800),
      setTimeout(() => setSteps([true, true, false]), 3600),
      setTimeout(() => setSteps([true, true, true]),  5400),
    ]
    const check = async () => {
      const { data } = await supabase.from('requests').select('*').eq('id', reqId).single()
      if (data) setReq(data as RequestRow)
    }
    check()
    subRef.current = supabase.channel(`pending-${reqId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'requests', filter: `id=eq.${reqId}` },
        payload => setReq(payload.new as RequestRow))
      .subscribe()
    pollRef.current = setInterval(check, 4000)
    return () => {
      timers.forEach(clearTimeout)
      clearInterval(pollRef.current)
      if (subRef.current) supabase.removeChannel(subRef.current)
    }
  }, [reqId])

  const submitRating = async () => {
    if (!stars) { showToast('⭐ Pick a star rating'); return }
    try {
      await supabase.from('requests').update({ rating: stars, rating_comment: comment.trim() || null, status: 'done', completed_at: new Date().toISOString() }).eq('id', reqId)
      if (req?.fighter_id) {
        const { data: f } = await supabase.from('users').select('total_rating,rating_count').eq('id', req.fighter_id).single()
        if (f) await supabase.from('users').update({ total_rating: (f.total_rating || 0) + stars, rating_count: (f.rating_count || 0) + 1 }).eq('id', req.fighter_id)
      }
      setRatingDone(true)
      showToast('✅ Rating submitted!')
      setTimeout(() => router.push('/'), 2000)
    } catch (e: any) { showToast('❌ ' + e.message) }
  }

  const discord = process.env.NEXT_PUBLIC_DISCORD_INVITE || 'https://discord.gg/'
  const isActive = req && ['accepted','in_progress','done'].includes(req.status)
  const stepLabels = ['Scanning online fighters', 'Sending notifications', 'Waiting for acceptance']

  /* ── ACCEPTED / CHAT VIEW ── */
  if (isActive) return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 60px' }}>
      <div style={{ padding: '28px 0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 26, letterSpacing: 4, color: 'var(--green)' }}>⚡ FIGHTER INCOMING</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', fontFamily: "'Share Tech Mono', monospace", marginTop: 3 }}>
            {req?.fighter_name} accepted · Session #{reqId.substring(0,8).toUpperCase()}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <a className="discord-btn" href={discord} target="_blank" rel="noreferrer" style={{ fontSize: 13, padding: '10px 20px' }}>JOIN DISCORD ↗</a>
          {req?.status !== 'done' && <button className="btn-ghost green" onClick={() => setShowRate(true)}>⭐ Rate Fighter</button>}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 16, height: 520 }}>
        {/* Mission info */}
        <div className="card card-top-green" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14, overflow: 'auto' }}>
          <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 16, letterSpacing: 2, color: 'var(--text)', marginBottom: 4 }}>MISSION INFO</div>
          {[
            { l: 'Requester', v: req?.requester_name },
            { l: 'Roblox',    v: req?.roblox_username || '—' },
            { l: 'Type',      v: req?.fight_type },
            { l: 'Status',    v: <span className={`status-tag st-${req?.status}`}>{req?.status?.replace('_',' ')}</span> },
            { l: 'Fighter',   v: <span style={{ color: 'var(--green)', fontWeight: 700 }}>{req?.fighter_name}</span> },
          ].map(item => (
            <div key={item.l} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: '1px solid rgba(37,21,69,.4)' }}>
              <span style={{ color: 'var(--muted)', fontFamily: "'Share Tech Mono', monospace", fontSize: 10, letterSpacing: 1 }}>{item.l}</span>
              <span style={{ color: 'var(--text)', fontFamily: "'Share Tech Mono', monospace", fontSize: 12 }}>{item.v}</span>
            </div>
          ))}
          <div>
            <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: "'Share Tech Mono', monospace", letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>Description</div>
            <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>{req?.description}</div>
          </div>
          {req?.roblox_username && (
            <div>
              <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: "'Share Tech Mono', monospace", letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>Quick Copy</div>
              <div style={{ display: 'flex', gap: 6 }}>
                <div style={{ flex: 1, background: 'var(--surface)', border: '1px solid var(--border)', padding: '7px 10px', fontFamily: "'Share Tech Mono', monospace", fontSize: 12 }}>{req.roblox_username}</div>
                <button className="btn-ghost teal" style={{ padding: '7px 12px', fontSize: 10 }} onClick={() => { navigator.clipboard.writeText(req!.roblox_username!); showToast('📋 Copied!') }}>COPY</button>
              </div>
            </div>
          )}
          {req?.status === 'done' && (
            <div style={{ background: 'rgba(0,230,118,.08)', border: '1px solid rgba(0,230,118,.25)', padding: '12px 16px', textAlign: 'center' }}>
              <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 18, letterSpacing: 3, color: 'var(--green)' }}>TARGET ELIMINATED</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: "'Share Tech Mono', monospace", marginTop: 4 }}>Enemy eliminated. You're safe now.</div>
            </div>
          )}
        </div>

        {/* Chat */}
        <div className="card card-top-teal" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="pdot pdot-teal" />
            <span style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 16, letterSpacing: 2, color: 'var(--teal)' }}>LIVE CHAT</span>
            <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 11, color: 'var(--muted)', marginLeft: 'auto' }}>with {req?.fighter_name}</span>
          </div>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ChatBox requestId={reqId} fighterName={req?.fighter_name || 'Fighter'} />
          </div>
        </div>
      </div>

      {/* Rating Modal */}
      <Modal open={showRate} onClose={() => setShowRate(false)} title="⭐ RATE YOUR FIGHTER" maxWidth="420px" accent="var(--gold)">
        {ratingDone ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 22, letterSpacing: 3, color: 'var(--green)' }}>Rating Submitted!</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', fontFamily: "'Share Tech Mono', monospace", marginTop: 8 }}>Redirecting to home...</div>
          </div>
        ) : (
          <>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 14, fontFamily: "'Share Tech Mono', monospace" }}>How did {req?.fighter_name} perform?</div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                {[1,2,3,4,5].map(n => <button key={n} className={`star-btn ${n <= stars ? 'lit' : ''}`} onClick={() => setStars(n)}>⭐</button>)}
              </div>
            </div>
            <div><label className="flabel">Comment (optional)</label><input className="finput" value={comment} onChange={e => setComment(e.target.value)} placeholder="Absolute monster..." /></div>
            <button className="btn-form" style={{ clipPath: 'none', background: 'var(--gold)', color: 'var(--void)' }} onClick={submitRating}>SUBMIT RATING</button>
          </>
        )}
      </Modal>
    </div>
  )

  /* ── PENDING VIEW ── */
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>
      <div className="card card-top-red fade-in" style={{ maxWidth: 520, margin: '60px auto', padding: '52px 36px', textAlign: 'center' }}>
        <div style={{ width: 72, height: 72, border: '3px solid var(--border)', borderTop: '3px solid var(--cg)', borderRadius: '50%', animation: 'rot 1s linear infinite', margin: '0 auto 18px' }} />
        <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 24, letterSpacing: 4, color: 'var(--cg)' }}>FINDING A FIGHTER</div>
        <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 8, fontFamily: "'Share Tech Mono', monospace" }}>Looking for the best available player...</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 22, textAlign: 'left', maxWidth: 320, marginLeft: 'auto', marginRight: 'auto' }}>
          <div className="sstep done"><div className="sdot" />Request received</div>
          {stepLabels.map((label, i) => (
            <div key={i} className={`sstep ${steps[i] ? 'done' : i === steps.filter(Boolean).length ? 'active' : ''}`}>
              <div className="sdot" />{label}
            </div>
          ))}
        </div>
        <div style={{ marginTop: 20, fontSize: 11, color: 'var(--dim)', fontFamily: "'Share Tech Mono', monospace" }}>ID: #{reqId.substring(0,8).toUpperCase()}</div>
        <button className="btn-ghost" onClick={() => router.push('/')} style={{ marginTop: 20 }}>← Cancel</button>
      </div>
    </div>
  )
}

'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { RatingModal } from '@/components/requests/RatingModal'
import type { RequestRow } from '@/types'

export default function PendingPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const reqId  = params.id
  const [req, setReq]           = useState<RequestRow | null>(null)
  const [showRate, setShowRate] = useState(false)
  const [steps, setSteps]       = useState([false, false, false])
  const pollRef = useRef<NodeJS.Timeout>()
  const subRef  = useRef<any>()

  useEffect(() => {
    // Animate search steps
    const timers = [
      setTimeout(() => setSteps([true, false, false]), 1800),
      setTimeout(() => setSteps([true, true, false]), 3600),
      setTimeout(() => setSteps([true, true, true]),  5400),
    ]

    const checkAccepted = async () => {
      const { data } = await supabase.from('requests').select('*').eq('id', reqId).single()
      if (data) {
        setReq(data)
        if (data.status === 'accepted') onAccepted(data)
      }
    }

    checkAccepted()

    // Realtime
    subRef.current = supabase.channel(`pending-${reqId}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'requests',
        filter: `id=eq.${reqId}`,
      }, payload => {
        const row = payload.new as RequestRow
        setReq(row)
        if (row.status === 'accepted') onAccepted(row)
      }).subscribe()

    // Fallback poll every 4s
    pollRef.current = setInterval(checkAccepted, 4000)

    return () => {
      timers.forEach(clearTimeout)
      clearInterval(pollRef.current)
      if (subRef.current) supabase.removeChannel(subRef.current)
    }
  }, [reqId])

  const onAccepted = (row: RequestRow) => {
    clearInterval(pollRef.current)
    if (subRef.current) supabase.removeChannel(subRef.current)
    setReq(row)
  }

  const isAccepted = req?.status === 'accepted'
  const discordUrl = process.env.NEXT_PUBLIC_DISCORD_INVITE || 'https://discord.gg/'

  const stepLabels = [
    'Scanning online fighters',
    'Sending notifications',
    'Waiting for someone to accept',
  ]

  if (isAccepted) {
    return (
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>
        <div className="card card-accent-green" style={{ maxWidth: 520, margin: '60px auto', padding: '52px 36px', textAlign: 'center' }}>
          <span style={{ fontSize: 52, display: 'block', marginBottom: 20 }}>⚡</span>
          <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 30, letterSpacing: 4, color: 'var(--green)', marginBottom: 10 }}>
            FIGHTER IS COMING
          </div>
          <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.9, fontFamily: "'Share Tech Mono', monospace" }}>
            <strong style={{ color: 'var(--green)' }}>{req?.fighter_name || 'A fighter'}</strong> accepted your request!<br />
            Join Discord now — don't keep them waiting.
          </div>
          <a className="discord-btn" href={discordUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: 24 }}>
            JOIN DISCORD ↗
          </a>
          <div style={{ marginTop: 18, fontSize: 11, color: 'var(--dim)', fontFamily: "'Share Tech Mono', monospace" }}>
            Session: #{reqId.substring(0, 8).toUpperCase()}
          </div>
          <button
            className="btn-secondary"
            onClick={() => setShowRate(true)}
            style={{ marginTop: 18, fontSize: 14, padding: '11px 24px', clipPath: 'none' }}
          >
            ⭐ RATE YOUR FIGHTER
          </button>
        </div>
        <RatingModal open={showRate} onClose={() => { setShowRate(false); router.push('/') }} requestId={reqId} />
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>
      <div className="card card-accent-top" style={{ maxWidth: 520, margin: '60px auto', padding: '52px 36px', textAlign: 'center' }}>
        <div style={{ width: 72, height: 72, border: '3px solid var(--border)', borderTop: '3px solid var(--cg)', borderRadius: '50%', animation: 'rot 1s linear infinite', margin: '0 auto 18px' }} />
        <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 24, letterSpacing: 4, color: 'var(--cg)' }}>
          FINDING A FIGHTER
        </div>
        <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 8, fontFamily: "'Share Tech Mono', monospace" }}>
          Looking for the best available player...
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 22, textAlign: 'left', maxWidth: 320, marginLeft: 'auto', marginRight: 'auto' }}>
          <div className="sstep done"><div className="sdot" />Request received</div>
          {stepLabels.map((label, i) => (
            <div key={i} className={`sstep ${steps[i] ? 'done' : i === steps.filter(Boolean).length ? 'active' : ''}`}>
              <div className="sdot" />{label}
            </div>
          ))}
        </div>

        <div style={{ marginTop: 20, fontSize: 11, color: 'var(--dim)', fontFamily: "'Share Tech Mono', monospace" }}>
          ID: #{reqId.substring(0, 8).toUpperCase()}
        </div>

        <button
          className="btn-ghost"
          onClick={() => router.push('/')}
          style={{ marginTop: 20 }}
        >
          ← Cancel
        </button>
      </div>
    </div>
  )
}

'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export function StatusBar() {
  const [s, setS] = useState({ online: 0, pending: 0, done: 0 })

  const load = async () => {
    const [{ data: u }, { data: r }] = await Promise.all([
      supabase.from('users').select('is_online,role'),
      supabase.from('requests').select('status'),
    ])
    setS({
      online:  (u || []).filter((x: any) => x.is_online && x.role === 'fighter').length,
      pending: (r || []).filter((x: any) => x.status === 'pending').length,
      done:    (r || []).filter((x: any) => x.status === 'done').length,
    })
  }

  useEffect(() => {
    load()
    const ch = supabase.channel('statusbar-v2')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'requests' }, load)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  const Pill = ({ dot, val, label }: { dot: string; val: number; label: string }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
      <div className={`pdot pdot-${dot}`} />
      <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 11, color: 'var(--muted)' }}>
        <strong style={{ color: 'var(--text)' }}>{val}</strong> {label}
      </span>
    </div>
  )

  return (
    <div className="z2" style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '6px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 28 }}>
      <Pill dot="green" val={s.online}  label="fighters online" />
      <Pill dot="red"   val={s.pending} label="waiting for help" />
      <Pill dot="gold"  val={s.done}    label="rescues today" />
    </div>
  )
}

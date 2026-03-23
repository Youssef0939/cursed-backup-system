'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export function StatusBar() {
  const [online, setOnline]   = useState(0)
  const [pending, setPending] = useState(0)
  const [done, setDone]       = useState(0)

  const load = async () => {
    const [{ data: users }, { data: reqs }] = await Promise.all([
      supabase.from('users').select('is_online'),
      supabase.from('requests').select('status'),
    ])
    setOnline((users || []).filter((u: any) => u.is_online).length)
    setPending((reqs || []).filter((r: any) => r.status === 'pending').length)
    setDone((reqs || []).filter((r: any) => r.status === 'done').length)
  }

  useEffect(() => {
    load()
    const ch = supabase.channel('statusbar')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'requests' }, load)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  const pill = (dot: string, val: number | string, label: string) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
      <div className={`pulse-dot ${dot}`} />
      <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 11, color: 'var(--muted)' }}>
        <strong style={{ color: 'var(--text)' }}>{val}</strong> {label}
      </span>
    </div>
  )

  return (
    <div className="z2" style={{
      background: 'var(--surface)', borderBottom: '1px solid var(--border)',
      padding: '6px 24px', display: 'flex', alignItems: 'center',
      justifyContent: 'center', gap: 28,
    }}>
      {pill('green', online,  'fighters online')}
      {pill('red',   pending, 'waiting for help')}
      {pill('gold',  done,    'battles done')}
    </div>
  )
}

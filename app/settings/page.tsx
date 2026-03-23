'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/hooks/useUser'
import { useToast } from '@/hooks/useToast'

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <div className={`toggle ${on ? 'on' : ''}`} onClick={onClick} />
  )
}

export default function SettingsPage() {
  const router = useRouter()
  const { profile, loading, refreshProfile } = useUser()
  const { showToast } = useToast()

  const [username, setUsername]   = useState('')
  const [discord, setDiscord]     = useState('')
  const [online, setOnline]       = useState(true)
  const [notifs, setNotifs]       = useState(true)
  const [saving, setSaving]       = useState(false)

  useEffect(() => {
    if (profile) {
      setUsername(profile.username || '')
      setDiscord(profile.discord || '')
      setOnline(profile.is_online)
    }
  }, [profile])

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 80, color: 'var(--dim)', fontFamily: "'Share Tech Mono', monospace" }}>
      <span className="spin">⚡</span> Loading...
    </div>
  )

  if (!profile) return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>
      <div className="card" style={{ maxWidth: 420, margin: '60px auto', padding: '40px 28px', textAlign: 'center' }}>
        <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 24, letterSpacing: 4, color: 'var(--muted)', marginBottom: 10 }}>LOGIN REQUIRED</div>
        <button className="btn-form" style={{ clipPath: 'none' }} onClick={() => router.push('/auth')}>LOGIN NOW ⚡</button>
      </div>
    </div>
  )

  const toggleOnline = async () => {
    const next = !online; setOnline(next)
    await supabase.from('users').update({ is_online: next }).eq('id', profile.id)
  }

  const save = async () => {
    if (!username.trim()) { showToast('⚠ Username cannot be empty'); return }
    setSaving(true)
    try {
      await supabase.from('users').update({ username: username.trim(), discord: discord.trim() || null }).eq('id', profile.id)
      refreshProfile()
      showToast('✅ Settings saved!')
    } catch (e: any) { showToast('❌ ' + e.message) }
    setSaving(false)
  }

  const row = (label: string, sub: string, toggled: boolean, onToggle: () => void) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(37,21,69,.4)' }}>
      <div>
        <div style={{ fontSize: 15, color: 'var(--text)', fontWeight: 600 }}>{label}</div>
        <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: "'Share Tech Mono', monospace", marginTop: 2 }}>{sub}</div>
      </div>
      <Toggle on={toggled} onClick={onToggle} />
    </div>
  )

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 80px' }}>
      <div style={{ paddingTop: 32 }}>
        <div className="sec-hdr"><h2>SETTINGS</h2><div className="sec-line" /></div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }} className="grid-2">

          {/* PREFERENCES */}
          <div className="card" style={{ padding: 24 }}>
            <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 18, letterSpacing: 2, color: 'var(--pg)', marginBottom: 20 }}>
              Preferences
            </div>
            <div style={{ paddingBottom: 8 }}>
              {row('Dark Mode', 'Always on — it\'s a dark system', true, () => {})}
              {row('Notifications', 'Get notified on new requests', notifs, () => setNotifs(n => !n))}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
                <div>
                  <div style={{ fontSize: 15, color: 'var(--text)', fontWeight: 600 }}>Online Status</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: "'Share Tech Mono', monospace", marginTop: 2 }}>Show as available to fight</div>
                </div>
                <Toggle on={online} onClick={toggleOnline} />
              </div>
            </div>
          </div>

          {/* IDENTITY */}
          <div className="card" style={{ padding: 24 }}>
            <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 18, letterSpacing: 2, color: 'var(--pg)', marginBottom: 20 }}>
              Your Identity
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="flabel">Username</label>
                <input className="finput" value={username} onChange={e => setUsername(e.target.value)} placeholder="Your fighter name" />
              </div>
              <div>
                <label className="flabel">Discord Username</label>
                <input className="finput" value={discord} onChange={e => setDiscord(e.target.value)} placeholder="username#0000" />
              </div>
              <button className="btn-form" style={{ clipPath: 'none', fontSize: 14, padding: 12 }} onClick={save} disabled={saving}>
                {saving ? 'SAVING...' : 'SAVE CHANGES'}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

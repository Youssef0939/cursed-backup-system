'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/hooks/useUser'
import { useToast } from '@/hooks/useToast'
import { calcRank, getAvgRating, getWinRate, RANKS } from '@/types'

function Row({ label, sub, on, onToggle, disabled }: { label: string; sub: string; on: boolean; onToggle: () => void; disabled?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(37,21,69,.4)' }}>
      <div>
        <div style={{ fontSize: 15, color: 'var(--text)', fontWeight: 600 }}>{label}</div>
        <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: "'Share Tech Mono', monospace", marginTop: 2 }}>{sub}</div>
      </div>
      <div className={`toggle ${on ? 'on' : ''}`} onClick={disabled ? undefined : onToggle} style={{ opacity: disabled ? .4 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }} />
    </div>
  )
}

export default function SettingsPage() {
  const router = useRouter()
  const { profile, loading, refreshProfile } = useUser()
  const { showToast } = useToast()
  const [username, setUsername]   = useState('')
  const [discord, setDiscord]     = useState('')
  const [roblox, setRoblox]       = useState('')
  const [bio, setBio]             = useState('')
  const [online, setOnline]       = useState(true)
  const [accept1v1, set1v1]       = useState(true)
  const [acceptTeam, setTeam]     = useState(true)
  const [notifs, setNotifs]       = useState(true)
  const [saving, setSaving]       = useState(false)

  useEffect(() => {
    if (profile) {
      setUsername(profile.username || '')
      setDiscord(profile.discord || '')
      setRoblox(profile.roblox_username || '')
      setBio(profile.bio || '')
      setOnline(profile.is_online)
      set1v1(profile.accept_1v1)
      setTeam(profile.accept_team)
    }
  }, [profile])

  if (loading) return <div style={{ textAlign: 'center', padding: 80, color: 'var(--dim)', fontFamily: "'Share Tech Mono', monospace" }}><span className="spin">⚡</span></div>
  if (!profile) return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>
      <div className="card" style={{ maxWidth: 400, margin: '60px auto', padding: '40px 28px', textAlign: 'center' }}>
        <button className="btn-form" style={{ clipPath: 'none' }} onClick={() => router.push('/auth')}>LOGIN NOW ⚡</button>
      </div>
    </div>
  )

  const togOnline = async () => { const n = !online; setOnline(n); await supabase.from('users').update({ is_online: n }).eq('id', profile.id) }
  const tog1v1    = async () => { const n = !accept1v1; set1v1(n); await supabase.from('users').update({ accept_1v1: n }).eq('id', profile.id) }
  const togTeam   = async () => { const n = !acceptTeam; setTeam(n); await supabase.from('users').update({ accept_team: n }).eq('id', profile.id) }

  const save = async () => {
    if (!username.trim()) { showToast('⚠ Username cannot be empty'); return }
    setSaving(true)
    try {
      await supabase.from('users').update({ username: username.trim(), discord: discord.trim() || null, roblox_username: roblox.trim() || null, bio: bio.trim() || null }).eq('id', profile.id)
      refreshProfile(); showToast('✅ Settings saved!')
    } catch (e: any) { showToast('❌ ' + e.message) }
    setSaving(false)
  }

  const avg = getAvgRating(profile); const wr = getWinRate(profile); const rk = calcRank(profile.wins, avg)
  const next = RANKS.find(r => r.minWins > profile.wins)

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 80px' }}>
      <div style={{ paddingTop: 32 }}>
        <div className="sec-hdr"><h2>SETTINGS</h2><div className="sec-line" /></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }} className="grid-2">

          <div className="card" style={{ padding: 24 }}>
            <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 18, letterSpacing: 2, color: 'var(--pg)', marginBottom: 20 }}>Preferences</div>
            <Row label="Dark Mode" sub="Always on" on={true} onToggle={() => {}} disabled />
            <Row label="Notifications" sub="Get notified on new requests" on={notifs} onToggle={() => setNotifs(n => !n)} />
            <Row label="Online Status" sub="Show as available" on={online} onToggle={togOnline} />
            {profile.role === 'fighter' && <>
              <Row label="Accept 1v1" sub="Receive solo requests" on={accept1v1} onToggle={tog1v1} />
              <Row label="Accept Team" sub="Receive team requests" on={acceptTeam} onToggle={togTeam} />
            </>}
          </div>

          <div className="card" style={{ padding: 24 }}>
            <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 18, letterSpacing: 2, color: 'var(--pg)', marginBottom: 20 }}>Your Identity</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              <div><label className="flabel">Username</label><input className="finput" value={username} onChange={e => setUsername(e.target.value)} /></div>
              <div><label className="flabel">Roblox Username</label><input className="finput" value={roblox} onChange={e => setRoblox(e.target.value)} placeholder="Your Roblox username" /></div>
              <div><label className="flabel">Discord</label><input className="finput" value={discord} onChange={e => setDiscord(e.target.value)} placeholder="username#0000" /></div>
              <div><label className="flabel">Bio</label><textarea className="finput" rows={2} value={bio} onChange={e => setBio(e.target.value)} placeholder="Say something about yourself..." /></div>
              <button className="btn-form" style={{ clipPath: 'none', fontSize: 14, padding: 12 }} onClick={save} disabled={saving}>{saving ? 'SAVING...' : 'SAVE CHANGES'}</button>
            </div>
          </div>
        </div>

        {/* RANK PROGRESS */}
        <div className="card card-top-purple" style={{ padding: 24, marginTop: 16 }}>
          <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 18, letterSpacing: 2, color: 'var(--pg)', marginBottom: 16 }}>Rank Progress</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: "'Share Tech Mono', monospace", letterSpacing: 2, marginBottom: 6 }}>CURRENT RANK</div>
              <span className={`rank-badge ${rk.cls}`} style={{ fontSize: 12 }}>{rk.label}</span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
                {[
                  { n: profile.wins, l: 'Wins', c: 'var(--pg)' },
                  { n: profile.losses, l: 'Losses', c: 'var(--cg)' },
                  { n: `${wr}%`, l: 'Win Rate', c: 'var(--gold)' },
                  { n: avg ? `${avg}★` : '—', l: 'AVG Rating', c: 'var(--gold)' },
                ].map((s, i) => (
                  <div key={i} style={{ background: 'var(--surface)', padding: '10px 8px', textAlign: 'center' }}>
                    <span style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 22, color: s.c, display: 'block', letterSpacing: 2 }}>{s.n}</span>
                    <span style={{ fontSize: 9, color: 'var(--muted)', letterSpacing: 1, textTransform: 'uppercase' }}>{s.l}</span>
                  </div>
                ))}
              </div>
            </div>
            {next && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: "'Share Tech Mono', monospace", letterSpacing: 2, marginBottom: 6 }}>NEXT RANK</div>
                <span className={`rank-badge ${next.cls}`}>{next.label}</span>
                <div style={{ fontSize: 11, color: 'var(--dim)', fontFamily: "'Share Tech Mono', monospace", marginTop: 6 }}>{next.minWins - profile.wins} more wins</div>
              </div>
            )}
          </div>
        </div>

        {/* ACCOUNT INFO */}
        <div className="card" style={{ padding: 24, marginTop: 16 }}>
          <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 18, letterSpacing: 2, color: 'var(--pg)', marginBottom: 16 }}>Account Info</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
            {[
              { l: 'Account Role', v: profile.role.toUpperCase(), c: profile.role === 'fighter' ? 'var(--teal)' : 'var(--muted)' },
              { l: 'Fighter Status', v: profile.fighter_status?.toUpperCase() || 'N/A', c: profile.fighter_status === 'approved' ? 'var(--green)' : profile.fighter_status === 'pending' ? 'var(--gold)' : 'var(--dim)' },
              { l: 'Member Since', v: new Date(profile.created_at).toLocaleDateString(), c: 'var(--muted)' },
            ].map((item, i) => (
              <div key={i} style={{ background: 'var(--surface)', padding: '12px 16px' }}>
                <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: "'Share Tech Mono', monospace", letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>{item.l}</div>
                <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 18, letterSpacing: 2, color: item.c }}>{item.v}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}

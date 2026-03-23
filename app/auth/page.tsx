'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/useToast'

type Mode = 'login' | 'register'
type RegRole = 'client' | 'fighter_applicant'

export default function AuthPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [mode, setMode]       = useState<Mode>('login')
  const [regRole, setRegRole] = useState<RegRole>('client')
  const [username, setUsername] = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [roblox, setRoblox]     = useState('')
  const [reason, setReason]     = useState('')
  const [discord, setDiscord]   = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [step, setStep]         = useState<'form'|'pending'>('form')

  const submit = async () => {
    setError('')
    if (!email || !password) { setError('Fill in all fields.'); return }
    if (mode === 'register') {
      if (!username.trim()) { setError('Enter your fighter name.'); return }
      if (regRole === 'fighter_applicant' && !reason.trim()) { setError('Explain why you want to be a fighter.'); return }
    }
    setLoading(true)
    try {
      if (mode === 'register') {
        const { data, error: signUpErr } = await supabase.auth.signUp({ email, password })
        if (signUpErr) throw signUpErr
        if (data.user) {
          const isFighterApply = regRole === 'fighter_applicant'
          const { data: newUser } = await supabase.from('users').insert({
            auth_id: data.user.id, username: username.trim(), email,
            role: 'client',
            fighter_status: isFighterApply ? 'pending' : null,
            roblox_username: roblox.trim() || null,
            discord: discord.trim() || null,
            wins: 0, losses: 0, total_rating: 0, rating_count: 0,
            is_online: true, accept_1v1: true, accept_team: true,
          }).select().single()
          if (isFighterApply && newUser) {
            await supabase.from('fighter_applications').insert({
              user_id: newUser.id, username: username.trim(),
              reason: reason.trim(), roblox_username: roblox.trim() || null, status: 'pending',
            })
            setStep('pending'); setLoading(false); return
          }
        }
        showToast('✅ Account created! Check your email to confirm.')
      } else {
        const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password })
        if (signInErr) throw signInErr
        router.push('/'); router.refresh()
      }
    } catch (e: any) { setError(e.message) }
    setLoading(false)
  }

  if (step === 'pending') return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <div className="card card-top-gold fade-in" style={{ width: '100%', maxWidth: 480, padding: '48px 36px', textAlign: 'center' }}>
          <div style={{ fontSize: 52, marginBottom: 20 }}>⏳</div>
          <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 26, letterSpacing: 4, color: 'var(--gold)', marginBottom: 12 }}>APPLICATION SUBMITTED</div>
          <div style={{ fontSize: 14, color: 'var(--muted)', fontFamily: "'Share Tech Mono', monospace", lineHeight: 1.8 }}>
            Your fighter application is under review.<br />The owner will approve or reject it.<br /><br />
            <span style={{ color: 'var(--text)' }}>You can still request help as a regular client.</span>
          </div>
          <button className="btn-form" style={{ marginTop: 28, clipPath: 'none' }} onClick={() => { router.push('/'); router.refresh() }}>
            CONTINUE AS CLIENT ⚡
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <div className="card card-top-red fade-in" style={{ width: '100%', maxWidth: 460, padding: '36px 28px' }}>
          <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 22, letterSpacing: 4, textAlign: 'center', color: 'var(--cg)', marginBottom: 6 }}>⚔ JOIN THE NETWORK</div>
          <div style={{ fontSize: 12, color: 'var(--dim)', textAlign: 'center', fontFamily: "'Share Tech Mono', monospace", marginBottom: 20 }}>Create your account or log back in</div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: 'var(--border)', marginBottom: 18 }}>
            {(['login','register'] as Mode[]).map(m => (
              <button key={m} onClick={() => { setMode(m); setError('') }} style={{ background: mode === m ? 'rgba(255,23,68,.1)' : 'var(--surface)', padding: 10, fontFamily: "'Bebas Neue', cursive", fontSize: 15, letterSpacing: 2, cursor: 'pointer', color: mode === m ? 'var(--cg)' : 'var(--muted)', border: 'none', transition: 'all .2s' }}>
                {m.toUpperCase()}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
            {mode === 'register' && (
              <>
                <div><label className="flabel">Fighter Name</label><input className="finput" value={username} onChange={e => setUsername(e.target.value)} placeholder="Your in-game name" /></div>
                <div>
                  <label className="flabel">I want to...</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {[
                      { v: 'client' as RegRole, icon: '🆘', label: 'GET HELP', sub: 'Request fighters' },
                      { v: 'fighter_applicant' as RegRole, icon: '⚔️', label: 'BE A FIGHTER', sub: 'Apply to join' },
                    ].map(opt => (
                      <div key={opt.v} onClick={() => setRegRole(opt.v)} style={{ background: regRole === opt.v ? 'rgba(255,23,68,.07)' : 'var(--surface)', border: `1px solid ${regRole === opt.v ? 'var(--cg)' : 'var(--border)'}`, padding: '12px 10px', textAlign: 'center', cursor: 'pointer', transition: 'all .2s' }}>
                        <div style={{ fontSize: 20, marginBottom: 4 }}>{opt.icon}</div>
                        <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 14, letterSpacing: 2, color: regRole === opt.v ? 'var(--cg)' : 'var(--text)' }}>{opt.label}</div>
                        <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: "'Share Tech Mono', monospace", marginTop: 2 }}>{opt.sub}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div><label className="flabel">Roblox Username (recommended)</label><input className="finput" value={roblox} onChange={e => setRoblox(e.target.value)} placeholder="Your Roblox username" /></div>
                {regRole === 'fighter_applicant' && (
                  <>
                    <div style={{ background: 'rgba(45,212,191,.07)', border: '1px solid rgba(45,212,191,.25)', borderLeft: '3px solid var(--teal)', padding: '10px 14px', fontFamily: "'Share Tech Mono', monospace", fontSize: 12, color: 'var(--teal)' }}>
                      ⚠ Fighter applications are reviewed by the owner before approval.
                    </div>
                    <div><label className="flabel">Why should you be a fighter?</label><textarea className="finput" rows={3} value={reason} onChange={e => setReason(e.target.value)} placeholder="Describe your skills..." /></div>
                    <div><label className="flabel">Discord Username</label><input className="finput" value={discord} onChange={e => setDiscord(e.target.value)} placeholder="username#0000" /></div>
                  </>
                )}
              </>
            )}
            <div><label className="flabel">Email</label><input className="finput" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" /></div>
            <div><label className="flabel">Password</label><input className="finput" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" onKeyDown={e => e.key === 'Enter' && submit()} /></div>
            {error && <div className="err-box">❌ {error}</div>}
            <button className="btn-form" onClick={submit} disabled={loading}>
              {loading ? 'CONNECTING...' : mode === 'login' ? 'ENTER THE NETWORK ⚡' : regRole === 'fighter_applicant' ? 'SUBMIT APPLICATION ⚡' : 'CREATE ACCOUNT ⚡'}
            </button>
            <div style={{ textAlign: 'center' }}><span onClick={() => router.push('/')} style={{ fontSize: 11, color: 'var(--dim)', cursor: 'pointer', fontFamily: "'Share Tech Mono', monospace" }}>← Back</span></div>
          </div>
        </div>
      </div>
    </div>
  )
}

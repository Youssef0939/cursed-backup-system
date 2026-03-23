'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/useToast'

export default function AuthPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [mode, setMode]         = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const submit = async () => {
    setError('')
    if (!email || !password) { setError('Fill in all fields.'); return }
    if (mode === 'register' && !username.trim()) { setError('Enter your fighter name.'); return }
    setLoading(true)
    try {
      if (mode === 'register') {
        const { data, error: signUpErr } = await supabase.auth.signUp({ email, password })
        if (signUpErr) throw signUpErr
        if (data.user) {
          await supabase.from('users').insert({
            auth_id: data.user.id, username: username.trim(), email,
            wins: 0, losses: 0, total_rating: 0, rating_count: 0,
            is_online: true, accept_1v1: true, accept_team: true,
          })
        }
        showToast('✅ Account created! Check your email to confirm.')
      } else {
        const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password })
        if (signInErr) throw signInErr
        router.push('/')
        router.refresh()
      }
    } catch (e: any) {
      setError(e.message)
    }
    setLoading(false)
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <div className="card card-accent-top" style={{ width: '100%', maxWidth: 420, padding: '36px 28px' }}>
          <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 22, letterSpacing: 4, textAlign: 'center', color: 'var(--cg)', marginBottom: 6 }}>
            ⚔ JOIN THE NETWORK
          </div>
          <div style={{ fontSize: 12, color: 'var(--dim)', textAlign: 'center', fontFamily: "'Share Tech Mono', monospace", marginBottom: 22 }}>
            Create your account or log back in
          </div>

          {/* TABS */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: 'var(--border)', marginBottom: 18 }}>
            {(['login', 'register'] as const).map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setError('') }}
                style={{
                  background: mode === m ? 'rgba(255,23,68,.1)' : 'var(--surface)',
                  padding: 10, fontFamily: "'Bebas Neue', cursive", fontSize: 15,
                  letterSpacing: 2, cursor: 'pointer',
                  color: mode === m ? 'var(--cg)' : 'var(--muted)', border: 'none', transition: 'all .2s',
                }}
              >
                {m.toUpperCase()}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
            {mode === 'register' && (
              <div>
                <label className="flabel">Fighter Name</label>
                <input className="finput" value={username} onChange={e => setUsername(e.target.value)} placeholder="Your name in the game" />
              </div>
            )}
            <div>
              <label className="flabel">Email</label>
              <input className="finput" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <div>
              <label className="flabel">Password</label>
              <input className="finput" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" onKeyDown={e => e.key === 'Enter' && submit()} />
            </div>
            {error && <div className="err-box">❌ {error}</div>}
            <button className="btn-form" onClick={submit} disabled={loading}>
              {loading ? 'CONNECTING...' : mode === 'login' ? 'ENTER THE NETWORK ⚡' : 'CREATE ACCOUNT ⚡'}
            </button>
            <div style={{ textAlign: 'center', marginTop: 4 }}>
              <span
                onClick={() => router.push('/')}
                style={{ fontSize: 11, color: 'var(--dim)', cursor: 'pointer', fontFamily: "'Share Tech Mono', monospace" }}
              >
                ← Back to Home
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

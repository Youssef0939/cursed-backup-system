'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Modal } from '@/components/ui/Modal'
import { useUser } from '@/hooks/useUser'
import { useToast } from '@/hooks/useToast'
import { FIGHT_TYPES, FIGHT_ICONS, type FightType } from '@/types'

interface Props { open: boolean; onClose: () => void }

export function RequestModal({ open, onClose }: Props) {
  const router = useRouter()
  const { profile } = useUser()
  const { showToast } = useToast()
  const [name, setName]             = useState(profile?.username || '')
  const [roblox, setRoblox]         = useState(profile?.roblox_username || '')
  const [fightType, setFightType]   = useState<FightType>('1v1')
  const [description, setDesc]      = useState('')
  const [loading, setLoading]       = useState(false)

  const submit = async () => {
    if (!name.trim())        { showToast('⚠ Enter your in-game name'); return }
    if (!description.trim()) { showToast('⚠ Describe the situation'); return }
    setLoading(true)
    try {
      const { data, error } = await supabase.from('requests').insert({
        requester_name: name.trim(),
        roblox_username: roblox.trim() || null,
        fight_type: fightType,
        description: description.trim(),
        status: 'pending',
        requester_id: profile?.id ?? null,
        game: 'Roblox',
      }).select().single()
      if (error) throw error
      onClose(); setDesc(''); setRoblox('')
      router.push(`/pending/${data.id}`)
    } catch (e: any) { showToast('❌ ' + e.message) }
    setLoading(false)
  }

  return (
    <Modal open={open} onClose={onClose} title="⚡ CALL A FIGHTER">
      <div className="urgency-bar">
        <span className="blink">▶</span> A real fighter will see this and respond within 60 seconds.
      </div>

      <div>
        <label className="flabel">Your In-Game Name</label>
        <input className="finput" value={name} onChange={e => setName(e.target.value)} placeholder="Your username..." />
      </div>

      <div>
        <label className="flabel">Roblox Username (optional — adds trust)</label>
        <input className="finput" value={roblox} onChange={e => setRoblox(e.target.value)} placeholder="roblox_username" />
      </div>

      <div>
        <label className="flabel">Type of Help Needed</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {FIGHT_TYPES.map(t => (
            <div key={t} onClick={() => setFightType(t)} style={{ background: fightType === t ? 'rgba(255,23,68,.07)' : 'var(--surface)', border: `1px solid ${fightType === t ? 'var(--cg)' : 'var(--border)'}`, color: fightType === t ? 'var(--cg)' : 'var(--muted)', padding: '12px 10px', textAlign: 'center', cursor: 'pointer', transition: 'all .2s', fontFamily: "'Bebas Neue', cursive", fontSize: 14, letterSpacing: 2 }}>
              {FIGHT_ICONS[t]} {t}
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="flabel">What's Happening?</label>
        <textarea className="finput" rows={3} value={description} onChange={e => setDesc(e.target.value)} placeholder="Describe the situation — who's dominating you and how bad it is." />
      </div>

      <button className="btn-form" onClick={submit} disabled={loading}>
        {loading ? 'SENDING...' : 'SEND REQUEST ⚡'}
      </button>
    </Modal>
  )
}

'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Modal } from '@/components/ui/Modal'
import { useUser } from '@/hooks/useUser'
import { useToast } from '@/hooks/useToast'
import type { FightType } from '@/types'

interface Props {
  open: boolean
  onClose: () => void
  onSubmitted: (reqId: string) => void
}

export function RequestModal({ open, onClose, onSubmitted }: Props) {
  const { profile } = useUser()
  const { showToast } = useToast()
  const [name, setName]           = useState(profile?.username || '')
  const [fightType, setFightType] = useState<FightType>('1v1')
  const [description, setDesc]    = useState('')
  const [loading, setLoading]     = useState(false)

  const submit = async () => {
    if (!name.trim())        { showToast('⚠ Enter your in-game name'); return }
    if (!description.trim()) { showToast('⚠ Describe the situation'); return }
    setLoading(true)
    try {
      const { data, error } = await supabase.from('requests').insert({
        requester_name: name.trim(),
        fight_type: fightType,
        description: description.trim(),
        status: 'pending',
        requester_id: profile?.id ?? null,
      }).select().single()
      if (error) throw error
      onClose()
      onSubmitted(data.id)
      setDesc('')
    } catch (e: any) {
      showToast('❌ ' + e.message)
    }
    setLoading(false)
  }

  const typeBtn = (t: FightType, label: string) => (
    <div
      onClick={() => setFightType(t)}
      style={{
        background: fightType === t ? 'rgba(255,23,68,.07)' : 'var(--surface)',
        border: `1px solid ${fightType === t ? 'var(--cg)' : 'var(--border)'}`,
        color: fightType === t ? 'var(--cg)' : 'var(--muted)',
        padding: 14, textAlign: 'center', cursor: 'pointer', transition: 'all .2s',
        fontFamily: "'Bebas Neue', cursive", fontSize: 16, letterSpacing: 2,
      }}
    >
      {label}
    </div>
  )

  return (
    <Modal open={open} onClose={onClose} title="⚡ CALL A FIGHTER">
      <div style={{
        background: 'rgba(255,23,68,.06)', border: '1px solid rgba(255,23,68,.2)',
        borderLeft: '3px solid var(--cg)', padding: '11px 14px',
        fontFamily: "'Share Tech Mono', monospace", fontSize: 12, color: 'var(--muted)',
      }}>
        ⚠ A real fighter will see this and respond. Be clear and honest.
      </div>

      <div>
        <label className="flabel">Your In-Game Name</label>
        <input className="finput" value={name} onChange={e => setName(e.target.value)} placeholder="Your username..." />
      </div>

      <div>
        <label className="flabel">Type of Fight</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {typeBtn('1v1', '⚔ 1v1')}
          {typeBtn('Team Fight', '👥 TEAM')}
        </div>
      </div>

      <div>
        <label className="flabel">What's Happening?</label>
        <textarea
          className="finput" rows={3} value={description}
          onChange={e => setDesc(e.target.value)}
          placeholder="Describe the situation — who's dominating you and how."
        />
      </div>

      <button className="btn-form" onClick={submit} disabled={loading}>
        {loading ? 'SENDING...' : 'SEND REQUEST ⚡'}
      </button>
    </Modal>
  )
}

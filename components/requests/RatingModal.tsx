'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/hooks/useToast'

interface Props {
  open: boolean
  onClose: () => void
  requestId: string | null
}

export function RatingModal({ open, onClose, requestId }: Props) {
  const { showToast } = useToast()
  const [stars, setStars]     = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    if (!stars)     { showToast('⭐ Pick a star rating'); return }
    if (!requestId) { showToast('⚠ No active session'); return }
    setLoading(true)
    try {
      const { data: req } = await supabase.from('requests').select('fighter_id').eq('id', requestId).single()
      if (!req?.fighter_id) { showToast('⚠ No fighter assigned yet'); setLoading(false); return }

      await supabase.from('requests').update({
        rating: stars, rating_comment: comment.trim() || null,
        status: 'done', completed_at: new Date().toISOString(),
      }).eq('id', requestId)

      const { data: f } = await supabase.from('users').select('total_rating,rating_count').eq('id', req.fighter_id).single()
      if (f) {
        await supabase.from('users').update({
          total_rating: (f.total_rating || 0) + stars,
          rating_count: (f.rating_count || 0) + 1,
        }).eq('id', req.fighter_id)
      }

      showToast('✅ Rating submitted!')
      onClose(); setStars(0); setComment('')
    } catch (e: any) { showToast('❌ ' + e.message) }
    setLoading(false)
  }

  return (
    <Modal open={open} onClose={onClose} title="⭐ RATE YOUR FIGHTER" maxWidth="420px">
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 14, fontFamily: "'Share Tech Mono', monospace" }}>
          How did they perform?
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          {[1,2,3,4,5].map(n => (
            <button key={n} className={`star-btn ${n <= stars ? 'lit' : ''}`} onClick={() => setStars(n)}>⭐</button>
          ))}
        </div>
      </div>
      <div>
        <label className="flabel">Comment (optional)</label>
        <input className="finput" value={comment} onChange={e => setComment(e.target.value)} placeholder="He destroyed everyone..." />
      </div>
      <button className="btn-form purple" onClick={submit} disabled={loading}>
        {loading ? 'SUBMITTING...' : 'SUBMIT RATING'}
      </button>
    </Modal>
  )
}

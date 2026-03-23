'use client'
import { useEffect } from 'react'

interface Props {
  open: boolean; onClose: () => void; title: string
  children: React.ReactNode; accent?: string; maxWidth?: string
}
export function Modal({ open, onClose, title, children, accent = 'var(--cg)', maxWidth = '520px' }: Props) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (open) { document.addEventListener('keydown', h); document.body.style.overflow = 'hidden' }
    return () => { document.removeEventListener('keydown', h); document.body.style.overflow = '' }
  }, [open, onClose])
  if (!open) return null
  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose() }} style={{ position: 'fixed', inset: 0, background: 'rgba(5,3,8,.93)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="fade-in" style={{ background: 'var(--card)', border: '1px solid var(--purple)', borderTop: `2px solid ${accent}`, width: '100%', maxWidth, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '15px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
          <span style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 17, letterSpacing: 3, color: accent }}>{title}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: 15 }}>{children}</div>
      </div>
    </div>
  )
}

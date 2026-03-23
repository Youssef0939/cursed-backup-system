import { calcRank, getAvgRating, getWinRate } from '@/types'
import type { UserRow } from '@/types'

interface Props {
  fighter: UserRow
  onCall?: () => void
}

export function FighterCard({ fighter, onCall }: Props) {
  const avg = getAvgRating(fighter)
  const wr  = getWinRate(fighter)
  const rk  = calcRank(fighter.wins, avg)

  return (
    <div
      onClick={onCall}
      style={{
        background: 'var(--card)', border: '1px solid var(--border)',
        borderTop: '2px solid transparent', padding: 20,
        transition: 'all .25s', cursor: onCall ? 'pointer' : 'default',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.borderTopColor = 'var(--cg)'
        ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'
        ;(e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 28px rgba(0,0,0,.4)'
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.borderTopColor = 'transparent'
        ;(e.currentTarget as HTMLDivElement).style.transform = 'none'
        ;(e.currentTarget as HTMLDivElement).style.boxShadow = 'none'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
        <div style={{
          width: 50, height: 50, background: 'var(--surface)',
          border: '2px solid var(--border)', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          fontFamily: "'Bebas Neue', cursive", fontSize: 18, color: 'var(--pg)',
          position: 'relative',
          clipPath: 'polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%)',
        }}>
          {fighter.username.substring(0, 2).toUpperCase()}
          {fighter.is_online && (
            <div style={{
              position: 'absolute', bottom: -3, right: -3,
              width: 10, height: 10, borderRadius: '50%',
              background: 'var(--green)', border: '2px solid var(--card)',
            }} />
          )}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 19, letterSpacing: 2, color: 'var(--text)' }}>
            {fighter.username}
          </div>
          <span className={`rank-badge ${rk.cls}`} style={{ marginTop: 4 }}>{rk.label}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 12 }}>
        {[
          { n: fighter.wins, l: 'Wins', c: 'var(--pg)' },
          { n: avg ? `${avg}★` : '—', l: 'Rating', c: 'var(--gold)' },
          { n: `${wr}%`, l: 'Win Rate', c: 'var(--green)' },
        ].map((s, i) => (
          <div key={i} style={{ background: 'var(--surface)', padding: 8, textAlign: 'center' }}>
            <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 14, fontWeight: 700, display: 'block', marginBottom: 1, color: s.c }}>{s.n}</span>
            <span style={{ fontSize: 9, color: 'var(--muted)', letterSpacing: 1, textTransform: 'uppercase' }}>{s.l}</span>
          </div>
        ))}
      </div>

      {onCall && (
        <button
          className="hire-btn"
          disabled={!fighter.is_online}
          style={{
            width: '100%', background: 'transparent',
            border: `1px solid ${fighter.is_online ? 'var(--purple)' : 'var(--dim)'}`,
            color: fighter.is_online ? 'var(--pg)' : 'var(--dim)',
            padding: 10, fontFamily: "'Bebas Neue', cursive",
            fontSize: 14, letterSpacing: 2, cursor: fighter.is_online ? 'pointer' : 'not-allowed',
            transition: 'all .2s',
          }}
        >
          {fighter.is_online ? 'CALL THIS FIGHTER' : 'OFFLINE'}
        </button>
      )}
    </div>
  )
}

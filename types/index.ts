export type UserRole = 'client' | 'fighter' | 'owner'
export type FighterStatus = 'pending' | 'approved' | 'rejected'
export type FightType = '1v1' | 'Team Fight' | 'Ranked Help' | 'Anti-Toxic'
export type RequestStatus = 'pending' | 'accepted' | 'in_progress' | 'done' | 'ignored'
export type MatchResult = 'win' | 'loss'

export interface UserRow {
  id: string
  auth_id: string | null
  username: string
  email: string | null
  role: UserRole
  fighter_status: FighterStatus | null
  roblox_username: string | null
  roblox_avatar: string | null
  discord: string | null
  wins: number
  losses: number
  total_rating: number
  rating_count: number
  is_online: boolean
  accept_1v1: boolean
  accept_team: boolean
  bio: string | null
  created_at: string
}

export interface RequestRow {
  id: string
  requester_id: string | null
  requester_name: string
  roblox_username: string | null
  fight_type: FightType
  game: string
  description: string
  status: RequestStatus
  fighter_id: string | null
  fighter_name: string | null
  result: MatchResult | null
  rating: number | null
  rating_comment: string | null
  priority: number
  created_at: string
  accepted_at: string | null
  completed_at: string | null
}

export interface ChatMessage {
  id: string
  request_id: string
  sender_id: string | null
  sender_name: string
  sender_role: string
  content: string
  created_at: string
}

export interface FighterApplication {
  id: string
  user_id: string
  username: string
  reason: string
  roblox_username: string | null
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

// ── RANK SYSTEM ──────────────────────────────────────────
export interface RankInfo {
  label: string
  cls: string
  color: string
  glow: string
  minWins: number
  description: string
}

export const RANKS: RankInfo[] = [
  { label: 'INITIATE',      cls: 'rank-initiate', color: '#8b7aaa', glow: 'rgba(139,122,170,.3)', minWins: 0,  description: 'Just joined the network' },
  { label: 'FIGHTER',       cls: 'rank-fighter',  color: '#60a5fa', glow: 'rgba(96,165,250,.3)',  minWins: 5,  description: 'Proven in battle' },
  { label: 'CAPTAIN',       cls: 'rank-captain',  color: '#a78bfa', glow: 'rgba(167,139,250,.3)', minWins: 20, description: 'Commands respect' },
  { label: 'WARLORD',       cls: 'rank-warlord',  color: '#ff1744', glow: 'rgba(255,23,68,.3)',   minWins: 50, description: 'Feared on the battlefield' },
  { label: 'SPECIAL GRADE', cls: 'rank-special',  color: '#fbbf24', glow: 'rgba(251,191,36,.4)',  minWins: 100, description: 'Legendary. Untouchable.' },
]

export function calcRank(wins: number, avgRating: number): RankInfo {
  if (wins >= 100 && avgRating >= 4.5) return RANKS[4]
  if (wins >= 50)  return RANKS[3]
  if (wins >= 20)  return RANKS[2]
  if (wins >= 5)   return RANKS[1]
  return RANKS[0]
}

export function getNextRank(wins: number, avgRating: number): RankInfo | null {
  const current = calcRank(wins, avgRating)
  const idx = RANKS.findIndex(r => r.label === current.label)
  return idx < RANKS.length - 1 ? RANKS[idx + 1] : null
}

export function getAvgRating(u: Pick<UserRow, 'total_rating' | 'rating_count'>): number {
  if (!u.rating_count) return 0
  return Math.round((u.total_rating / u.rating_count) * 10) / 10
}

export function getWinRate(u: Pick<UserRow, 'wins' | 'losses'>): number {
  const t = u.wins + u.losses
  return t ? Math.round((u.wins / t) * 100) : 0
}

export function timeAgo(ts: string): string {
  const s = Math.floor((Date.now() - new Date(ts).getTime()) / 1000)
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  return `${Math.floor(s / 3600)}h ago`
}

export function starsDisplay(n: number): string {
  return n ? '★'.repeat(n) + '☆'.repeat(5 - n) : '—'
}

export const FIGHT_TYPES: FightType[] = ['1v1', 'Team Fight', 'Ranked Help', 'Anti-Toxic']

export const FIGHT_ICONS: Record<FightType, string> = {
  '1v1': '⚔️',
  'Team Fight': '👥',
  'Ranked Help': '🏆',
  'Anti-Toxic': '🛡️',
}

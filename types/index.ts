export type FightType = '1v1' | 'Team Fight'
export type RequestStatus = 'pending' | 'accepted' | 'done' | 'ignored'
export type MatchResult = 'win' | 'loss'

export interface UserRow {
  id: string
  auth_id: string | null
  username: string
  email: string | null
  discord: string | null
  wins: number
  losses: number
  total_rating: number
  rating_count: number
  is_online: boolean
  accept_1v1: boolean
  accept_team: boolean
  created_at: string
}

export interface RequestRow {
  id: string
  requester_id: string | null
  requester_name: string
  fight_type: FightType
  description: string
  status: RequestStatus
  fighter_id: string | null
  fighter_name: string | null
  result: MatchResult | null
  rating: number | null
  rating_comment: string | null
  created_at: string
  accepted_at: string | null
  completed_at: string | null
}

export type Rank = 'ROOKIE' | 'FIGHTER' | 'SORCERER' | 'SPECIAL GRADE'

export interface RankInfo {
  label: Rank
  cls: string
  color: string
  minWins: number
}

export function calcRank(wins: number, avgRating: number): RankInfo {
  if (wins >= 50 && avgRating >= 4.5)
    return { label: 'SPECIAL GRADE', cls: 'rank-special', color: '#fbbf24', minWins: 50 }
  if (wins >= 20)
    return { label: 'SORCERER', cls: 'rank-sorcerer', color: '#a78bfa', minWins: 20 }
  if (wins >= 5)
    return { label: 'FIGHTER', cls: 'rank-fighter', color: '#60a5fa', minWins: 5 }
  return { label: 'ROOKIE', cls: 'rank-rookie', color: '#8b7aaa', minWins: 0 }
}

export function getAvgRating(u: Pick<UserRow, 'total_rating' | 'rating_count'>): number {
  if (!u.rating_count) return 0
  return Math.round((u.total_rating / u.rating_count) * 10) / 10
}

export function getWinRate(u: Pick<UserRow, 'wins' | 'losses'>): number {
  const total = u.wins + u.losses
  if (!total) return 0
  return Math.round((u.wins / total) * 100)
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

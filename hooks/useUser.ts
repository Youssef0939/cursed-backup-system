'use client'
import { useEffect, useState, useCallback, createContext, useContext } from 'react'
import { supabase } from '@/lib/supabase'
import type { UserRow } from '@/types'

interface UserCtx {
  user: any
  profile: UserRow | null
  loading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => void
}

export const UserContext = createContext<UserCtx>({
  user: null, profile: null, loading: true,
  signOut: async () => {}, refreshProfile: () => {},
})

export function useUser() {
  return useContext(UserContext)
}

export function useUserProvider() {
  const [user, setUser]       = useState<any>(null)
  const [profile, setProfile] = useState<UserRow | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async (authId: string) => {
    const { data } = await supabase
      .from('users').select('*').eq('auth_id', authId).single()
    if (data) {
      setProfile(data as UserRow)
      // Mark online
      await supabase.from('users').update({ is_online: true }).eq('id', data.id)
    }
  }, [])

  const refreshProfile = useCallback(() => {
    if (user?.id) fetchProfile(user.id)
  }, [user, fetchProfile])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id).finally(() => setLoading(false))
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else { setProfile(null) }
    })

    return () => subscription.unsubscribe()
  }, [fetchProfile])

  const signOut = async () => {
    if (profile) await supabase.from('users').update({ is_online: false }).eq('id', profile.id)
    await supabase.auth.signOut()
    setUser(null); setProfile(null)
  }

  return { user, profile, loading, signOut, refreshProfile }
}

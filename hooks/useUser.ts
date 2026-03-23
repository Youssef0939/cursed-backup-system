'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { UserRow } from '@/types'

export function useUser() {
  const [user, setUser]     = useState<any>(null)
  const [profile, setProfile] = useState<UserRow | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async (authId: string) => {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', authId)
      .single()
    if (data) {
      setProfile(data)
      await supabase.from('users').update({ is_online: true }).eq('id', data.id)
    }
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id).finally(() => setLoading(false))
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
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

  const refreshProfile = () => { if (user) fetchProfile(user.id) }

  return { user, profile, loading, signOut, refreshProfile }
}

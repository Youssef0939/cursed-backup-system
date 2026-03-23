'use client'
import { ToastProvider } from '@/components/ui/ToastProvider'
import { UserContext, useUserProvider } from '@/hooks/useUser'

function UserProvider({ children }: { children: React.ReactNode }) {
  const ctx = useUserProvider()
  return <UserContext.Provider value={ctx}>{children}</UserContext.Provider>
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <UserProvider>{children}</UserProvider>
    </ToastProvider>
  )
}

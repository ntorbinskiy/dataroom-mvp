import { createContext, useContext, useEffect, useRef, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'

export type AuthStatus = 'loading' | 'signedOut' | 'signedIn' | 'local'

export interface AuthUser {
  email: string
}

export interface AuthState {
  status: AuthStatus
  user: AuthUser | null
  /** resolves to an error message, or null on success */
  signIn: (email: string, password: string) => Promise<string | null>
  signUp: (email: string, password: string) => Promise<string | null>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthState | null>(null)

export function useAuth(): AuthState {
  const auth = useContext(AuthContext)
  if (auth === null) throw new Error('useAuth must be used inside an auth provider')
  return auth
}

export function LocalAuthProvider({ children }: { children: React.ReactNode }) {
  const value: AuthState = {
    status: 'local',
    user: null,
    signIn: () => Promise.resolve(null),
    signUp: () => Promise.resolve(null),
    signOut: () => Promise.resolve(),
  }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function SupabaseAuthProvider({
  client,
  onUserChange,
  children,
}: {
  client: SupabaseClient
  onUserChange: () => void
  children: React.ReactNode
}) {
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [user, setUser] = useState<AuthUser | null>(null)
  const lastUserId = useRef<string | null>(null)

  useEffect(() => {
    let cancelled = false

    function apply(email: string | undefined, signedIn: boolean): void {
      setUser(typeof email === 'string' ? { email } : null)
      setStatus(signedIn ? 'signedIn' : 'signedOut')
    }

    void client.auth.getSession().then(({ data }) => {
      if (cancelled) return
      lastUserId.current = data.session?.user.id ?? null
      apply(data.session?.user.email, data.session !== null)
    })

    const { data: subscription } = client.auth.onAuthStateChange((_event, session) => {
      apply(session?.user.email, session !== null)
      const nextUserId = session?.user.id ?? null
      if (nextUserId !== lastUserId.current) onUserChange()
      lastUserId.current = nextUserId
    })

    return () => {
      cancelled = true
      subscription.subscription.unsubscribe()
    }
    // eslint not configured; onUserChange is stable from the composition root
  }, [client, onUserChange])

  const value: AuthState = {
    status,
    user,
    signIn: async (email, password) => {
      const { error } = await client.auth.signInWithPassword({ email, password })
      return error === null ? null : error.message
    },
    signUp: async (email, password) => {
      const { data, error } = await client.auth.signUp({ email, password })
      if (error !== null) return error.message
      if (data.session === null) return 'Check your inbox to confirm the email, then sign in'
      return null
    },
    signOut: async () => {
      await client.auth.signOut()
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function AuthGate({
  fallback,
  children,
}: {
  fallback: React.ReactNode
  children: React.ReactNode
}) {
  const auth = useAuth()
  if (auth.status === 'loading') return null
  if (auth.status === 'signedOut') return <>{fallback}</>
  return <>{children}</>
}

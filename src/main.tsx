import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from '@/components/ui/sonner'
import { RepositoryProvider } from '@/app/repository-context'
import { createIndexedDbRepository } from '@/data/indexeddb/indexeddb-repository'
import { openDataroomDb } from '@/data/indexeddb/db'
import { readSupabaseEnv, createSupabaseBrowserClient } from '@/data/supabase/client'
import { createSupabaseRepository } from '@/data/supabase/supabase-repository'
import { AuthGate, LocalAuthProvider, SupabaseAuthProvider } from '@/app/auth-context'
import { LoginPage } from '@/features/auth/LoginPage'
import App from './App'
import '@fontsource/source-serif-4/400.css'
import '@fontsource/source-serif-4/600.css'
import '@fontsource/ibm-plex-sans/400.css'
import '@fontsource/ibm-plex-sans/500.css'
import '@fontsource/ibm-plex-sans/600.css'
import '@fontsource/ibm-plex-mono/400.css'
import '@fontsource/ibm-plex-mono/500.css'
import './index.css'

const supabaseEnv = readSupabaseEnv()
const supabaseClient = supabaseEnv === null ? null : createSupabaseBrowserClient(supabaseEnv)
const repository =
  supabaseClient === null ? createIndexedDbRepository() : createSupabaseRepository(supabaseClient)
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 5_000 } },
})

function clearQueryCache(): void {
  queryClient.clear()
}

type DbStatus = 'checking' | 'ready' | 'unavailable'

function DbGate({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<DbStatus>('checking')
  useEffect(() => {
    let cancelled = false
    openDataroomDb()
      .then(() => {
        if (!cancelled) setStatus('ready')
      })
      .catch(() => {
        if (!cancelled) setStatus('unavailable')
      })
    return () => {
      cancelled = true
    }
  }, [])
  if (status === 'checking') return null
  if (status === 'unavailable') {
    return (
      <div className="flex min-h-dvh items-center justify-center px-6">
        <div className="max-w-md text-center">
          <h1 className="font-display text-xl font-semibold">Storage is unavailable</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Docket stores documents in your browser (IndexedDB), which this browser session does
            not allow. Try a regular (non-private) window.
          </p>
        </div>
      </div>
    )
  }
  return <>{children}</>
}

const rootElement = document.getElementById('root')
if (rootElement === null) throw new Error('Root element #root not found')
createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RepositoryProvider repository={repository}>
        <BrowserRouter>
          {supabaseClient === null ? (
            <LocalAuthProvider>
              <DbGate>
                <App />
              </DbGate>
            </LocalAuthProvider>
          ) : (
            <SupabaseAuthProvider client={supabaseClient} onUserChange={clearQueryCache}>
              <AuthGate fallback={<LoginPage />}>
                <App />
              </AuthGate>
            </SupabaseAuthProvider>
          )}
          <Toaster position="bottom-right" />
        </BrowserRouter>
      </RepositoryProvider>
    </QueryClientProvider>
  </StrictMode>,
)

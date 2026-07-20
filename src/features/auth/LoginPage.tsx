import { useState } from 'react'
import { useAuth } from '@/app/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Mode = 'signIn' | 'signUp'

interface AuthError {
  message: string
  /** show an inline shortcut to the other mode next to the error */
  offerSwitch: boolean
}

// Supabase intentionally reports "no such account" and "wrong password" with
// one message (no account enumeration). Keep that property, but explain both
// causes and point to the fix instead of echoing raw API text.
function humanizeAuthError(raw: string, mode: Mode): AuthError {
  const lower = raw.toLowerCase()
  if (mode === 'signIn' && lower.includes('invalid login credentials')) {
    return {
      message: 'Wrong email or password. If you are new here, you need an account first.',
      offerSwitch: true,
    }
  }
  if (mode === 'signUp' && lower.includes('already registered')) {
    return {
      message: 'This email already has an account.',
      offerSwitch: true,
    }
  }
  return { message: raw, offerSwitch: false }
}

export function LoginPage() {
  const auth = useAuth()
  const [mode, setMode] = useState<Mode>('signIn')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<AuthError | null>(null)
  const [pending, setPending] = useState(false)

  function switchMode(next: Mode): void {
    setMode(next)
    setError(null)
  }

  async function submit(event: React.SubmitEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    setPending(true)
    setError(null)
    const run = mode === 'signIn' ? auth.signIn : auth.signUp
    const message = await run(email, password)
    setPending(false)
    if (message !== null) setError(humanizeAuthError(message, mode))
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-baseline gap-2.5">
          <span className="font-display text-2xl font-semibold">Docket</span>
          <span className="rounded-sm border border-primary px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-primary">
            Confidential
          </span>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <h1 className="font-display text-xl font-semibold">
            {mode === 'signIn' ? 'Sign in' : 'Create account'}
          </h1>
          <p className="mt-1 mb-5 text-sm text-muted-foreground">
            {mode === 'signIn'
              ? 'Your data rooms are private to your account.'
              : 'Sign up with an email and a password (6+ characters).'}
          </p>
          <form onSubmit={(event) => void submit(event)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="auth-email">Email</Label>
              <Input
                id="auth-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="auth-password">Password</Label>
              <Input
                id="auth-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'}
                required
                minLength={6}
              />
            </div>
            {error !== null ? (
              <div className="space-y-1">
                <p className="text-sm text-destructive">{error.message}</p>
                {error.offerSwitch ? (
                  <button
                    type="button"
                    className="text-sm font-medium text-primary hover:underline"
                    onClick={() => switchMode(mode === 'signIn' ? 'signUp' : 'signIn')}
                  >
                    {mode === 'signIn' ? 'Create an account instead' : 'Sign in instead'}
                  </button>
                ) : null}
              </div>
            ) : null}
            <Button type="submit" className="w-full" disabled={pending}>
              {mode === 'signIn' ? 'Sign in' : 'Create account'}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            {mode === 'signIn' ? (
              <>
                Need an account?{' '}
                <button
                  type="button"
                  className="font-medium text-primary hover:underline"
                  onClick={() => switchMode('signUp')}
                >
                  Create one
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  className="font-medium text-primary hover:underline"
                  onClick={() => switchMode('signIn')}
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}

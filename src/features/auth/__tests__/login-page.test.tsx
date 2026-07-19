import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils'
import { AuthContext } from '@/app/auth-context'
import type { AuthState } from '@/app/auth-context'
import { LoginPage } from '@/features/auth/LoginPage'

function stubAuth(overrides: Partial<AuthState> = {}): AuthState {
  return {
    status: 'signedOut',
    user: null,
    signIn: vi.fn().mockResolvedValue(null),
    signUp: vi.fn().mockResolvedValue(null),
    signOut: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
}

function renderLogin(auth: AuthState) {
  return renderWithProviders(
    <AuthContext.Provider value={auth}>
      <LoginPage />
    </AuthContext.Provider>,
  )
}

describe('LoginPage', () => {
  it('submits email and password to signIn', async () => {
    const auth = stubAuth()
    renderLogin(auth)
    await userEvent.type(screen.getByLabelText('Email'), 'a@b.co')
    await userEvent.type(screen.getByLabelText('Password'), 'secret123')
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(auth.signIn).toHaveBeenCalledWith('a@b.co', 'secret123')
  })

  it('switches to sign up mode and calls signUp', async () => {
    const auth = stubAuth()
    renderLogin(auth)
    await userEvent.click(screen.getByRole('button', { name: 'Create one' }))
    await userEvent.type(screen.getByLabelText('Email'), 'new@b.co')
    await userEvent.type(screen.getByLabelText('Password'), 'secret123')
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }))
    expect(auth.signUp).toHaveBeenCalledWith('new@b.co', 'secret123')
  })

  it('shows the error message returned by signIn', async () => {
    const auth = stubAuth({ signIn: vi.fn().mockResolvedValue('Invalid login credentials') })
    renderLogin(auth)
    await userEvent.type(screen.getByLabelText('Email'), 'a@b.co')
    await userEvent.type(screen.getByLabelText('Password'), 'wrong')
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(await screen.findByText('Invalid login credentials')).toBeInTheDocument()
  })
})

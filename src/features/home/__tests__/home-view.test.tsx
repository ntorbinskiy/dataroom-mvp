import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils'
import { HomeView } from '@/features/home/HomeView'
import type { HomeViewModel } from '@/features/home/home.port'
import type { Dataroom } from '@/core/types'

function stubVm(overrides: Partial<HomeViewModel> = {}): HomeViewModel {
  const noop = (): void => undefined
  return {
    rooms: [],
    roomMeta: new Map(),
    isLoading: false,
    isError: false,
    retry: noop,
    create: { open: false, pending: false, setOpen: noop, submit: noop },
    rename: { target: null, conflict: false, pending: false, show: noop, close: noop, submit: noop },
    remove: { target: null, description: '', pending: false, show: noop, close: noop, confirm: noop },
    ...overrides,
  }
}

describe('HomeView (pure view over HomeViewModel)', () => {
  it('renders the empty state when there are no rooms', () => {
    renderWithProviders(<HomeView vm={stubVm()} />)
    expect(screen.getByText('No rooms on file')).toBeInTheDocument()
  })

  it('renders room cards with display-ready meta from the contract', () => {
    const room: Dataroom = { id: 'r1', name: 'Project Atlas', createdAt: 1, updatedAt: 2 }
    const vm = stubVm({ rooms: [room], roomMeta: new Map([['r1', '3 files · 12 MB · Jul 12']]) })
    renderWithProviders(<HomeView vm={vm} />)
    expect(screen.getByText('Project Atlas')).toBeInTheDocument()
    expect(screen.getByText('3 files · 12 MB · Jul 12')).toBeInTheDocument()
  })

  it('renders the error state with retry', () => {
    const retry = vi.fn()
    renderWithProviders(<HomeView vm={stubVm({ isError: true, retry })} />)
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })
})

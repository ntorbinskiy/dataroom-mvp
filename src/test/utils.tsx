import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { render } from '@testing-library/react'
import type { RenderResult } from '@testing-library/react'
import { RepositoryProvider } from '@/app/repository-context'
import { LocalAuthProvider } from '@/app/auth-context'
import { createMemoryRepository } from '@/data/memory-repository'
import type { DataroomRepository } from '@/core/repository.port'

interface ProviderRenderOptions {
  initialPath?: string
  repository?: DataroomRepository
}

export function renderWithProviders(
  ui: React.ReactElement,
  { initialPath = '/', repository = createMemoryRepository() }: ProviderRenderOptions = {},
): RenderResult & { repository: DataroomRepository } {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const result = render(
    <QueryClientProvider client={queryClient}>
      <RepositoryProvider repository={repository}>
        <LocalAuthProvider>
          <MemoryRouter initialEntries={[initialPath]}>{ui}</MemoryRouter>
        </LocalAuthProvider>
      </RepositoryProvider>
    </QueryClientProvider>,
  )
  return { ...result, repository }
}

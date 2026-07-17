import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { render } from '@testing-library/react'
import type { RenderResult } from '@testing-library/react'
import { RepositoryProvider } from '@/app/repository-context'
import { createMemoryRepository } from '@/data/memory-repository'
import type { DataroomRepository } from '@/core/repository'

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
        <MemoryRouter initialEntries={[initialPath]}>{ui}</MemoryRouter>
      </RepositoryProvider>
    </QueryClientProvider>,
  )
  return { ...result, repository }
}

import { createContext, useContext } from 'react'
import type { DataroomRepository } from '@/core/repository.port'

const RepositoryContext = createContext<DataroomRepository | null>(null)

export function RepositoryProvider({
  repository,
  children,
}: {
  repository: DataroomRepository
  children: React.ReactNode
}) {
  return <RepositoryContext.Provider value={repository}>{children}</RepositoryContext.Provider>
}

export function useRepository(): DataroomRepository {
  const repository = useContext(RepositoryContext)
  if (repository === null) {
    throw new Error('useRepository must be used inside a RepositoryProvider')
  }
  return repository
}

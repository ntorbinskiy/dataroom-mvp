import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRepository } from '@/app/repository-context'

export function useDatarooms() {
  const repository = useRepository()
  return useQuery({ queryKey: ['datarooms'], queryFn: () => repository.listDatarooms() })
}

export function useDataroom(id: string) {
  const repository = useRepository()
  return useQuery({ queryKey: ['dataroom', id], queryFn: () => repository.getDataroom(id) })
}

export function useDataroomStats(id: string) {
  const repository = useRepository()
  return useQuery({
    queryKey: ['dataroom-stats', id],
    queryFn: () => repository.getDataroomStats(id),
  })
}

function useInvalidateRooms() {
  const queryClient = useQueryClient()
  return async () => {
    await queryClient.invalidateQueries({ queryKey: ['datarooms'] })
    await queryClient.invalidateQueries({ queryKey: ['dataroom'] })
    await queryClient.invalidateQueries({ queryKey: ['dataroom-stats'] })
  }
}

export function useCreateDataroom() {
  const repository = useRepository()
  const invalidate = useInvalidateRooms()
  return useMutation({
    mutationFn: (input: { name: string }) => repository.createDataroom(input.name),
    onSuccess: invalidate,
  })
}

export function useRenameDataroom() {
  const repository = useRepository()
  const invalidate = useInvalidateRooms()
  return useMutation({
    mutationFn: (input: { id: string; name: string }) =>
      repository.renameDataroom(input.id, input.name),
    onSuccess: invalidate,
  })
}

export function useDeleteDataroom() {
  const repository = useRepository()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { id: string }) => repository.deleteDataroom(input.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries()
    },
  })
}

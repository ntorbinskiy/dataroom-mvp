import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRepository } from '@/app/repository-context'
import type { NodeId } from '@/core/types'

export function useChildren(dataroomId: string, parentId: NodeId | null) {
  const repository = useRepository()
  return useQuery({
    queryKey: ['children', dataroomId, parentId],
    queryFn: () => repository.listChildren(dataroomId, parentId),
  })
}

export function useRoomNodes(dataroomId: string, enabled: boolean) {
  const repository = useRepository()
  return useQuery({
    queryKey: ['children', dataroomId, 'all-nodes'],
    queryFn: () => repository.listAllNodes(dataroomId),
    enabled,
  })
}

export function useNode(id: NodeId) {
  const repository = useRepository()
  return useQuery({ queryKey: ['node', id], queryFn: () => repository.getNode(id) })
}

export function usePath(id: NodeId | null) {
  const repository = useRepository()
  return useQuery({
    queryKey: ['path', id],
    queryFn: () => (id === null ? Promise.resolve([]) : repository.getPath(id)),
  })
}

export function useFileBlob(blobKey: string) {
  const repository = useRepository()
  return useQuery({
    queryKey: ['blob', blobKey],
    queryFn: () => repository.getFileBlob(blobKey),
    enabled: blobKey !== '',
  })
}

function useInvalidateNodes() {
  const queryClient = useQueryClient()
  return async () => {
    await queryClient.invalidateQueries({ queryKey: ['children'] })
    await queryClient.invalidateQueries({ queryKey: ['node'] })
    await queryClient.invalidateQueries({ queryKey: ['path'] })
    await queryClient.invalidateQueries({ queryKey: ['dataroom-stats'] })
    await queryClient.invalidateQueries({ queryKey: ['datarooms'] })
  }
}

export function useCreateFolder() {
  const repository = useRepository()
  const invalidate = useInvalidateNodes()
  return useMutation({
    mutationFn: (input: { dataroomId: string; parentId: NodeId | null; name: string }) =>
      repository.createFolder(input.dataroomId, input.parentId, input.name),
    onSuccess: invalidate,
  })
}

export function useUploadFiles() {
  const repository = useRepository()
  const invalidate = useInvalidateNodes()
  return useMutation({
    mutationFn: (input: { dataroomId: string; parentId: NodeId | null; files: File[] }) =>
      repository.uploadFiles(input.dataroomId, input.parentId, input.files),
    onSuccess: invalidate,
  })
}

export function useRenameNode() {
  const repository = useRepository()
  const invalidate = useInvalidateNodes()
  return useMutation({
    mutationFn: (input: { id: NodeId; name: string }) => repository.renameNode(input.id, input.name),
    onSuccess: invalidate,
  })
}

export function useDeleteNode() {
  const repository = useRepository()
  const invalidate = useInvalidateNodes()
  return useMutation({
    mutationFn: (input: { id: NodeId }) => repository.deleteNode(input.id),
    onSuccess: invalidate,
  })
}

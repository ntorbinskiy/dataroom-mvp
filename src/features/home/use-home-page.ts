import { useState } from 'react'
import { toast } from 'sonner'
import { useQuery } from '@tanstack/react-query'
import { useRepository } from '@/app/repository-context'
import {
  useCreateDataroom,
  useDatarooms,
  useDeleteDataroom,
  useRenameDataroom,
} from '@/hooks/use-datarooms'
import { NameConflictError } from '@/core/repository.port'
import { formatBytes, formatCount, formatDate } from '@/core/format'
import type { Dataroom } from '@/core/types'
import type { HomeViewPort } from '@/features/home/home.port'

export function useHomePage(): HomeViewPort {
  const repository = useRepository()
  const rooms = useDatarooms()
  const createRoom = useCreateDataroom()
  const renameRoom = useRenameDataroom()
  const deleteRoom = useDeleteDataroom()

  const [createOpen, setCreateOpen] = useState(false)
  const [renameTarget, setRenameTarget] = useState<Dataroom | null>(null)
  const [renameConflict, setRenameConflict] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Dataroom | null>(null)

  const roomIds = (rooms.data ?? []).map((room) => room.id)
  const meta = useQuery({
    queryKey: ['dataroom-stats', 'meta', roomIds],
    queryFn: async () => {
      const entries = await Promise.all(
        (rooms.data ?? []).map(async (room): Promise<[string, string]> => {
          const stats = await repository.getDataroomStats(room.id)
          const line = `${formatCount(stats.fileCount, 'file')} · ${formatBytes(stats.totalSize)} · ${formatDate(room.updatedAt)}`
          return [room.id, line]
        }),
      )
      return new Map(entries)
    },
    enabled: rooms.data !== undefined,
  })

  const deleteContents = useQuery({
    queryKey: ['room-contents', deleteTarget?.id],
    queryFn: () => {
      if (deleteTarget === null) return Promise.resolve({ folders: 0, files: 0 })
      return repository.countDataroomContents(deleteTarget.id)
    },
    enabled: deleteTarget !== null,
  })

  function describeDelete(): string {
    const counts = deleteContents.data
    if (counts === undefined) return 'Counting contents…'
    if (counts.folders === 0 && counts.files === 0) return 'This data room is empty.'
    return `This will permanently delete ${formatCount(counts.folders, 'folder')} and ${formatCount(counts.files, 'file')}.`
  }

  return {
    rooms: rooms.data,
    roomMeta: meta.data ?? new Map(),
    isLoading: rooms.isPending,
    isError: rooms.isError,
    retry: () => {
      void rooms.refetch()
    },
    create: {
      open: createOpen,
      pending: createRoom.isPending,
      setOpen: setCreateOpen,
      submit: (name) => {
        createRoom.mutate(
          { name },
          {
            onSuccess: (room) => {
              setCreateOpen(false)
              toast.success(`Created "${room.name}"`)
            },
            onError: () => toast.error('Could not create the data room'),
          },
        )
      },
    },
    rename: {
      target: renameTarget,
      conflict: renameConflict,
      pending: renameRoom.isPending,
      show: (room) => {
        setRenameConflict(false)
        setRenameTarget(room)
      },
      close: () => setRenameTarget(null),
      submit: (name) => {
        if (renameTarget === null) return
        setRenameConflict(false)
        renameRoom.mutate(
          { id: renameTarget.id, name },
          {
            onSuccess: () => setRenameTarget(null),
            onError: (error) => {
              if (error instanceof NameConflictError) setRenameConflict(true)
              else toast.error('Could not rename the data room')
            },
          },
        )
      },
    },
    remove: {
      target: deleteTarget,
      description: describeDelete(),
      pending: deleteRoom.isPending,
      show: (room) => setDeleteTarget(room),
      close: () => setDeleteTarget(null),
      confirm: () => {
        if (deleteTarget === null) return
        deleteRoom.mutate(
          { id: deleteTarget.id },
          {
            onSuccess: () => {
              setDeleteTarget(null)
              toast.success('Data room deleted')
            },
            onError: () => toast.error('Could not delete the data room'),
          },
        )
      },
    },
  }
}

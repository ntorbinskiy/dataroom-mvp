import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { useDeleteNode, useFileBlob, useNode, useRenameNode } from '@/hooks/use-nodes'
import { NameConflictError } from '@/core/repository.port'
import { formatBytes } from '@/core/format'
import { isFileNode } from '@/core/types'
import type { FileViewerViewModel } from '@/features/file-viewer/file-viewer.port'

export function useFileViewerViewModel(): FileViewerViewModel {
  const params = useParams()
  const navigate = useNavigate()
  const dataroomId = params.dataroomId ?? ''
  const fileId = params.fileId ?? ''

  const node = useNode(fileId)
  const file =
    node.data !== undefined && node.data !== null && isFileNode(node.data) ? node.data : null
  const blob = useFileBlob(file?.blobKey ?? '')

  const [objectUrl, setObjectUrl] = useState<string | null>(null)

  useEffect(() => {
    if (blob.data === undefined || blob.data === null) {
      setObjectUrl(null)
      return
    }
    const url = URL.createObjectURL(blob.data)
    setObjectUrl(url)
    return () => {
      URL.revokeObjectURL(url)
      setObjectUrl(null)
    }
  }, [blob.data])

  const [renameOpen, setRenameOpen] = useState(false)
  const [renameConflict, setRenameConflict] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const renameNode = useRenameNode()
  const deleteNode = useDeleteNode()

  const parentPath =
    file === null || file.parentId === null
      ? `/d/${dataroomId}`
      : `/d/${dataroomId}/folder/${file.parentId}`

  return {
    notFound: node.data === null || (node.data !== undefined && !isFileNode(node.data)),
    isLoading: node.isPending || (file !== null && blob.isPending),
    file,
    sizeLabel: file !== null ? formatBytes(file.size) : null,
    objectUrl,
    blobMissing: file !== null && blob.data === null,
    parentPath,
    rename: {
      open: renameOpen,
      conflict: renameConflict,
      pending: renameNode.isPending,
      setOpen: (open) => {
        setRenameConflict(false)
        setRenameOpen(open)
      },
      submit: (name) => {
        if (file === null) return
        setRenameConflict(false)
        renameNode.mutate(
          { id: file.id, name },
          {
            onSuccess: () => setRenameOpen(false),
            onError: (error) => {
              if (error instanceof NameConflictError) setRenameConflict(true)
              else toast.error('Could not rename')
            },
          },
        )
      },
    },
    remove: {
      open: deleteOpen,
      pending: deleteNode.isPending,
      setOpen: setDeleteOpen,
      confirm: () => {
        if (file === null) return
        deleteNode.mutate(
          { id: file.id },
          {
            onSuccess: () => {
              toast.success('File deleted')
              void navigate(parentPath)
            },
            onError: () => toast.error('Could not delete'),
          },
        )
      },
    },
  }
}

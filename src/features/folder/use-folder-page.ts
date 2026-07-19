import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { useQuery } from '@tanstack/react-query'
import { useRepository } from '@/app/repository-context'
import { useDataroom } from '@/hooks/use-datarooms'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import {
  useChildren,
  useCreateFolder,
  useDeleteNode,
  usePath,
  useRenameNode,
  useRoomNodes,
  useUploadFiles,
} from '@/hooks/use-nodes'
import { NameConflictError } from '@/core/repository.port'
import { buildPathMap, countDirectChildren, filterByName, splitMatch } from '@/core/search'
import { describeRejection, partitionUploadFiles } from '@/core/upload'
import { formatBytes, formatCount } from '@/core/format'
import { isFileNode, isFolderNode } from '@/core/types'
import type { DataroomNode, NodeId } from '@/core/types'
import { buildCrumbs } from '@/features/folder/crumbs'
import type { FolderViewProps, SearchResult } from '@/features/folder/folder.port'

export function useFolderPage(): FolderViewProps {
  const params = useParams()
  const navigate = useNavigate()
  const repository = useRepository()
  const dataroomId = params.dataroomId ?? ''
  const folderId = params.folderId ?? null

  const room = useDataroom(dataroomId)
  const path = usePath(folderId)
  const children = useChildren(dataroomId, folderId)
  const createFolder = useCreateFolder()
  const uploadFiles = useUploadFiles()
  const renameNode = useRenameNode()
  const deleteNode = useDeleteNode()

  const [createOpen, setCreateOpen] = useState(false)
  const [renameTarget, setRenameTarget] = useState<DataroomNode | null>(null)
  const [renameConflict, setRenameConflict] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<DataroomNode | null>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const debouncedQuery = useDebouncedValue(searchQuery)
  const searchActive = debouncedQuery.trim() !== ''
  const roomNodes = useRoomNodes(dataroomId, searchActive)

  const searchResults = useMemo<SearchResult[]>(() => {
    if (!searchActive || roomNodes.data === undefined) return []
    const matched = filterByName(roomNodes.data, debouncedQuery)
    const paths = buildPathMap(roomNodes.data)
    const counts = countDirectChildren(roomNodes.data)
    return matched.map((node) => ({
      node,
      path: paths.get(node.id) ?? '',
      match: splitMatch(node.name, debouncedQuery),
      meta: isFileNode(node)
        ? formatBytes(node.size)
        : formatCount(counts.get(node.id) ?? 0, 'item'),
    }))
  }, [searchActive, roomNodes.data, debouncedQuery])

  const childCounts = useQuery({
    queryKey: ['children', dataroomId, folderId, 'counts'],
    queryFn: async () => {
      const current = await repository.listChildren(dataroomId, folderId)
      const entries = await Promise.all(
        current.filter(isFolderNode).map(async (folder): Promise<[NodeId, number]> => {
          const kids = await repository.listChildren(dataroomId, folder.id)
          return [folder.id, kids.length]
        }),
      )
      return new Map(entries)
    },
  })

  const deleteCounts = useQuery({
    queryKey: ['subtree', deleteTarget?.id],
    queryFn: () => {
      if (deleteTarget === null) return Promise.resolve({ folders: 0, files: 0 })
      return repository.countSubtree(deleteTarget.id)
    },
    enabled: deleteTarget !== null && deleteTarget.type === 'folder',
  })

  const notFound =
    room.data === null ||
    (folderId !== null && path.data !== undefined && path.data.length === 0)

  const currentFolder = path.data?.at(-1)
  const title = folderId === null ? (room.data?.name ?? '') : (currentFolder?.name ?? '')
  const folderChildren = children.data?.filter(isFolderNode) ?? []
  const fileChildren = children.data?.filter(isFileNode) ?? []
  const directSize = fileChildren.reduce((sum, file) => sum + file.size, 0)

  function describeDelete(): string {
    if (deleteTarget !== null && isFileNode(deleteTarget)) {
      return 'This will permanently delete this file.'
    }
    const counts = deleteCounts.data
    if (counts === undefined) return 'Counting contents…'
    if (counts.folders === 0 && counts.files === 0) return 'This folder is empty.'
    return `This will permanently delete ${formatCount(counts.folders, 'folder')} and ${formatCount(counts.files, 'file')}.`
  }

  function openNode(node: DataroomNode): void {
    if (node.type === 'folder') void navigate(`/d/${dataroomId}/folder/${node.id}`)
    else void navigate(`/d/${dataroomId}/file/${node.id}`)
  }

  return {
    notFound,
    title,
    crumbs:
      room.data !== undefined && room.data !== null && path.data !== undefined
        ? buildCrumbs(dataroomId, room.data.name, path.data)
        : null,
    summary: searchActive
      ? formatCount(searchResults.length, 'result')
      : children.data !== undefined
        ? `${formatCount(folderChildren.length, 'folder')} · ${formatCount(fileChildren.length, 'file')} · ${formatBytes(directSize)}`
        : null,
    nodes: children.data,
    childCounts: childCounts.data ?? new Map(),
    isLoading: children.isPending,
    isError: children.isError,
    retry: () => {
      void children.refetch()
    },
    uploadPending: uploadFiles.isPending,
    openNode,
    upload: (rawFiles) => {
      const { accepted, rejected } = partitionUploadFiles(rawFiles)
      for (const rejection of rejected) toast.error(describeRejection(rejection))
      if (accepted.length === 0) return
      uploadFiles.mutate(
        { dataroomId, parentId: folderId, files: accepted },
        {
          onSuccess: (nodes) =>
            toast.success(
              nodes.length === 1
                ? `Uploaded "${nodes[0]?.name ?? ''}"`
                : `Uploaded ${nodes.length} files`,
            ),
          onError: () => toast.error('Upload failed'),
        },
      )
    },
    createFolder: {
      open: createOpen,
      pending: createFolder.isPending,
      setOpen: setCreateOpen,
      submit: (name) => {
        createFolder.mutate(
          { dataroomId, parentId: folderId, name },
          {
            onSuccess: (folder) => {
              setCreateOpen(false)
              toast.success(`Created "${folder.name}"`)
            },
            onError: () => toast.error('Could not create the folder'),
          },
        )
      },
    },
    rename: {
      target: renameTarget,
      isFile: renameTarget !== null && isFileNode(renameTarget),
      conflict: renameConflict,
      pending: renameNode.isPending,
      show: (node) => {
        setRenameConflict(false)
        setRenameTarget(node)
      },
      close: () => setRenameTarget(null),
      submit: (name) => {
        if (renameTarget === null) return
        setRenameConflict(false)
        renameNode.mutate(
          { id: renameTarget.id, name },
          {
            onSuccess: () => setRenameTarget(null),
            onError: (error) => {
              if (error instanceof NameConflictError) setRenameConflict(true)
              else toast.error('Could not rename')
            },
          },
        )
      },
    },
    remove: {
      target: deleteTarget,
      description: describeDelete(),
      pending: deleteNode.isPending,
      show: (node) => setDeleteTarget(node),
      close: () => setDeleteTarget(null),
      confirm: () => {
        if (deleteTarget === null) return
        deleteNode.mutate(
          { id: deleteTarget.id },
          {
            onSuccess: () => {
              setDeleteTarget(null)
              toast.success('Deleted')
            },
            onError: () => toast.error('Could not delete'),
          },
        )
      },
    },
    search: {
      query: searchQuery,
      setQuery: setSearchQuery,
      active: searchActive,
      isLoading: searchActive && roomNodes.isPending,
      results: searchResults,
      open: (node) => {
        setSearchQuery('')
        openNode(node)
      },
    },
  }
}

import type { DataroomNode, NodeId } from '@/core/types'
import type { Crumb } from '@/features/folder/crumbs'
import type { DialogFlow, RemoveFlow, TargetDialogFlow } from '@/features/shared/flows.port'

export interface FolderViewProps {
  notFound: boolean
  title: string
  crumbs: Crumb[] | null
  /** "2 folders · 3 files · 341 MB" or null while loading */
  summary: string | null
  nodes: DataroomNode[] | undefined
  childCounts: ReadonlyMap<NodeId, number>
  isLoading: boolean
  isError: boolean
  retry: () => void
  uploadPending: boolean
  openNode: (node: DataroomNode) => void
  upload: (files: File[]) => void
  createFolder: DialogFlow
  rename: TargetDialogFlow<DataroomNode> & { isFile: boolean }
  remove: RemoveFlow<DataroomNode>
}

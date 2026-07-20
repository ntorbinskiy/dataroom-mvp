import type { DataroomNode, NodeId } from '@/core/types'
import type { MatchSegments } from '@/core/search'
import type { Crumb } from '@/features/folder/crumbs'
import type { DialogFlow, RemoveFlow, TargetDialogFlow } from '@/features/shared/flows.port'

export interface SearchResult {
  node: DataroomNode
  /** ancestor path, e.g. "Legal / NDAs"; empty string for root-level nodes */
  path: string
  match: MatchSegments | null
  /** display-ready right-hand text: file size or "N items" */
  meta: string
}

export interface FolderSearch {
  query: string
  setQuery: (query: string) => void
  /** true once the debounced query is non-blank; view swaps table for results */
  active: boolean
  isLoading: boolean
  results: SearchResult[]
  open: (node: DataroomNode) => void
}

export interface FolderViewPort {
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
  search: FolderSearch
}

export interface FolderViewProps {
  page: FolderViewPort
}

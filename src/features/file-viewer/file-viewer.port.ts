import type { FileNode } from '@/core/types'

export interface FileViewerViewProps {
  notFound: boolean
  isLoading: boolean
  file: FileNode | null
  /** display-ready size, e.g. "2.4 MB" */
  sizeLabel: string | null
  objectUrl: string | null
  blobMissing: boolean
  /** route of the parent folder (back link + after-delete navigation) */
  parentPath: string
  rename: {
    open: boolean
    conflict: boolean
    pending: boolean
    setOpen: (open: boolean) => void
    submit: (name: string) => void
  }
  remove: {
    open: boolean
    pending: boolean
    setOpen: (open: boolean) => void
    confirm: () => void
  }
}

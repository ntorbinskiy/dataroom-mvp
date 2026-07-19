import type { Dataroom, DataroomNode, FileNode, FolderNode, NodeId } from './types'

export class NameConflictError extends Error {
  constructor() {
    super('Name already taken')
    this.name = 'NameConflictError'
  }
}

export interface DataroomStats {
  fileCount: number
  totalSize: number
}

export interface ContentCounts {
  folders: number
  files: number
}

export interface DataroomRepository {
  listDatarooms(): Promise<Dataroom[]>
  getDataroom(id: string): Promise<Dataroom | null>
  createDataroom(name: string): Promise<Dataroom>
  renameDataroom(id: string, name: string): Promise<Dataroom>
  deleteDataroom(id: string): Promise<void>
  getDataroomStats(id: string): Promise<DataroomStats>
  countDataroomContents(id: string): Promise<ContentCounts>

  listChildren(dataroomId: string, parentId: NodeId | null): Promise<DataroomNode[]>
  listAllNodes(dataroomId: string): Promise<DataroomNode[]>
  getNode(id: NodeId): Promise<DataroomNode | null>
  getPath(id: NodeId): Promise<DataroomNode[]>
  createFolder(dataroomId: string, parentId: NodeId | null, name: string): Promise<FolderNode>
  uploadFiles(dataroomId: string, parentId: NodeId | null, files: readonly File[]): Promise<FileNode[]>
  getFileBlob(blobKey: string): Promise<Blob | null>
  renameNode(id: NodeId, newName: string): Promise<DataroomNode>
  countSubtree(id: NodeId): Promise<ContentCounts>
  deleteNode(id: NodeId): Promise<void>
}

export interface Dataroom {
  id: string
  name: string
  createdAt: number
  updatedAt: number
}

export type NodeId = string

interface BaseNode {
  id: NodeId
  dataroomId: string
  parentId: NodeId | null
  name: string
  createdAt: number
  updatedAt: number
}

export interface FolderNode extends BaseNode {
  type: 'folder'
}

export interface FileNode extends BaseNode {
  type: 'file'
  mimeType: 'application/pdf'
  size: number
  blobKey: string
}

export type DataroomNode = FolderNode | FileNode

export function isFolderNode(node: DataroomNode): node is FolderNode {
  return node.type === 'folder'
}

export function isFileNode(node: DataroomNode): node is FileNode {
  return node.type === 'file'
}

import { isNameTaken, resolveUniqueName } from '@/core/naming'
import { compareSiblings } from '@/core/ordering'
import { NameConflictError } from '@/core/repository.port'
import type { DataroomRepository } from '@/core/repository.port'
import { isFileNode } from '@/core/types'
import type { Dataroom, DataroomNode, FileNode, FolderNode, NodeId } from '@/core/types'

export function createMemoryRepository(): DataroomRepository {
  const rooms = new Map<string, Dataroom>()
  const nodes = new Map<string, DataroomNode>()
  const blobs = new Map<string, Blob>()

  function roomNodes(dataroomId: string): DataroomNode[] {
    return [...nodes.values()].filter((n) => n.dataroomId === dataroomId)
  }

  function siblingNames(dataroomId: string, parentId: NodeId | null): string[] {
    return roomNodes(dataroomId)
      .filter((n) => n.parentId === parentId)
      .map((n) => n.name)
  }

  function touch(dataroomId: string): void {
    const room = rooms.get(dataroomId)
    if (room !== undefined) rooms.set(dataroomId, { ...room, updatedAt: Date.now() })
  }

  function subtree(id: NodeId): DataroomNode[] {
    const root = nodes.get(id)
    if (root === undefined) return []
    const result: DataroomNode[] = []
    const queue: DataroomNode[] = [root]
    while (queue.length > 0) {
      const current = queue.shift()
      if (current === undefined) break
      result.push(current)
      for (const node of nodes.values()) {
        if (node.parentId === current.id) queue.push(node)
      }
    }
    return result
  }

  return {
    async listDatarooms() {
      return [...rooms.values()].sort((a, b) => b.updatedAt - a.updatedAt)
    },

    async getDataroom(id) {
      return rooms.get(id) ?? null
    },

    async createDataroom(name) {
      const taken = [...rooms.values()].map((r) => r.name)
      const timestamp = Date.now()
      const room: Dataroom = {
        id: crypto.randomUUID(),
        name: resolveUniqueName(name, taken),
        createdAt: timestamp,
        updatedAt: timestamp,
      }
      rooms.set(room.id, room)
      return room
    },

    async renameDataroom(id, name) {
      const room = rooms.get(id)
      if (room === undefined) throw new Error('Data room not found')
      const siblings = [...rooms.values()].filter((r) => r.id !== id).map((r) => r.name)
      if (isNameTaken(name, siblings)) throw new NameConflictError()
      const updated: Dataroom = { ...room, name, updatedAt: Date.now() }
      rooms.set(id, updated)
      return updated
    },

    async deleteDataroom(id) {
      for (const node of roomNodes(id)) {
        nodes.delete(node.id)
        if (isFileNode(node)) blobs.delete(node.blobKey)
      }
      rooms.delete(id)
    },

    async getDataroomStats(id) {
      let fileCount = 0
      let totalSize = 0
      for (const node of roomNodes(id)) {
        if (isFileNode(node)) {
          fileCount += 1
          totalSize += node.size
        }
      }
      return { fileCount, totalSize }
    },

    async countDataroomContents(id) {
      let folders = 0
      let files = 0
      for (const node of roomNodes(id)) {
        if (node.type === 'folder') folders += 1
        else files += 1
      }
      return { folders, files }
    },

    async listChildren(dataroomId, parentId) {
      return roomNodes(dataroomId)
        .filter((n) => n.parentId === parentId)
        .sort(compareSiblings)
    },

    async getNode(id) {
      return nodes.get(id) ?? null
    },

    async getPath(id) {
      const path: DataroomNode[] = []
      let currentId: NodeId | null = id
      while (currentId !== null) {
        const node = nodes.get(currentId)
        if (node === undefined) break
        path.unshift(node)
        currentId = node.parentId
      }
      return path
    },

    async createFolder(dataroomId, parentId, name) {
      const timestamp = Date.now()
      const folder: FolderNode = {
        id: crypto.randomUUID(),
        dataroomId,
        parentId,
        type: 'folder',
        name: resolveUniqueName(name, siblingNames(dataroomId, parentId)),
        createdAt: timestamp,
        updatedAt: timestamp,
      }
      nodes.set(folder.id, folder)
      touch(dataroomId)
      return folder
    },

    async uploadFiles(dataroomId, parentId, files) {
      const taken = siblingNames(dataroomId, parentId)
      const created: FileNode[] = []
      for (const file of files) {
        const unique = resolveUniqueName(file.name, taken)
        taken.push(unique)
        const timestamp = Date.now()
        const node: FileNode = {
          id: crypto.randomUUID(),
          dataroomId,
          parentId,
          type: 'file',
          name: unique,
          mimeType: 'application/pdf',
          size: file.size,
          blobKey: crypto.randomUUID(),
          createdAt: timestamp,
          updatedAt: timestamp,
        }
        nodes.set(node.id, node)
        blobs.set(node.blobKey, new Blob([file], { type: 'application/pdf' }))
        created.push(node)
      }
      touch(dataroomId)
      return created
    },

    async getFileBlob(blobKey) {
      return blobs.get(blobKey) ?? null
    },

    async renameNode(id, newName) {
      const node = nodes.get(id)
      if (node === undefined) throw new Error('Item not found')
      const siblings = roomNodes(node.dataroomId)
        .filter((n) => n.parentId === node.parentId && n.id !== id)
        .map((n) => n.name)
      if (isNameTaken(newName, siblings)) throw new NameConflictError()
      const updated: DataroomNode = { ...node, name: newName, updatedAt: Date.now() }
      nodes.set(id, updated)
      touch(node.dataroomId)
      return updated
    },

    async countSubtree(id) {
      let folders = 0
      let files = 0
      for (const node of subtree(id).slice(1)) {
        if (node.type === 'folder') folders += 1
        else files += 1
      }
      return { folders, files }
    },

    async deleteNode(id) {
      const toDelete = subtree(id)
      const first = toDelete[0]
      if (first === undefined) return
      for (const node of toDelete) {
        nodes.delete(node.id)
        if (isFileNode(node)) blobs.delete(node.blobKey)
      }
      touch(first.dataroomId)
    },
  }
}

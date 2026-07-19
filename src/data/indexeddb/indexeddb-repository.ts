import { openDataroomDb } from './db'
import type { DataroomDB } from './db'
import { isNameTaken, resolveUniqueName } from '@/core/naming'
import { compareSiblings } from '@/core/ordering'
import { NameConflictError } from '@/core/repository.port'
import type { DataroomRepository } from '@/core/repository.port'
import { isFileNode } from '@/core/types'
import type { Dataroom, DataroomNode, FileNode, FolderNode, NodeId } from '@/core/types'

export function createIndexedDbRepository(): DataroomRepository {
  let dbPromise: Promise<DataroomDB> | null = null

  function db(): Promise<DataroomDB> {
    dbPromise ??= openDataroomDb()
    return dbPromise
  }

  async function roomNodes(dataroomId: string): Promise<DataroomNode[]> {
    return (await db()).getAllFromIndex('nodes', 'byDataroom', dataroomId)
  }

  async function siblingNames(dataroomId: string, parentId: NodeId | null): Promise<string[]> {
    const nodes = await roomNodes(dataroomId)
    return nodes.filter((n) => n.parentId === parentId).map((n) => n.name)
  }

  async function touch(dataroomId: string): Promise<void> {
    const database = await db()
    const room = await database.get('datarooms', dataroomId)
    if (room === undefined) return
    await database.put('datarooms', { ...room, updatedAt: Date.now() })
  }

  async function getNodeOrNull(id: NodeId): Promise<DataroomNode | null> {
    return (await (await db()).get('nodes', id)) ?? null
  }

  async function collectSubtree(id: NodeId): Promise<DataroomNode[]> {
    const root = await getNodeOrNull(id)
    if (root === null) return []
    const all = await roomNodes(root.dataroomId)
    const childrenByParent = new Map<NodeId, DataroomNode[]>()
    for (const node of all) {
      if (node.parentId === null) continue
      const list = childrenByParent.get(node.parentId) ?? []
      list.push(node)
      childrenByParent.set(node.parentId, list)
    }
    const result: DataroomNode[] = []
    const queue: DataroomNode[] = [root]
    while (queue.length > 0) {
      const current = queue.shift()
      if (current === undefined) break
      result.push(current)
      queue.push(...(childrenByParent.get(current.id) ?? []))
    }
    return result
  }

  return {
    async listDatarooms() {
      const rooms = await (await db()).getAll('datarooms')
      return rooms.sort((a, b) => b.updatedAt - a.updatedAt)
    },

    async getDataroom(id) {
      return (await (await db()).get('datarooms', id)) ?? null
    },

    async createDataroom(name) {
      const database = await db()
      const existing = await database.getAll('datarooms')
      const timestamp = Date.now()
      const room: Dataroom = {
        id: crypto.randomUUID(),
        name: resolveUniqueName(name, existing.map((r) => r.name)),
        createdAt: timestamp,
        updatedAt: timestamp,
      }
      await database.put('datarooms', room)
      return room
    },

    async renameDataroom(id, name) {
      const database = await db()
      const room = await database.get('datarooms', id)
      if (room === undefined) throw new Error('Data room not found')
      const siblings = (await database.getAll('datarooms'))
        .filter((r) => r.id !== id)
        .map((r) => r.name)
      if (isNameTaken(name, siblings)) throw new NameConflictError()
      const updated: Dataroom = { ...room, name, updatedAt: Date.now() }
      await database.put('datarooms', updated)
      return updated
    },

    async deleteDataroom(id) {
      const database = await db()
      const nodes = await roomNodes(id)
      const tx = database.transaction(['datarooms', 'nodes', 'blobs'], 'readwrite')
      const deletions: Promise<unknown>[] = [tx.objectStore('datarooms').delete(id)]
      for (const node of nodes) {
        deletions.push(tx.objectStore('nodes').delete(node.id))
        if (isFileNode(node)) deletions.push(tx.objectStore('blobs').delete(node.blobKey))
      }
      await Promise.all(deletions)
      await tx.done
    },

    async getDataroomStats(id) {
      let fileCount = 0
      let totalSize = 0
      for (const node of await roomNodes(id)) {
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
      for (const node of await roomNodes(id)) {
        if (node.type === 'folder') folders += 1
        else files += 1
      }
      return { folders, files }
    },

    async listChildren(dataroomId, parentId) {
      const nodes = await roomNodes(dataroomId)
      return nodes.filter((n) => n.parentId === parentId).sort(compareSiblings)
    },

    async listAllNodes(dataroomId) {
      return roomNodes(dataroomId)
    },

    async getNode(id) {
      return getNodeOrNull(id)
    },

    async getPath(id) {
      const path: DataroomNode[] = []
      let currentId: NodeId | null = id
      while (currentId !== null) {
        const node: DataroomNode | null = await getNodeOrNull(currentId)
        if (node === null) break
        path.unshift(node)
        currentId = node.parentId
      }
      return path
    },

    async createFolder(dataroomId, parentId, name) {
      const database = await db()
      const timestamp = Date.now()
      const folder: FolderNode = {
        id: crypto.randomUUID(),
        dataroomId,
        parentId,
        type: 'folder',
        name: resolveUniqueName(name, await siblingNames(dataroomId, parentId)),
        createdAt: timestamp,
        updatedAt: timestamp,
      }
      await database.put('nodes', folder)
      await touch(dataroomId)
      return folder
    },

    async uploadFiles(dataroomId, parentId, files) {
      const database = await db()
      const taken = await siblingNames(dataroomId, parentId)
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
        const tx = database.transaction(['nodes', 'blobs'], 'readwrite')
        await Promise.all([
          tx.objectStore('nodes').put(node),
          tx.objectStore('blobs').put(new Blob([file], { type: 'application/pdf' }), node.blobKey),
        ])
        await tx.done
        created.push(node)
      }
      await touch(dataroomId)
      return created
    },

    async getFileBlob(blobKey) {
      return (await (await db()).get('blobs', blobKey)) ?? null
    },

    async renameNode(id, newName) {
      const database = await db()
      const node = await database.get('nodes', id)
      if (node === undefined) throw new Error('Item not found')
      const siblings = (await roomNodes(node.dataroomId))
        .filter((n) => n.parentId === node.parentId && n.id !== id)
        .map((n) => n.name)
      if (isNameTaken(newName, siblings)) throw new NameConflictError()
      const updated: DataroomNode = { ...node, name: newName, updatedAt: Date.now() }
      await database.put('nodes', updated)
      await touch(node.dataroomId)
      return updated
    },

    async countSubtree(id) {
      let folders = 0
      let files = 0
      for (const node of (await collectSubtree(id)).slice(1)) {
        if (node.type === 'folder') folders += 1
        else files += 1
      }
      return { folders, files }
    },

    async deleteNode(id) {
      const database = await db()
      const subtree = await collectSubtree(id)
      const first = subtree[0]
      if (first === undefined) return
      const tx = database.transaction(['nodes', 'blobs'], 'readwrite')
      const deletions: Promise<unknown>[] = []
      for (const node of subtree) {
        deletions.push(tx.objectStore('nodes').delete(node.id))
        if (isFileNode(node)) deletions.push(tx.objectStore('blobs').delete(node.blobKey))
      }
      await Promise.all(deletions)
      await tx.done
      await touch(first.dataroomId)
    },
  }
}

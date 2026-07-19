import type { SupabaseClient } from '@supabase/supabase-js'
import { isNameTaken, resolveUniqueName } from '@/core/naming'
import { compareSiblings } from '@/core/ordering'
import { NameConflictError } from '@/core/repository.port'
import type { DataroomRepository } from '@/core/repository.port'
import { isFileNode } from '@/core/types'
import type { Dataroom, DataroomNode, FileNode, FolderNode, NodeId } from '@/core/types'

interface DataroomRow {
  id: string
  name: string
  created_at: string
  updated_at: string
}

interface NodeRow {
  id: string
  dataroom_id: string
  parent_id: string | null
  type: string
  name: string
  size: number | null
  blob_key: string | null
  created_at: string
  updated_at: string
}

// Postgres rejects non-uuid strings in uuid columns with a syntax error, while
// the other adapters simply find nothing. Guard lookups so unknown ids of any
// shape behave the same across adapters: not found -> null.
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value)
}

function toDataroom(row: DataroomRow): Dataroom {
  return {
    id: row.id,
    name: row.name,
    createdAt: Date.parse(row.created_at),
    updatedAt: Date.parse(row.updated_at),
  }
}

function toNode(row: NodeRow): DataroomNode {
  const base = {
    id: row.id,
    dataroomId: row.dataroom_id,
    parentId: row.parent_id,
    name: row.name,
    createdAt: Date.parse(row.created_at),
    updatedAt: Date.parse(row.updated_at),
  }
  if (row.type === 'folder') {
    const folder: FolderNode = { ...base, type: 'folder' }
    return folder
  }
  const file: FileNode = {
    ...base,
    type: 'file',
    mimeType: 'application/pdf',
    size: row.size ?? 0,
    blobKey: row.blob_key ?? '',
  }
  return file
}

export function createSupabaseRepository(client: SupabaseClient): DataroomRepository {
  function fail(context: string, message: string): never {
    throw new Error(`${context}: ${message}`)
  }

  async function ownerId(): Promise<string> {
    const { data, error } = await client.auth.getUser()
    if (error !== null) fail('auth', error.message)
    if (data.user === null) fail('auth', 'not signed in')
    return data.user.id
  }

  async function roomNodes(dataroomId: string): Promise<DataroomNode[]> {
    if (!isUuid(dataroomId)) return []
    const { data, error } = await client.from('nodes').select('*').eq('dataroom_id', dataroomId)
    if (error !== null) fail('nodes.select', error.message)
    const rows: NodeRow[] = data ?? []
    return rows.map(toNode)
  }

  async function siblingNames(dataroomId: string, parentId: NodeId | null): Promise<string[]> {
    const all = await roomNodes(dataroomId)
    return all.filter((n) => n.parentId === parentId).map((n) => n.name)
  }

  async function touch(dataroomId: string): Promise<void> {
    const { error } = await client
      .from('datarooms')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', dataroomId)
    if (error !== null) fail('datarooms.touch', error.message)
  }

  function subtreeOf(all: DataroomNode[], rootId: NodeId): DataroomNode[] {
    const root = all.find((n) => n.id === rootId)
    if (root === undefined) return []
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

  async function removeBlobs(nodes: DataroomNode[]): Promise<void> {
    const files = nodes.filter(isFileNode)
    if (files.length === 0) return
    const uid = await ownerId()
    const paths = files.map((f) => `${uid}/${f.blobKey}`)
    const { error } = await client.storage.from('pdfs').remove(paths)
    if (error !== null) fail('storage.remove', error.message)
  }

  return {
    async listDatarooms() {
      const { data, error } = await client
        .from('datarooms')
        .select('*')
        .order('updated_at', { ascending: false })
      if (error !== null) fail('datarooms.select', error.message)
      const rows: DataroomRow[] = data ?? []
      return rows.map(toDataroom)
    },

    async getDataroom(id) {
      if (!isUuid(id)) return null
      const { data, error } = await client.from('datarooms').select('*').eq('id', id).maybeSingle()
      if (error !== null) fail('datarooms.get', error.message)
      const row: DataroomRow | null = data
      return row === null ? null : toDataroom(row)
    },

    async createDataroom(name) {
      const existing = await this.listDatarooms()
      const unique = resolveUniqueName(name, existing.map((r) => r.name))
      const { data, error } = await client
        .from('datarooms')
        .insert({ id: crypto.randomUUID(), name: unique })
        .select('*')
        .single()
      if (error !== null) fail('datarooms.insert', error.message)
      const row: DataroomRow = data
      return toDataroom(row)
    },

    async renameDataroom(id, name) {
      if (!isUuid(id)) fail('datarooms.rename', 'Data room not found')
      const existing = await this.listDatarooms()
      const siblings = existing.filter((r) => r.id !== id).map((r) => r.name)
      if (isNameTaken(name, siblings)) throw new NameConflictError()
      const { data, error } = await client
        .from('datarooms')
        .update({ name, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select('*')
        .single()
      if (error !== null) fail('datarooms.rename', error.message)
      const row: DataroomRow = data
      return toDataroom(row)
    },

    async deleteDataroom(id) {
      if (!isUuid(id)) return
      const nodes = await roomNodes(id)
      await removeBlobs(nodes)
      const { error } = await client.from('datarooms').delete().eq('id', id)
      if (error !== null) fail('datarooms.delete', error.message)
    },

    async getDataroomStats(id) {
      const nodes = await roomNodes(id)
      let fileCount = 0
      let totalSize = 0
      for (const node of nodes) {
        if (isFileNode(node)) {
          fileCount += 1
          totalSize += node.size
        }
      }
      return { fileCount, totalSize }
    },

    async countDataroomContents(id) {
      const nodes = await roomNodes(id)
      let folders = 0
      let files = 0
      for (const node of nodes) {
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
      if (!isUuid(id)) return null
      const { data, error } = await client.from('nodes').select('*').eq('id', id).maybeSingle()
      if (error !== null) fail('nodes.get', error.message)
      const row: NodeRow | null = data
      return row === null ? null : toNode(row)
    },

    async getPath(id) {
      const node = await this.getNode(id)
      if (node === null) return []
      const all = await roomNodes(node.dataroomId)
      const byId = new Map(all.map((n) => [n.id, n]))
      const path: DataroomNode[] = []
      let currentId: NodeId | null = id
      while (currentId !== null) {
        const current = byId.get(currentId)
        if (current === undefined) break
        path.unshift(current)
        currentId = current.parentId
      }
      return path
    },

    async createFolder(dataroomId, parentId, name) {
      const unique = resolveUniqueName(name, await siblingNames(dataroomId, parentId))
      const { data, error } = await client
        .from('nodes')
        .insert({
          id: crypto.randomUUID(),
          dataroom_id: dataroomId,
          parent_id: parentId,
          type: 'folder',
          name: unique,
        })
        .select('*')
        .single()
      if (error !== null) fail('nodes.insertFolder', error.message)
      await touch(dataroomId)
      const row: NodeRow = data
      const node = toNode(row)
      if (node.type !== 'folder') fail('nodes.insertFolder', 'unexpected node type')
      return node
    },

    async uploadFiles(dataroomId, parentId, files) {
      const uid = await ownerId()
      const taken = await siblingNames(dataroomId, parentId)
      const created: FileNode[] = []
      for (const file of files) {
        const unique = resolveUniqueName(file.name, taken)
        taken.push(unique)
        const blobKey = crypto.randomUUID()
        const normalized = new Blob([file], { type: 'application/pdf' })
        const upload = await client.storage.from('pdfs').upload(`${uid}/${blobKey}`, normalized, {
          contentType: 'application/pdf',
        })
        if (upload.error !== null) fail('storage.upload', upload.error.message)
        const { data, error } = await client
          .from('nodes')
          .insert({
            id: crypto.randomUUID(),
            dataroom_id: dataroomId,
            parent_id: parentId,
            type: 'file',
            name: unique,
            mime_type: 'application/pdf',
            size: file.size,
            blob_key: blobKey,
          })
          .select('*')
          .single()
        if (error !== null) fail('nodes.insertFile', error.message)
        const row: NodeRow = data
        const node = toNode(row)
        if (node.type === 'file') created.push(node)
      }
      await touch(dataroomId)
      return created
    },

    async getFileBlob(blobKey) {
      const uid = await ownerId()
      const { data, error } = await client.storage.from('pdfs').download(`${uid}/${blobKey}`)
      if (error !== null) {
        if (error.message.toLowerCase().includes('not found')) return null
        fail('storage.download', error.message)
      }
      return data
    },

    async renameNode(id, newName) {
      const node = await this.getNode(id)
      if (node === null) fail('nodes.rename', 'item not found')
      const all = await roomNodes(node.dataroomId)
      const siblings = all
        .filter((n) => n.parentId === node.parentId && n.id !== id)
        .map((n) => n.name)
      if (isNameTaken(newName, siblings)) throw new NameConflictError()
      const { data, error } = await client
        .from('nodes')
        .update({ name: newName, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select('*')
        .single()
      if (error !== null) fail('nodes.rename', error.message)
      await touch(node.dataroomId)
      const row: NodeRow = data
      return toNode(row)
    },

    async countSubtree(id) {
      const node = await this.getNode(id)
      if (node === null) return { folders: 0, files: 0 }
      const subtree = subtreeOf(await roomNodes(node.dataroomId), id)
      let folders = 0
      let files = 0
      for (const item of subtree.slice(1)) {
        if (item.type === 'folder') folders += 1
        else files += 1
      }
      return { folders, files }
    },

    async deleteNode(id) {
      const node = await this.getNode(id)
      if (node === null) return
      const subtree = subtreeOf(await roomNodes(node.dataroomId), id)
      await removeBlobs(subtree)
      const { error } = await client.from('nodes').delete().eq('id', id)
      if (error !== null) fail('nodes.delete', error.message)
      await touch(node.dataroomId)
    },
  }
}

import { compareSiblings } from './ordering'
import type { DataroomNode, NodeId } from './types'

export interface MatchSegments {
  before: string
  match: string
  after: string
}

export function splitMatch(name: string, query: string): MatchSegments | null {
  const needle = query.trim().toLowerCase()
  if (needle === '') return null
  const index = name.toLowerCase().indexOf(needle)
  if (index === -1) return null
  return {
    before: name.slice(0, index),
    match: name.slice(index, index + needle.length),
    after: name.slice(index + needle.length),
  }
}

export function filterByName(nodes: readonly DataroomNode[], query: string): DataroomNode[] {
  const needle = query.trim().toLowerCase()
  if (needle === '') return []
  return nodes.filter((node) => node.name.toLowerCase().includes(needle)).sort(compareSiblings)
}

export function buildPathMap(nodes: readonly DataroomNode[]): Map<NodeId, string> {
  const byId = new Map(nodes.map((node) => [node.id, node]))
  const fullPathCache = new Map<NodeId, string>()

  function fullPathOf(id: NodeId): string {
    const cached = fullPathCache.get(id)
    if (cached !== undefined) return cached
    const node = byId.get(id)
    if (node === undefined) return ''
    const parentPath = node.parentId === null ? '' : fullPathOf(node.parentId)
    const full = parentPath === '' ? node.name : `${parentPath} / ${node.name}`
    fullPathCache.set(id, full)
    return full
  }

  const ancestors = new Map<NodeId, string>()
  for (const node of nodes) {
    ancestors.set(node.id, node.parentId === null ? '' : fullPathOf(node.parentId))
  }
  return ancestors
}

export function countDirectChildren(nodes: readonly DataroomNode[]): Map<NodeId, number> {
  const counts = new Map<NodeId, number>()
  for (const node of nodes) {
    if (node.parentId === null) continue
    counts.set(node.parentId, (counts.get(node.parentId) ?? 0) + 1)
  }
  return counts
}

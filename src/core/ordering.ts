import type { DataroomNode } from './types'

export function compareSiblings(a: DataroomNode, b: DataroomNode): number {
  if (a.type !== b.type) return a.type === 'folder' ? -1 : 1
  return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
}

import type { DataroomNode } from '@/core/types'

export interface Crumb {
  id: string
  name: string
  to: string | null
}

export function buildCrumbs(
  dataroomId: string,
  dataroomName: string,
  path: DataroomNode[],
): Crumb[] {
  const crumbs: Crumb[] = [
    { id: dataroomId, name: dataroomName, to: path.length === 0 ? null : `/d/${dataroomId}` },
  ]
  path.forEach((node, index) => {
    const isLast = index === path.length - 1
    crumbs.push({
      id: node.id,
      name: node.name,
      to: isLast ? null : `/d/${dataroomId}/folder/${node.id}`,
    })
  })
  return crumbs
}

export function collapseCrumbs(crumbs: Crumb[]): (Crumb | 'ellipsis')[] {
  if (crumbs.length <= 4) return crumbs
  const first = crumbs[0]
  if (first === undefined) return crumbs
  return [first, 'ellipsis', ...crumbs.slice(-2)]
}

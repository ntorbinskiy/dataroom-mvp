import { describe, expect, it } from 'vitest'
import { buildCrumbs, collapseCrumbs } from '@/viewmodels/crumbs'
import type { Crumb } from '@/viewmodels/crumbs'
import type { FolderNode } from '@/core/types'

function folder(id: string, name: string, parentId: string | null): FolderNode {
  return { id, name, parentId, dataroomId: 'room', type: 'folder', createdAt: 0, updatedAt: 0 }
}

describe('buildCrumbs', () => {
  it('root view: single non-link crumb named after the dataroom', () => {
    expect(buildCrumbs('room', 'Atlas', [])).toEqual([{ id: 'room', name: 'Atlas', to: null }])
  })
  it('nested: dataroom links home, ancestors link, current is plain', () => {
    const path = [folder('a', 'Legal', null), folder('b', 'NDAs', 'a')]
    expect(buildCrumbs('room', 'Atlas', path)).toEqual([
      { id: 'room', name: 'Atlas', to: '/d/room' },
      { id: 'a', name: 'Legal', to: '/d/room/folder/a' },
      { id: 'b', name: 'NDAs', to: null },
    ])
  })
})

describe('collapseCrumbs', () => {
  const crumb = (id: string): Crumb => ({ id, name: id, to: null })
  it('keeps up to 4 crumbs as is', () => {
    const four = [crumb('1'), crumb('2'), crumb('3'), crumb('4')]
    expect(collapseCrumbs(four)).toEqual(four)
  })
  it('collapses the middle beyond 4: first + ellipsis + last two', () => {
    const six = [crumb('1'), crumb('2'), crumb('3'), crumb('4'), crumb('5'), crumb('6')]
    expect(collapseCrumbs(six)).toEqual([crumb('1'), 'ellipsis', crumb('5'), crumb('6')])
  })
})

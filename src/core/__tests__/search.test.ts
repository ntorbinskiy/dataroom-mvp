import { describe, expect, it } from 'vitest'
import { buildPathMap, countDirectChildren, filterByName, splitMatch } from '@/core/search'
import type { DataroomNode, FileNode, FolderNode } from '@/core/types'

function folder(id: string, name: string, parentId: string | null): FolderNode {
  return { id, name, parentId, dataroomId: 'room', type: 'folder', createdAt: 0, updatedAt: 0 }
}

function file(id: string, name: string, parentId: string | null): FileNode {
  return {
    id,
    name,
    parentId,
    dataroomId: 'room',
    type: 'file',
    mimeType: 'application/pdf',
    size: 10,
    blobKey: `blob-${id}`,
    createdAt: 0,
    updatedAt: 0,
  }
}

const nodes: DataroomNode[] = [
  folder('a', 'Legal', null),
  folder('b', 'NDAs', 'a'),
  file('c', 'nda-signed.pdf', 'b'),
  file('d', 'Report 10.pdf', null),
  folder('e', 'report drafts', null),
]

describe('filterByName', () => {
  it('matches case-insensitively on a trimmed query', () => {
    expect(filterByName(nodes, '  NDA ').map((n) => n.id)).toEqual(['b', 'c'])
  })
  it('returns empty for an empty or whitespace query', () => {
    expect(filterByName(nodes, '')).toEqual([])
    expect(filterByName(nodes, '   ')).toEqual([])
  })
  it('sorts folders first, then names', () => {
    expect(filterByName(nodes, 'report').map((n) => n.id)).toEqual(['e', 'd'])
  })
})

describe('buildPathMap', () => {
  it('maps ancestors only: empty for root nodes, chain for nested', () => {
    const paths = buildPathMap(nodes)
    expect(paths.get('a')).toBe('')
    expect(paths.get('b')).toBe('Legal')
    expect(paths.get('c')).toBe('Legal / NDAs')
  })
})

describe('countDirectChildren', () => {
  it('counts only direct children', () => {
    const counts = countDirectChildren(nodes)
    expect(counts.get('a')).toBe(1)
    expect(counts.get('b')).toBe(1)
    expect(counts.get('e') ?? 0).toBe(0)
  })
})

describe('splitMatch', () => {
  it('splits around the first case-insensitive match, preserving original casing', () => {
    expect(splitMatch('Report 10.pdf', 'report')).toEqual({
      before: '',
      match: 'Report',
      after: ' 10.pdf',
    })
    expect(splitMatch('nda-signed.pdf', 'SIGN')).toEqual({
      before: 'nda-',
      match: 'sign',
      after: 'ed.pdf',
    })
  })
  it('returns null when there is no match or the query is blank', () => {
    expect(splitMatch('Legal', 'zzz')).toBeNull()
    expect(splitMatch('Legal', '  ')).toBeNull()
  })
})

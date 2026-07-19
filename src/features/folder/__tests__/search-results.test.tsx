import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils'
import { SearchResults } from '@/features/folder/SearchResults'
import type { SearchResult } from '@/features/folder/folder.port'
import type { FileNode } from '@/core/types'

const fileNode: FileNode = {
  id: 'f1',
  name: 'nda-signed.pdf',
  parentId: 'p1',
  dataroomId: 'room',
  type: 'file',
  mimeType: 'application/pdf',
  size: 2048,
  blobKey: 'b1',
  createdAt: 0,
  updatedAt: 0,
}

const result: SearchResult = {
  node: fileNode,
  path: 'Legal / NDAs',
  match: { before: 'nda-', match: 'sign', after: 'ed.pdf' },
  meta: '2 KB',
}

describe('SearchResults', () => {
  it('renders name with highlighted match, path and meta; opens on click', async () => {
    const onOpen = vi.fn()
    renderWithProviders(<SearchResults results={[result]} query="sign" onOpen={onOpen} />)
    expect(screen.getByText('Legal / NDAs')).toBeInTheDocument()
    expect(screen.getByText('2 KB')).toBeInTheDocument()
    expect(screen.getByText('sign').tagName).toBe('MARK')
    await userEvent.click(screen.getByRole('button'))
    expect(onOpen).toHaveBeenCalledWith(fileNode)
  })

  it('shows the stamp empty state when nothing matches', () => {
    renderWithProviders(<SearchResults results={[]} query="ghost" onOpen={() => undefined} />)
    expect(screen.getByText('No matches')).toBeInTheDocument()
    expect(screen.getByText(/ghost/)).toBeInTheDocument()
  })
})

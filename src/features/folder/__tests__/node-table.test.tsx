import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils'
import { NodeTable } from '@/features/folder/NodeTable'
import type { DataroomNode } from '@/core/types'

function makeFolderNode(): DataroomNode {
  return {
    id: 'folder-1',
    dataroomId: 'room-1',
    parentId: null,
    type: 'folder',
    name: 'Legal',
    createdAt: 1,
    updatedAt: 2,
  }
}

function setup() {
  const onOpen = vi.fn()
  const onRename = vi.fn()
  const onDelete = vi.fn()
  const node = makeFolderNode()
  renderWithProviders(
    <NodeTable
      nodes={[node]}
      childCounts={new Map([[node.id, 0]])}
      onOpen={onOpen}
      onRename={onRename}
      onDelete={onDelete}
    />,
  )
  return { onOpen, onRename, onDelete, node }
}

describe('NodeTable', () => {
  it('opens the node when Enter is pressed on the focused row', async () => {
    const { onOpen, node } = setup()
    const row = screen.getByRole('row', { name: /Legal/ })
    row.focus()
    await userEvent.keyboard('{Enter}')
    expect(onOpen).toHaveBeenCalledOnce()
    expect(onOpen).toHaveBeenCalledWith(node)
  })

  it('does not open the node when Enter is pressed on the row-actions button', async () => {
    const { onOpen } = setup()
    const actionsButton = screen.getByRole('button', { name: 'Actions for Legal' })
    actionsButton.focus()
    await userEvent.keyboard('{Enter}')
    expect(onOpen).not.toHaveBeenCalled()
  })
})

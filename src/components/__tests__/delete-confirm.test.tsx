import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils'
import { DeleteConfirmDialog } from '@/components/dialogs/DeleteConfirmDialog'

describe('DeleteConfirmDialog', () => {
  it('shows the item name and the consequences, confirms on click', async () => {
    const onConfirm = vi.fn()
    renderWithProviders(
      <DeleteConfirmDialog
        open
        onOpenChange={() => undefined}
        itemName="Legal"
        description="This will permanently delete 3 folders and 12 files."
        onConfirm={onConfirm}
      />,
    )
    expect(screen.getByText(/Delete "Legal"\?/)).toBeInTheDocument()
    expect(
      screen.getByText('This will permanently delete 3 folders and 12 files.'),
    ).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }))
    expect(onConfirm).toHaveBeenCalledOnce()
  })
})

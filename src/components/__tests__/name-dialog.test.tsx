import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils'
import { NameDialog } from '@/components/dialogs/NameDialog'

function makeProps(overrides: Partial<Parameters<typeof NameDialog>[0]> = {}) {
  return {
    open: true,
    onOpenChange: vi.fn(),
    title: 'Rename file',
    confirmLabel: 'Rename',
    onSubmit: vi.fn(),
    ...overrides,
  }
}

describe('NameDialog', () => {
  it('submits the trimmed name', async () => {
    const props = makeProps()
    renderWithProviders(<NameDialog {...props} />)
    await userEvent.type(screen.getByLabelText('Name'), '  Legal  ')
    await userEvent.click(screen.getByRole('button', { name: 'Rename' }))
    expect(props.onSubmit).toHaveBeenCalledWith('Legal')
  })

  it('shows a validation error for an empty name and does not submit', async () => {
    const props = makeProps()
    renderWithProviders(<NameDialog {...props} />)
    await userEvent.click(screen.getByRole('button', { name: 'Rename' }))
    expect(screen.getByText('Name cannot be empty')).toBeInTheDocument()
    expect(props.onSubmit).not.toHaveBeenCalled()
  })

  it('locks the .pdf extension: edits base name, submits full name', async () => {
    const props = makeProps({ initialName: 'report.pdf', lockPdfExtension: true })
    renderWithProviders(<NameDialog {...props} />)
    const input = screen.getByLabelText('Name')
    expect(input).toHaveValue('report')
    expect(screen.getByText('.pdf')).toBeInTheDocument()
    await userEvent.clear(input)
    await userEvent.type(input, 'contract')
    await userEvent.click(screen.getByRole('button', { name: 'Rename' }))
    expect(props.onSubmit).toHaveBeenCalledWith('contract.pdf')
  })

  it('shows the conflict error passed from the server', () => {
    renderWithProviders(<NameDialog {...makeProps({ conflictError: true })} />)
    expect(screen.getByText('Name already taken')).toBeInTheDocument()
  })
})

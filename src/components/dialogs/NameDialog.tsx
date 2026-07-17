import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { splitPdfName, validateName } from '@/core/naming'

interface NameDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  confirmLabel: string
  initialName?: string
  lockPdfExtension?: boolean
  conflictError?: boolean
  pending?: boolean
  onSubmit: (name: string) => void
}

export function NameDialog({
  open,
  onOpenChange,
  title,
  confirmLabel,
  initialName = '',
  lockPdfExtension = false,
  conflictError = false,
  pending = false,
  onSubmit,
}: NameDialogProps) {
  const { base, extension } = lockPdfExtension
    ? splitPdfName(initialName)
    : { base: initialName, extension: '' }
  const [value, setValue] = useState(base)
  const [localError, setLocalError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setValue(base)
      setLocalError(null)
    }
  }, [open, initialName])

  const error = localError ?? (conflictError ? 'Name already taken' : null)

  function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    const validation = validateName(value)
    if (!validation.ok) {
      setLocalError(validation.error)
      return
    }
    setLocalError(null)
    onSubmit(`${validation.name}${extension}`)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name-dialog-input">Name</Label>
            <div className="flex items-center gap-2">
              <Input
                id="name-dialog-input"
                value={value}
                onChange={(event) => {
                  setValue(event.target.value)
                  setLocalError(null)
                }}
                autoFocus
              />
              {extension !== '' ? (
                <span className="font-mono text-sm text-muted-foreground">{extension}</span>
              ) : null}
            </div>
            {error !== null ? <p className="text-sm text-destructive">{error}</p> : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {confirmLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

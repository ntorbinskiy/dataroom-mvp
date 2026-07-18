export interface DialogFlow {
  open: boolean
  pending: boolean
  setOpen: (open: boolean) => void
  submit: (name: string) => void
}

export interface TargetDialogFlow<T> {
  target: T | null
  conflict: boolean
  pending: boolean
  show: (target: T) => void
  close: () => void
  submit: (name: string) => void
}

export interface RemoveFlow<T> {
  target: T | null
  description: string
  pending: boolean
  show: (target: T) => void
  close: () => void
  confirm: () => void
}

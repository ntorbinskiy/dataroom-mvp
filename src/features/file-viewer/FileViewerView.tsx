import { Link } from 'react-router-dom'
import { ArrowLeft, Download } from 'lucide-react'
import { NameDialog } from '@/components/dialogs/NameDialog'
import { DeleteConfirmDialog } from '@/components/dialogs/DeleteConfirmDialog'
import { ErrorState } from '@/components/feedback/ErrorState'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { FileViewerViewModel } from '@/features/file-viewer/file-viewer.port'

export function FileViewerView({ vm }: { vm: FileViewerViewModel }) {
  return (
    <div className="flex h-dvh flex-col">
      <header className="flex h-14 flex-none items-center justify-between gap-3 border-b bg-card px-4">
        <div className="flex min-w-0 items-center gap-3">
          <Button asChild variant="ghost" size="icon" className="h-8 w-8">
            <Link to={vm.parentPath} aria-label="Back to folder">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{vm.file?.name ?? 'Loading…'}</p>
            {vm.sizeLabel !== null ? (
              <p className="font-mono text-[11px] text-muted-foreground">{vm.sizeLabel}</p>
            ) : null}
          </div>
        </div>
        <div className="flex flex-none items-center gap-2">
          {vm.objectUrl !== null && vm.file !== null ? (
            <Button asChild variant="outline" size="sm">
              <a href={vm.objectUrl} download={vm.file.name}>
                <Download className="h-4 w-4" /> Download
              </a>
            </Button>
          ) : null}
          <Button
            variant="outline"
            size="sm"
            onClick={() => vm.rename.setOpen(true)}
            disabled={vm.file === null}
          >
            Rename
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => vm.remove.setOpen(true)}
            disabled={vm.file === null}
          >
            Delete
          </Button>
        </div>
      </header>

      <div className="min-h-0 flex-1 bg-muted">
        {vm.isLoading ? (
          <div className="p-6">
            <Skeleton className="mx-auto h-full min-h-96 max-w-3xl" />
          </div>
        ) : null}
        {vm.blobMissing ? (
          <div className="p-6">
            <ErrorState message="The file contents are missing from storage." />
          </div>
        ) : null}
        {vm.objectUrl !== null && vm.file !== null ? (
          <iframe src={vm.objectUrl} title={vm.file.name} className="h-full w-full" />
        ) : null}
      </div>

      <NameDialog
        open={vm.rename.open}
        onOpenChange={vm.rename.setOpen}
        title="Rename file"
        confirmLabel="Rename"
        initialName={vm.file?.name ?? ''}
        lockPdfExtension
        conflictError={vm.rename.conflict}
        pending={vm.rename.pending}
        onSubmit={vm.rename.submit}
      />
      <DeleteConfirmDialog
        open={vm.remove.open}
        onOpenChange={vm.remove.setOpen}
        itemName={vm.file?.name ?? ''}
        description="This will permanently delete this file."
        pending={vm.remove.pending}
        onConfirm={vm.remove.confirm}
      />
    </div>
  )
}

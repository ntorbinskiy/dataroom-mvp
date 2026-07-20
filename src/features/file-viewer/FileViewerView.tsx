import { Link } from 'react-router-dom'
import { ArrowLeft, Download } from 'lucide-react'
import { NameDialog } from '@/components/dialogs/NameDialog'
import { DeleteConfirmDialog } from '@/components/dialogs/DeleteConfirmDialog'
import { ErrorState } from '@/components/feedback/ErrorState'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { FileViewerViewProps } from '@/features/file-viewer/file-viewer.port'

export function FileViewerView({ page }: FileViewerViewProps) {
  return (
    <div className="flex h-dvh flex-col">
      <header className="flex min-h-14 flex-none flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b bg-card px-4 py-2">
        <div className="flex min-w-0 flex-1 basis-52 items-center gap-3">
          <Button asChild variant="ghost" size="icon" className="h-8 w-8 flex-none">
            <Link to={page.parentPath} aria-label="Back to folder">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium" title={page.file?.name}>
              {page.file?.name ?? 'Loading…'}
            </p>
            {page.sizeLabel !== null ? (
              <p className="font-mono text-[11px] text-muted-foreground">{page.sizeLabel}</p>
            ) : null}
          </div>
        </div>
        <div className="flex flex-none flex-wrap items-center gap-2">
          {page.objectUrl !== null && page.file !== null ? (
            <Button asChild variant="outline" size="sm">
              <a href={page.objectUrl} download={page.file.name}>
                <Download className="h-4 w-4" /> Download
              </a>
            </Button>
          ) : null}
          <Button
            variant="outline"
            size="sm"
            onClick={() => page.rename.setOpen(true)}
            disabled={page.file === null}
          >
            Rename
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => page.remove.setOpen(true)}
            disabled={page.file === null}
          >
            Delete
          </Button>
        </div>
      </header>

      <div className="min-h-0 flex-1 bg-muted">
        {page.isLoading ? (
          <div className="p-6">
            <Skeleton className="mx-auto h-full min-h-96 max-w-3xl" />
          </div>
        ) : null}
        {page.blobMissing ? (
          <div className="p-6">
            <ErrorState message="The file contents are missing from storage." />
          </div>
        ) : null}
        {page.objectUrl !== null && page.file !== null ? (
          <iframe src={page.objectUrl} title={page.file.name} className="h-full w-full" />
        ) : null}
      </div>

      <NameDialog
        open={page.rename.open}
        onOpenChange={page.rename.setOpen}
        title="Rename file"
        confirmLabel="Rename"
        initialName={page.file?.name ?? ''}
        lockPdfExtension
        conflictError={page.rename.conflict}
        pending={page.rename.pending}
        onSubmit={page.rename.submit}
      />
      <DeleteConfirmDialog
        open={page.remove.open}
        onOpenChange={page.remove.setOpen}
        itemName={page.file?.name ?? ''}
        description="This will permanently delete this file."
        pending={page.remove.pending}
        onConfirm={page.remove.confirm}
      />
    </div>
  )
}

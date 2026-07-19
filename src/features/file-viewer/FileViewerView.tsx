import { Link } from 'react-router-dom'
import { ArrowLeft, Download } from 'lucide-react'
import { NameDialog } from '@/components/dialogs/NameDialog'
import { DeleteConfirmDialog } from '@/components/dialogs/DeleteConfirmDialog'
import { ErrorState } from '@/components/feedback/ErrorState'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { FileViewerViewProps } from '@/features/file-viewer/file-viewer.port'

export function FileViewerView({
  file,
  isLoading,
  sizeLabel,
  objectUrl,
  blobMissing,
  parentPath,
  rename,
  remove,
}: FileViewerViewProps) {
  return (
    <div className="flex h-dvh flex-col">
      <header className="flex h-14 flex-none items-center justify-between gap-3 border-b bg-card px-4">
        <div className="flex min-w-0 items-center gap-3">
          <Button asChild variant="ghost" size="icon" className="h-8 w-8">
            <Link to={parentPath} aria-label="Back to folder">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{file?.name ?? 'Loading…'}</p>
            {sizeLabel !== null ? (
              <p className="font-mono text-[11px] text-muted-foreground">{sizeLabel}</p>
            ) : null}
          </div>
        </div>
        <div className="flex flex-none items-center gap-2">
          {objectUrl !== null && file !== null ? (
            <Button asChild variant="outline" size="sm">
              <a href={objectUrl} download={file.name}>
                <Download className="h-4 w-4" /> Download
              </a>
            </Button>
          ) : null}
          <Button
            variant="outline"
            size="sm"
            onClick={() => rename.setOpen(true)}
            disabled={file === null}
          >
            Rename
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => remove.setOpen(true)}
            disabled={file === null}
          >
            Delete
          </Button>
        </div>
      </header>

      <div className="min-h-0 flex-1 bg-muted">
        {isLoading ? (
          <div className="p-6">
            <Skeleton className="mx-auto h-full min-h-96 max-w-3xl" />
          </div>
        ) : null}
        {blobMissing ? (
          <div className="p-6">
            <ErrorState message="The file contents are missing from storage." />
          </div>
        ) : null}
        {objectUrl !== null && file !== null ? (
          <iframe src={objectUrl} title={file.name} className="h-full w-full" />
        ) : null}
      </div>

      <NameDialog
        open={rename.open}
        onOpenChange={rename.setOpen}
        title="Rename file"
        confirmLabel="Rename"
        initialName={file?.name ?? ''}
        lockPdfExtension
        conflictError={rename.conflict}
        pending={rename.pending}
        onSubmit={rename.submit}
      />
      <DeleteConfirmDialog
        open={remove.open}
        onOpenChange={remove.setOpen}
        itemName={file?.name ?? ''}
        description="This will permanently delete this file."
        pending={remove.pending}
        onConfirm={remove.confirm}
      />
    </div>
  )
}

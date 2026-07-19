import { FolderPlus } from 'lucide-react'
import { TopBar } from '@/components/layout/TopBar'
import { Breadcrumbs } from '@/features/folder/Breadcrumbs'
import { NodeTable } from '@/features/folder/NodeTable'
import { UploadButton } from '@/features/folder/UploadButton'
import { DropzoneOverlay } from '@/features/folder/DropzoneOverlay'
import { NameDialog } from '@/components/dialogs/NameDialog'
import { DeleteConfirmDialog } from '@/components/dialogs/DeleteConfirmDialog'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { TableSkeleton } from '@/components/feedback/TableSkeleton'
import { Button } from '@/components/ui/button'
import type { FolderViewProps } from '@/features/folder/folder.port'

export function FolderView({
  crumbs,
  title,
  summary,
  nodes,
  childCounts,
  isLoading,
  isError,
  retry,
  uploadPending,
  openNode,
  upload,
  createFolder,
  rename,
  remove,
}: FolderViewProps) {
  return (
    <div className="min-h-dvh">
      <TopBar />
      <main className="mx-auto max-w-5xl px-6 py-5">
        {crumbs !== null ? <Breadcrumbs crumbs={crumbs} /> : null}
        <div className="mt-1.5 mb-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-semibold">{title}</h1>
            <p className="mt-1 font-mono text-xs text-muted-foreground">{summary ?? 'Loading…'}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => createFolder.setOpen(true)}>
              <FolderPlus className="h-4 w-4" /> New folder
            </Button>
            <UploadButton pending={uploadPending} onFiles={upload} />
          </div>
        </div>

        <DropzoneOverlay onFiles={upload}>
          {isLoading ? <TableSkeleton /> : null}
          {isError ? <ErrorState message="Could not load this folder." onRetry={retry} /> : null}
          {nodes !== undefined && nodes.length === 0 ? (
            <EmptyState
              stamp="No documents filed"
              description="Drop PDF files anywhere on this page, or use New folder and Upload PDF above."
            />
          ) : null}
          {nodes !== undefined && nodes.length > 0 ? (
            <NodeTable
              nodes={nodes}
              childCounts={childCounts}
              onOpen={openNode}
              onRename={rename.show}
              onDelete={remove.show}
            />
          ) : null}
        </DropzoneOverlay>
      </main>

      <NameDialog
        open={createFolder.open}
        onOpenChange={createFolder.setOpen}
        title="New folder"
        confirmLabel="Create"
        pending={createFolder.pending}
        onSubmit={createFolder.submit}
      />
      <NameDialog
        open={rename.target !== null}
        onOpenChange={(open) => {
          if (!open) rename.close()
        }}
        title={rename.isFile ? 'Rename file' : 'Rename folder'}
        confirmLabel="Rename"
        initialName={rename.target?.name ?? ''}
        lockPdfExtension={rename.isFile}
        conflictError={rename.conflict}
        pending={rename.pending}
        onSubmit={rename.submit}
      />
      <DeleteConfirmDialog
        open={remove.target !== null}
        onOpenChange={(open) => {
          if (!open) remove.close()
        }}
        itemName={remove.target?.name ?? ''}
        description={remove.description}
        pending={remove.pending}
        onConfirm={remove.confirm}
      />
    </div>
  )
}

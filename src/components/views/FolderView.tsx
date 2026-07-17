import { FolderPlus } from 'lucide-react'
import { TopBar } from '@/components/layout/TopBar'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { NodeTable } from '@/components/nodes/NodeTable'
import { UploadButton } from '@/components/upload/UploadButton'
import { DropzoneOverlay } from '@/components/upload/DropzoneOverlay'
import { NameDialog } from '@/components/dialogs/NameDialog'
import { DeleteConfirmDialog } from '@/components/dialogs/DeleteConfirmDialog'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { TableSkeleton } from '@/components/feedback/TableSkeleton'
import { Button } from '@/components/ui/button'
import type { FolderViewModel } from '@/viewmodels/folder-contract'

export function FolderView({ vm }: { vm: FolderViewModel }) {
  return (
    <div className="min-h-dvh">
      <TopBar />
      <main className="mx-auto max-w-5xl px-6 py-5">
        {vm.crumbs !== null ? <Breadcrumbs crumbs={vm.crumbs} /> : null}
        <div className="mt-1.5 mb-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-semibold">{vm.title}</h1>
            <p className="mt-1 font-mono text-xs text-muted-foreground">
              {vm.summary ?? 'Loading…'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => vm.createFolder.setOpen(true)}>
              <FolderPlus className="h-4 w-4" /> New folder
            </Button>
            <UploadButton pending={vm.uploadPending} onFiles={vm.upload} />
          </div>
        </div>

        <DropzoneOverlay onFiles={vm.upload}>
          {vm.isLoading ? <TableSkeleton /> : null}
          {vm.isError ? (
            <ErrorState message="Could not load this folder." onRetry={vm.retry} />
          ) : null}
          {vm.nodes !== undefined && vm.nodes.length === 0 ? (
            <EmptyState
              stamp="No documents filed"
              description="Create a folder to organize this section, or upload the first PDF."
            >
              <Button variant="outline" onClick={() => vm.createFolder.setOpen(true)}>
                New folder
              </Button>
              <UploadButton pending={vm.uploadPending} onFiles={vm.upload} />
            </EmptyState>
          ) : null}
          {vm.nodes !== undefined && vm.nodes.length > 0 ? (
            <NodeTable
              nodes={vm.nodes}
              childCounts={vm.childCounts}
              onOpen={vm.openNode}
              onRename={vm.rename.show}
              onDelete={vm.remove.show}
            />
          ) : null}
        </DropzoneOverlay>
      </main>

      <NameDialog
        open={vm.createFolder.open}
        onOpenChange={vm.createFolder.setOpen}
        title="New folder"
        confirmLabel="Create"
        pending={vm.createFolder.pending}
        onSubmit={vm.createFolder.submit}
      />
      <NameDialog
        open={vm.rename.target !== null}
        onOpenChange={(open) => {
          if (!open) vm.rename.close()
        }}
        title={vm.rename.isFile ? 'Rename file' : 'Rename folder'}
        confirmLabel="Rename"
        initialName={vm.rename.target?.name ?? ''}
        lockPdfExtension={vm.rename.isFile}
        conflictError={vm.rename.conflict}
        pending={vm.rename.pending}
        onSubmit={vm.rename.submit}
      />
      <DeleteConfirmDialog
        open={vm.remove.target !== null}
        onOpenChange={(open) => {
          if (!open) vm.remove.close()
        }}
        itemName={vm.remove.target?.name ?? ''}
        description={vm.remove.description}
        pending={vm.remove.pending}
        onConfirm={vm.remove.confirm}
      />
    </div>
  )
}

import { FolderPlus, Search, X } from 'lucide-react'
import { TopBar } from '@/components/layout/TopBar'
import { Breadcrumbs } from '@/features/folder/Breadcrumbs'
import { NodeTable } from '@/features/folder/NodeTable'
import { SearchResults } from '@/features/folder/SearchResults'
import { UploadButton } from '@/features/folder/UploadButton'
import { DropzoneOverlay } from '@/features/folder/DropzoneOverlay'
import { NameDialog } from '@/components/dialogs/NameDialog'
import { DeleteConfirmDialog } from '@/components/dialogs/DeleteConfirmDialog'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { TableSkeleton } from '@/components/feedback/TableSkeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import type { FolderViewProps } from '@/features/folder/folder.port'

export function FolderView({ page }: FolderViewProps) {
  return (
    <div className="min-h-dvh">
      <TopBar />
      <main className="mx-auto max-w-5xl px-6 py-5">
        {/* the non-breaking spaces below keep the real line-box heights while
            loading, so the toolbar does not shift down once data arrives */}
        {page.crumbs !== null ? (
          <Breadcrumbs crumbs={page.crumbs} />
        ) : (
          <div aria-hidden="true" className="relative text-[13px]">
            {'\u00A0'}
            <Skeleton className="absolute top-1/2 left-0 h-3.5 w-40 -translate-y-1/2" />
          </div>
        )}
        <div className="mt-1.5 mb-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="relative font-display text-2xl font-semibold">
              {page.title !== '' ? (
                page.title
              ) : (
                <>
                  {'\u00A0'}
                  <Skeleton className="absolute top-1/2 left-0 h-6 w-48 -translate-y-1/2" />
                </>
              )}
            </h1>
            <p className="mt-1 font-mono text-xs text-muted-foreground">{page.summary ?? 'Loading…'}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={page.search.query}
                onChange={(event) => page.search.setQuery(event.target.value)}
                placeholder="Search this data room"
                aria-label="Search this data room"
                className="h-9 w-56 pr-8 pl-8"
              />
              {page.search.query !== '' ? (
                <button
                  type="button"
                  onClick={() => page.search.setQuery('')}
                  aria-label="Clear search"
                  className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>
            <Button variant="outline" onClick={() => page.createFolder.setOpen(true)}>
              <FolderPlus className="h-4 w-4" /> New folder
            </Button>
            <UploadButton pending={page.uploadPending} onFiles={page.upload} />
          </div>
        </div>

        <DropzoneOverlay onFiles={page.upload}>
          {page.search.active ? (
            page.search.isLoading ? (
              <TableSkeleton />
            ) : (
              <SearchResults results={page.search.results} query={page.search.query} onOpen={page.search.open} />
            )
          ) : (
            <>
              {page.isLoading ? <TableSkeleton /> : null}
              {page.isError ? <ErrorState message="Could not load this folder." onRetry={page.retry} /> : null}
              {page.nodes !== undefined && page.nodes.length === 0 ? (
                <EmptyState
                  stamp="No documents filed"
                  description="Drop PDF files anywhere on this page, or use New folder and Upload PDF above."
                />
              ) : null}
              {page.nodes !== undefined && page.nodes.length > 0 ? (
                <NodeTable
                  nodes={page.nodes}
                  childCounts={page.childCounts}
                  onOpen={page.openNode}
                  onRename={page.rename.show}
                  onDelete={page.remove.show}
                />
              ) : null}
            </>
          )}
        </DropzoneOverlay>
      </main>

      <NameDialog
        open={page.createFolder.open}
        onOpenChange={page.createFolder.setOpen}
        title="New folder"
        confirmLabel="Create"
        pending={page.createFolder.pending}
        onSubmit={page.createFolder.submit}
      />
      <NameDialog
        open={page.rename.target !== null}
        onOpenChange={(open) => {
          if (!open) page.rename.close()
        }}
        title={page.rename.isFile ? 'Rename file' : 'Rename folder'}
        confirmLabel="Rename"
        initialName={page.rename.target?.name ?? ''}
        lockPdfExtension={page.rename.isFile}
        conflictError={page.rename.conflict}
        pending={page.rename.pending}
        onSubmit={page.rename.submit}
      />
      <DeleteConfirmDialog
        open={page.remove.target !== null}
        onOpenChange={(open) => {
          if (!open) page.remove.close()
        }}
        itemName={page.remove.target?.name ?? ''}
        description={page.remove.description}
        pending={page.remove.pending}
        onConfirm={page.remove.confirm}
      />
    </div>
  )
}

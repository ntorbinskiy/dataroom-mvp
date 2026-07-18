import { Link } from 'react-router-dom'
import { EllipsisVertical, Plus } from 'lucide-react'
import { TopBar } from '@/components/layout/TopBar'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { TableSkeleton } from '@/components/feedback/TableSkeleton'
import { NameDialog } from '@/components/dialogs/NameDialog'
import { DeleteConfirmDialog } from '@/components/dialogs/DeleteConfirmDialog'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatCount } from '@/core/format'
import type { Dataroom } from '@/core/types'
import type { HomeViewModel } from '@/features/home/home.port'

function RoomCard({
  room,
  meta,
  onRename,
  onDelete,
}: {
  room: Dataroom
  meta: string
  onRename: () => void
  onDelete: () => void
}) {
  return (
    <div className="group relative mt-3.5 rounded-lg rounded-tl-none border bg-card p-4 transition-shadow hover:shadow-md">
      <div className="absolute -top-[13px] -left-px h-[13px] w-24 rounded-t-md border border-b-0 border-manila-edge bg-manila" />
      <div className="flex items-start justify-between gap-2">
        <Link to={`/d/${room.id}`} className="min-w-0 flex-1">
          <span className="absolute inset-0" aria-hidden />
          <h3 className="truncate font-display text-base font-semibold">{room.name}</h3>
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative z-10 h-7 w-7">
              <EllipsisVertical className="h-4 w-4" />
              <span className="sr-only">Actions for {room.name}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={onRename}>Rename</DropdownMenuItem>
            <DropdownMenuItem onSelect={onDelete} className="text-destructive">
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <p className="mt-1.5 font-mono text-xs text-muted-foreground">{meta}</p>
    </div>
  )
}

export function HomeView({ vm }: { vm: HomeViewModel }) {
  return (
    <div className="min-h-dvh">
      <TopBar />
      <main className="mx-auto max-w-5xl px-6 py-6">
        <h1 className="font-display text-2xl font-semibold">Data rooms</h1>
        <p className="mt-1 font-mono text-xs text-muted-foreground">
          {vm.rooms !== undefined ? formatCount(vm.rooms.length, 'room') : 'Loading…'}
        </p>
        <div className="mt-5">
          {vm.isLoading ? <TableSkeleton rows={3} /> : null}
          {vm.isError ? (
            <ErrorState message="Could not load your data rooms." onRetry={vm.retry} />
          ) : null}
          {vm.rooms !== undefined && vm.rooms.length === 0 ? (
            <EmptyState
              stamp="No rooms on file"
              description="Create your first data room to start collecting due diligence documents."
            >
              <Button onClick={() => vm.create.setOpen(true)}>New data room</Button>
            </EmptyState>
          ) : null}
          {vm.rooms !== undefined && vm.rooms.length > 0 ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
              {vm.rooms.map((room) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  meta={vm.roomMeta.get(room.id) ?? '…'}
                  onRename={() => vm.rename.show(room)}
                  onDelete={() => vm.remove.show(room)}
                />
              ))}
              <button
                type="button"
                onClick={() => vm.create.setOpen(true)}
                className="mt-3.5 flex min-h-[86px] items-center justify-center gap-2 rounded-lg border border-dashed text-sm font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                <Plus className="h-4 w-4" /> New data room
              </button>
            </div>
          ) : null}
        </div>
      </main>

      <NameDialog
        open={vm.create.open}
        onOpenChange={vm.create.setOpen}
        title="New data room"
        confirmLabel="Create"
        pending={vm.create.pending}
        onSubmit={vm.create.submit}
      />
      <NameDialog
        open={vm.rename.target !== null}
        onOpenChange={(open) => {
          if (!open) vm.rename.close()
        }}
        title="Rename data room"
        confirmLabel="Rename"
        initialName={vm.rename.target?.name ?? ''}
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

import type { DataroomNode } from '@/core/types'

export function NodeIcon({ node }: { node: DataroomNode }) {
  if (node.type === 'folder') {
    return (
      <span className="relative block h-[18px] w-[22px] flex-none" aria-hidden>
        <span className="absolute -top-1 left-0 h-[5px] w-[9px] rounded-t-sm border border-b-0 border-manila-edge bg-manila" />
        <span className="absolute inset-0 rounded-sm border border-manila-edge bg-manila" />
      </span>
    )
  }
  return (
    <span
      className="flex h-[22px] w-[18px] flex-none items-end justify-center rounded-sm border bg-card pb-0.5"
      aria-hidden
    >
      <span className="rounded-[1px] bg-destructive px-0.5 font-mono text-[6.5px] font-medium text-destructive-foreground">
        PDF
      </span>
    </span>
  )
}

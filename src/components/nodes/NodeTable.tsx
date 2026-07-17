import { EllipsisVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { NodeIcon } from '@/components/nodes/NodeIcon'
import { formatBytes, formatCount, formatDate } from '@/core/format'
import { isFileNode } from '@/core/types'
import type { DataroomNode, NodeId } from '@/core/types'

interface NodeTableProps {
  nodes: DataroomNode[]
  childCounts: ReadonlyMap<NodeId, number>
  onOpen: (node: DataroomNode) => void
  onRename: (node: DataroomNode) => void
  onDelete: (node: DataroomNode) => void
}

const headerCell =
  'px-4 py-2.5 text-left font-mono text-[11px] font-medium uppercase tracking-wider text-muted-foreground'

export function NodeTable({ nodes, childCounts, onOpen, onRename, onDelete }: NodeTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-background/55">
            <th className={headerCell}>Name</th>
            <th className={`${headerCell} w-28`}>Size</th>
            <th className={`${headerCell} hidden w-36 sm:table-cell`}>Modified</th>
            <th className="w-12" />
          </tr>
        </thead>
        <tbody>
          {nodes.map((node) => (
            <tr
              key={node.id}
              tabIndex={0}
              onClick={() => onOpen(node)}
              onKeyDown={(event) => {
                if (event.target !== event.currentTarget) return
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  onOpen(node)
                }
              }}
              className="cursor-pointer border-b transition-colors last:border-b-0 hover:bg-secondary/45 focus-visible:outline-2 focus-visible:outline-primary focus-visible:-outline-offset-2"
            >
              <td className="px-4 py-0">
                <div className="flex h-12 items-center gap-3 font-medium">
                  <NodeIcon node={node} />
                  <span className="truncate" title={node.name}>
                    {node.name}
                  </span>
                </div>
              </td>
              <td className="px-4 font-mono text-xs text-muted-foreground">
                {isFileNode(node)
                  ? formatBytes(node.size)
                  : formatCount(childCounts.get(node.id) ?? 0, 'item')}
              </td>
              <td className="hidden px-4 font-mono text-xs text-muted-foreground sm:table-cell">
                {formatDate(node.updatedAt)}
              </td>
              <td className="px-2" onClick={(event) => event.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <EllipsisVertical className="h-4 w-4" />
                      <span className="sr-only">Actions for {node.name}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => onRename(node)}>Rename</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => onDelete(node)} className="text-destructive">
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

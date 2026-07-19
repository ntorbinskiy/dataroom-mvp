import { EmptyState } from '@/components/feedback/EmptyState'
import { NodeIcon } from '@/features/folder/NodeIcon'
import type { DataroomNode } from '@/core/types'
import type { SearchResult } from '@/features/folder/folder.port'

interface SearchResultsProps {
  results: SearchResult[]
  query: string
  onOpen: (node: DataroomNode) => void
}

export function SearchResults({ results, query, onOpen }: SearchResultsProps) {
  if (results.length === 0) {
    return (
      <EmptyState
        stamp="No matches"
        description={`Nothing in this data room is named like "${query}".`}
      />
    )
  }
  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <ul>
        {results.map(({ node, path, match, meta }) => (
          <li key={node.id} className="border-b last:border-b-0">
            <button
              type="button"
              onClick={() => onOpen(node)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary/45 focus-visible:outline-2 focus-visible:outline-primary focus-visible:-outline-offset-2"
            >
              <NodeIcon node={node} />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium" title={node.name}>
                  {match === null ? (
                    node.name
                  ) : (
                    <>
                      {match.before}
                      <mark className="rounded-[2px] bg-manila/50 px-0.5 text-foreground">
                        {match.match}
                      </mark>
                      {match.after}
                    </>
                  )}
                </span>
                {path !== '' ? (
                  <span className="block truncate font-mono text-[11px] text-muted-foreground">
                    {path}
                  </span>
                ) : null}
              </span>
              <span className="flex-none font-mono text-xs text-muted-foreground">{meta}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

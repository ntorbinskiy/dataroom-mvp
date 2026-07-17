import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import { collapseCrumbs } from '@/viewmodels/crumbs'
import type { Crumb } from '@/viewmodels/crumbs'

export function Breadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
  const visible = collapseCrumbs(crumbs)
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-1.5 text-[13px] text-muted-foreground"
    >
      {visible.map((crumb, index) => (
        <Fragment key={typeof crumb === 'string' ? `ellipsis-${index}` : crumb.id}>
          {index > 0 ? <span className="text-border">/</span> : null}
          {typeof crumb === 'string' ? (
            <span>…</span>
          ) : crumb.to === null ? (
            <span className="text-foreground">{crumb.name}</span>
          ) : (
            <Link to={crumb.to} className="hover:text-foreground hover:underline">
              {crumb.name}
            </Link>
          )}
        </Fragment>
      ))}
    </nav>
  )
}

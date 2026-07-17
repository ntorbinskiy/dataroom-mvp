import { Link } from 'react-router-dom'

export function TopBar({ children }: { children?: React.ReactNode }) {
  return (
    <header className="flex h-14 items-center justify-between border-b bg-card px-6">
      <Link to="/" className="flex items-baseline gap-2.5">
        <span className="font-display text-lg font-semibold">Docket</span>
        <span className="rounded-sm border border-primary px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-primary">
          Confidential
        </span>
      </Link>
      <div className="flex items-center gap-2">{children}</div>
    </header>
  )
}

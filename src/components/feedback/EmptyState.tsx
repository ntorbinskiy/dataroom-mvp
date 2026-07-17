export function EmptyState({
  stamp,
  description,
  children,
}: {
  stamp: string
  description: string
  children?: React.ReactNode
}) {
  return (
    <div className="mt-4 flex flex-col items-center gap-4 rounded-lg border border-dashed bg-card px-6 py-12 text-center">
      <div className="-rotate-3 rounded border-2 border-muted-foreground/55 px-3.5 py-1.5 font-mono text-xs uppercase tracking-[0.22em] text-muted-foreground/70">
        {stamp}
      </div>
      <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      {children !== undefined ? <div className="flex gap-2">{children}</div> : null}
    </div>
  )
}

import { Button } from '@/components/ui/button'

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="mt-4 flex flex-col items-center gap-3 rounded-lg border bg-card px-6 py-12 text-center">
      <p className="text-sm font-medium">Something went wrong</p>
      <p className="max-w-sm text-sm text-muted-foreground">{message}</p>
      {onRetry !== undefined ? (
        <Button variant="outline" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  )
}

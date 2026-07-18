import { Link } from 'react-router-dom'
import { TopBar } from '@/components/layout/TopBar'
import { EmptyState } from '@/components/feedback/EmptyState'
import { Button } from '@/components/ui/button'

export default function NotFoundPage() {
  return (
    <div className="min-h-dvh">
      <TopBar />
      <main className="mx-auto max-w-5xl px-6 py-6">
        <EmptyState
          stamp="Not on file"
          description="This page or item does not exist. It may have been deleted."
        >
          <Button asChild>
            <Link to="/">Go to data rooms</Link>
          </Button>
        </EmptyState>
      </main>
    </div>
  )
}

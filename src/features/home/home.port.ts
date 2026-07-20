import type { Dataroom } from '@/core/types'
import type { DialogFlow, RemoveFlow, TargetDialogFlow } from '@/features/shared/flows.port'

export interface HomeViewPort {
  rooms: Dataroom[] | undefined
  /** roomId -> "12 files · 340 MB · Jul 12" (display-ready, view does no math) */
  roomMeta: ReadonlyMap<string, string>
  isLoading: boolean
  isError: boolean
  retry: () => void
  create: DialogFlow
  rename: TargetDialogFlow<Dataroom>
  remove: RemoveFlow<Dataroom>
}

export interface HomeViewProps {
  page: HomeViewPort
}

import NotFoundPage from '@/features/not-found/NotFoundPage'
import { FileViewerView } from '@/features/file-viewer/FileViewerView'
import { useFileViewerViewModel } from '@/features/file-viewer/use-file-viewer-vm'

export default function FileViewerPage() {
  const vm = useFileViewerViewModel()
  if (vm.notFound) return <NotFoundPage />
  return <FileViewerView vm={vm} />
}

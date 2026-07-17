import NotFoundPage from '@/pages/NotFoundPage'
import { FileViewerView } from '@/components/views/FileViewerView'
import { useFileViewerViewModel } from '@/viewmodels/use-file-viewer-vm'

export default function FileViewerPage() {
  const vm = useFileViewerViewModel()
  if (vm.notFound) return <NotFoundPage />
  return <FileViewerView vm={vm} />
}

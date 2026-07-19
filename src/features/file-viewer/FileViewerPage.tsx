import NotFoundPage from '@/features/not-found/NotFoundPage'
import { FileViewerView } from '@/features/file-viewer/FileViewerView'
import { useFileViewerPage } from '@/features/file-viewer/use-file-viewer-page'

export default function FileViewerPage() {
  const props = useFileViewerPage()
  if (props.notFound) return <NotFoundPage />
  return <FileViewerView {...props} />
}

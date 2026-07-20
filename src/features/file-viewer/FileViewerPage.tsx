import NotFoundPage from '@/features/not-found/NotFoundPage'
import { FileViewerView } from '@/features/file-viewer/FileViewerView'
import { useFileViewerPage } from '@/features/file-viewer/use-file-viewer-page'

export default function FileViewerPage() {
  const page = useFileViewerPage()
  if (page.notFound) return <NotFoundPage />
  return <FileViewerView page={page} />
}

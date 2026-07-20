import NotFoundPage from '@/features/not-found/NotFoundPage'
import { FolderView } from '@/features/folder/FolderView'
import { useFolderPage } from '@/features/folder/use-folder-page'

export default function FolderPage() {
  const page = useFolderPage()
  if (page.notFound) return <NotFoundPage />
  return <FolderView page={page} />
}

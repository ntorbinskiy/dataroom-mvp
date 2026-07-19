import NotFoundPage from '@/features/not-found/NotFoundPage'
import { FolderView } from '@/features/folder/FolderView'
import { useFolderPage } from '@/features/folder/use-folder-page'

export default function FolderPage() {
  const props = useFolderPage()
  if (props.notFound) return <NotFoundPage />
  return <FolderView {...props} />
}

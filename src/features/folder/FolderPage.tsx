import NotFoundPage from '@/features/not-found/NotFoundPage'
import { FolderView } from '@/features/folder/FolderView'
import { useFolderViewModel } from '@/features/folder/use-folder-vm'

export default function FolderPage() {
  const vm = useFolderViewModel()
  if (vm.notFound) return <NotFoundPage />
  return <FolderView vm={vm} />
}

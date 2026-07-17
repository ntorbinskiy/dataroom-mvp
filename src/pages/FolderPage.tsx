import NotFoundPage from '@/pages/NotFoundPage'
import { FolderView } from '@/components/views/FolderView'
import { useFolderViewModel } from '@/viewmodels/use-folder-vm'

export default function FolderPage() {
  const vm = useFolderViewModel()
  if (vm.notFound) return <NotFoundPage />
  return <FolderView vm={vm} />
}

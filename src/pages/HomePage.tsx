import { HomeView } from '@/components/views/HomeView'
import { useHomeViewModel } from '@/viewmodels/use-home-vm'

export default function HomePage() {
  const vm = useHomeViewModel()
  return <HomeView vm={vm} />
}

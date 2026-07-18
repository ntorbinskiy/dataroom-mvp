import { HomeView } from '@/features/home/HomeView'
import { useHomeViewModel } from '@/features/home/use-home-vm'

export default function HomePage() {
  const vm = useHomeViewModel()
  return <HomeView vm={vm} />
}

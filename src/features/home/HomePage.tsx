import { HomeView } from '@/features/home/HomeView'
import { useHomePage } from '@/features/home/use-home-page'

export default function HomePage() {
  return <HomeView {...useHomePage()} />
}

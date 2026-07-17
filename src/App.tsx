import { Route, Routes } from 'react-router-dom'
import HomePage from '@/pages/HomePage'
import FolderPage from '@/pages/FolderPage'
import FileViewerPage from '@/pages/FileViewerPage'
import NotFoundPage from '@/pages/NotFoundPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/d/:dataroomId" element={<FolderPage />} />
      <Route path="/d/:dataroomId/folder/:folderId" element={<FolderPage />} />
      <Route path="/d/:dataroomId/file/:fileId" element={<FileViewerPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

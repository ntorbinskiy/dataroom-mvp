import { Route, Routes } from 'react-router-dom'
import HomePage from '@/features/home/HomePage'
import FolderPage from '@/features/folder/FolderPage'
import FileViewerPage from '@/features/file-viewer/FileViewerPage'
import NotFoundPage from '@/features/not-found/NotFoundPage'

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

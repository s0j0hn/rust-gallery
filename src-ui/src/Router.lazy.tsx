import { lazy, Suspense, FC } from 'react'
import { Routes, Route } from 'react-router-dom'

// Lazy load page components for code splitting
const FolderList = lazy(() => import('./pages/FolderList'))
const FolderDetail = lazy(() => import('./pages/FolderDetail'))
const TagView = lazy(() => import('./pages/TagView'))
const ApiDocs = lazy(() => import('./pages/ApiDocs'))

// Loading component
const PageLoader: FC = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
)

const LazyRouter: FC = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<FolderList />} />
        <Route path="/folder/:folderName" element={<FolderDetail />} />
        <Route path="/tag/:tagName" element={<TagView />} />
        <Route path="/api-docs" element={<ApiDocs />} />
      </Routes>
    </Suspense>
  )
}

export default LazyRouter

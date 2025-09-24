import { useEffect, useState, FC } from 'react' // Added useState import
import { useNavigate, useSearchParams } from 'react-router-dom'
import MenuSection from '../components/MenuSection'
import FolderCard from '../components/FolderCard'
import DeleteDialog from '../components/DeleteDialog'
import TagDialog from '../components/TagDialog'
import RandomPhotoView from '../components/RandomPhotoView'
import { useFolders } from '../hooks/useFolders'
import { useUI } from '../hooks/useUI'
import { useInfiniteScroll } from '../hooks/useInfiniteScroll'

const FolderList: FC = () => {
  // Add state for menu open/close
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const {
    filteredFolders,
    loading,
    searchQuery,
    selectedRoot,
    setSearchQuery,
    setSelectedRoot,
    deleteFolder,
    refreshFolders,
    fetchRoots,
    fetchTags,
    // startIndexation,
    // isIndexing,
    hasMore,
    loadMoreFolders,
  } = useFolders()

  const {
    tagDialogOpen,
    deleteDialogOpen,
    randomPhotoDialogOpen,
    selectedFolder,
    folderToDelete,
    randomPhotos,
    openTagDialog,
    closeTagDialog,
    openDeleteDialog,
    closeDeleteDialog,
    openRandomPhotos,
  } = useUI()

  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const loadMoreRef = useInfiniteScroll({
    onLoadMore: loadMoreFolders,
    hasMore,
    loading,
  })

  // Initialize data fetching on component mount
  useEffect(() => {
    const initializeData = async () => {
      await fetchRoots()
      await fetchTags()
      await refreshFolders()
    }
    initializeData()
  }, [fetchRoots, fetchTags, refreshFolders])

  // Read root from URL parameters when component mounts
  useEffect(() => {
    const rootParam = searchParams.get('root')
    if (rootParam && rootParam !== selectedRoot) {
      setSelectedRoot(rootParam)
    } else if (!rootParam && selectedRoot) {
      // If there's no root param but we have a selected root,
      // this could be from a direct navigation, so update URL
      updateRootInUrl(selectedRoot)
    }
  }, [])

  // Read searchBy from URL parameters when component mounts
  useEffect(() => {
    const searchParam = searchParams.get('searchBy')
    if (searchParam && searchParam !== searchQuery) {
      setSearchQuery(searchParam)
    } else if (!searchParam && searchQuery) {
      // If there's no root param but we have a selected root,
      // this could be from a direct navigation, so update URL
      updateSearchInUrl(searchQuery)
    }
  }, [])

  // Update URL and refresh folders when selectedRoot changes
  useEffect(() => {
    //refreshConfig()
    updateRootInUrl(selectedRoot)
    // Refresh folders when root changes (but not on initial mount)
    if (selectedRoot !== null) {
      refreshFolders()
    }
  }, [selectedRoot, refreshFolders])

  // Refresh folders when search query changes
  useEffect(() => {
    // Only refresh if not initial mount
    if (searchQuery !== '') {
      refreshFolders()
    }
  }, [searchQuery, refreshFolders])

  // Helper to update URL with root parameter
  const updateRootInUrl = (root: string | null) => {
    if (root) {
      setSearchParams({ root })
    } else {
      // Remove the root parameter for "All Roots"
      searchParams.delete('root')
      setSearchParams(searchParams)
    }
  }

  const updateSearchInUrl = (searchBy: string | null) => {
    if (searchBy) {
      setSearchParams({ searchBy })
    } else {
      // Remove the root parameter for "All Roots"
      searchParams.delete('searchBy')
      setSearchParams(searchParams)
    }
  }

  const handleTagClick = (type: 'tag' | 'root', value: string) => {
    if (type === 'tag') {
      navigate(`/tag/${value}`)
    } else if (type === 'root') {
      setSelectedRoot(value)
      // URL will be updated by the effect
    }
  }

  const handleViewFolder = (folderTitle: string) => {
    navigate(`/folder/${folderTitle}`)
  }

  const handleDeleteConfirm = async () => {
    if (folderToDelete) {
      await deleteFolder(folderToDelete.title)
      closeDeleteDialog()
    }
  }

  const handleRandomPhotos = async (_folderName: string) => {
    // For now, just pass an empty array to openRandomPhotos
    // In the future, you could fetch photos from the API here
    openRandomPhotos([])
  }

  const handleApiDocsClick = () => {
    navigate('/api-docs')
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">Gallery NAS</h1>

        <MenuSection
          onTagClick={handleTagClick}
          onApiDocsClick={handleApiDocsClick}
          isOpen={isMenuOpen} // Pass the open state to MenuSection
          onClose={() => setIsMenuOpen(false)} // Add close handler
        />

        {filteredFolders.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">No folders found</h2>
            <p className="text-gray-600">
              {selectedRoot
                ? `No folders in folder "${selectedRoot}"${searchQuery ? ` matching "${searchQuery}"` : ''}`
                : `No folders match your search criteria "${searchQuery}"`}
            </p>
            <div className="mt-4 flex flex-col md:flex-row justify-center gap-2">
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                >
                  Clear Search
                </button>
              )}
              {selectedRoot && (
                <button
                  onClick={() => setSelectedRoot('')}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
                >
                  Show All Roots
                </button>
              )}
            </div>
          </div>
        )}

        {/* Folder Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
          {filteredFolders.map((folder) => (
            <FolderCard
              key={folder.title}
              folder={folder}
              onView={handleViewFolder}
              onTagClick={handleTagClick}
              onTagManage={openTagDialog}
              onRandomPhoto={handleRandomPhotos}
              onDelete={openDeleteDialog}
            />
          ))}
        </div>

        {/* Loading indicator and intersection observer target */}
        {hasMore && (
          <div ref={loadMoreRef} className="flex justify-center items-center py-8 mb-16">
            {loading && (
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            )}
          </div>
        )}
      </div>

      {/* Dialogs */}
      {tagDialogOpen && selectedFolder && (
        <TagDialog folder={selectedFolder} onCancel={closeTagDialog} onSave={closeTagDialog} />
      )}

      {deleteDialogOpen && folderToDelete && (
        <DeleteDialog
          folder={folderToDelete}
          onCancel={closeDeleteDialog}
          onConfirm={handleDeleteConfirm}
        />
      )}

      {randomPhotoDialogOpen && randomPhotos && <RandomPhotoView photos={randomPhotos} />}
    </div>
  )
}

export default FolderList

import { FC } from 'react'
import { useInView } from 'react-intersection-observer'
import FolderCard from './FolderCard'
import { Folder } from '../types/gallery'

interface VirtualFolderListProps {
  folders: Folder[]
  onView: (folderName: string) => void
  onTagClick: (type: 'tag' | 'root', value: string) => void
  onTagManage: (folder: Folder) => void
  onRandomPhoto: (folderName: string) => void
  onDelete: (album: Folder) => void
  hasMore: boolean
  onLoadMore: () => void
  loading: boolean
}

const VirtualFolderList: FC<VirtualFolderListProps> = ({
  folders,
  onView,
  onTagClick,
  onTagManage,
  onRandomPhoto,
  onDelete,
  hasMore,
  onLoadMore,
  loading,
}) => {
  // Infinite scroll trigger
  const { ref: loadMoreRef } = useInView({
    threshold: 0.1,
    onChange: (inView) => {
      if (inView && hasMore && !loading) {
        onLoadMore()
      }
    },
  })

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {folders.map((folder) => (
          <FolderCard
            key={folder.title}
            folder={folder}
            onView={onView}
            onTagClick={onTagClick}
            onTagManage={onTagManage}
            onRandomPhoto={onRandomPhoto}
            onDelete={onDelete}
          />
        ))}
      </div>

      {/* Load more trigger */}
      {hasMore && (
        <div ref={loadMoreRef} className="h-20 flex items-center justify-center">
          {loading && (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          )}
        </div>
      )}
    </div>
  )
}

export default VirtualFolderList

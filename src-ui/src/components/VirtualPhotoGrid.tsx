import { useRef, useMemo, useEffect, FC } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { JsonFilePhoto } from '../schemas/gallery.schema'

interface VirtualPhotoGridProps {
  photos: JsonFilePhoto[]
  onPhotoClick: (photo: JsonFilePhoto, index: number) => void
  loading?: boolean
  hasMore?: boolean
  onLoadMore?: () => void
}

const VirtualPhotoGrid: FC<VirtualPhotoGridProps> = ({
  photos,
  onPhotoClick,
  loading,
  hasMore,
  onLoadMore,
}) => {
  const parentRef = useRef<HTMLDivElement>(null)

  // Calculate columns based on screen width
  const columnCount = useMemo(() => {
    const width = window.innerWidth
    if (width < 640) return 2 // mobile
    if (width < 1024) return 3 // tablet
    if (width < 1536) return 4 // desktop
    return 5 // large desktop
  }, [])

  // Group photos into rows
  const rows = useMemo(() => {
    const result: JsonFilePhoto[][] = []
    for (let i = 0; i < photos.length; i += columnCount) {
      result.push(photos.slice(i, i + columnCount))
    }
    return result
  }, [photos, columnCount])

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 300, // Estimated row height
    overscan: 5,
  })

  // Handle reaching the end for infinite scroll
  useEffect(() => {
    const items = rowVirtualizer.getVirtualItems()
    const lastItem = items[items.length - 1]

    if (lastItem && lastItem.index === rows.length - 1 && hasMore && !loading && onLoadMore) {
      onLoadMore()
    }
  }, [rowVirtualizer.getVirtualItems(), rows.length, hasMore, loading, onLoadMore])

  return (
    <div
      ref={parentRef}
      className="h-screen overflow-auto"
      style={{
        contain: 'strict',
      }}
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const row = rows[virtualRow.index]
          return (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
                display: 'grid',
                gap: '8px',
                gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
              }}
            >
              {row.map((photo, colIndex) => {
                const globalIndex = virtualRow.index * columnCount + colIndex
                return (
                  <div
                    key={photo.id}
                    className="relative group cursor-pointer overflow-hidden rounded-lg bg-gray-100"
                    onClick={() => onPhotoClick(photo, globalIndex)}
                  >
                    <img
                      src={`/files/thumbnail?folder=${encodeURIComponent(
                        photo.folder_name
                      )}&file=${encodeURIComponent(photo.filename)}&width=300&height=300`}
                      alt={photo.filename}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity duration-300" />
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <p className="text-white text-sm truncate">{photo.filename}</p>
                      <p className="text-white/80 text-xs">
                        {photo.width} × {photo.height}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      )}
    </div>
  )
}

export default VirtualPhotoGrid

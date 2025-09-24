import { useCallback, useEffect, useState } from 'react'
import {
  cacheImageUrl,
  clearImageCache,
  generateThumbnailUrl,
  getCachedImageUrl,
  getCacheStats,
  preloadImage,
} from '../utils/imageCacheUtils'

interface ImageCacheStats {
  size: number
  oldestEntry: number
  newestEntry: number
}

export const useImageCache = () => {
  const [stats, setStats] = useState<ImageCacheStats>({
    size: 0,
    oldestEntry: 0,
    newestEntry: 0,
  })

  // Update stats on initial load
  useEffect(() => {
    setStats(getCacheStats())

    // Set up event listener for storage changes from other tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'thumbnailCache' || e.key === null) {
        setStats(getCacheStats())
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // Get image URL (cached or fresh)
  const getImageUrl = useCallback(
    (thumbnail: number, folderName: string, width: number = 300, height: number = 400): string => {
      const cachedUrl = getCachedImageUrl(thumbnail, folderName, width, height)
      if (cachedUrl) return cachedUrl

      const url = generateThumbnailUrl(thumbnail, folderName, width, height)
      cacheImageUrl(thumbnail, folderName, width, height)
      return url
    },
    []
  )

  // Cache an image URL
  const cacheImage = useCallback(
    (thumbnail: number, folderName: string, width: number = 300, height: number = 400): void => {
      cacheImageUrl(thumbnail, folderName, width, height)
      setStats(getCacheStats())
    },
    []
  )

  // Preload an image
  const preload = useCallback(
    async (
      thumbnail: number,
      folderName: string,
      width: number = 300,
      height: number = 400
    ): Promise<void> => {
      await preloadImage(thumbnail, folderName, width, height)
      setStats(getCacheStats())
    },
    []
  )

  // Clear the entire cache
  const clearCache = useCallback((): void => {
    clearImageCache()
    setStats(getCacheStats())
  }, [])

  // Bulk preload multiple images
  const preloadBatch = useCallback(
    async (
      thumbnails: number[],
      folderName: string,
      width: number = 300,
      height: number = 400
    ): Promise<void> => {
      // Load up to 5 images at a time
      const batchSize = 5

      for (let i = 0; i < thumbnails.length; i += batchSize) {
        const batch = thumbnails.slice(i, i + batchSize)
        await Promise.all(
          batch.map((thumbnail) => preloadImage(thumbnail, folderName, width, height))
        )
      }

      setStats(getCacheStats())
    },
    []
  )

  return {
    getImageUrl,
    cacheImage,
    preload,
    preloadBatch,
    clearCache,
    stats,
  }
}

export default useImageCache

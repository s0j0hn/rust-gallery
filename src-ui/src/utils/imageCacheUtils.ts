// Define types for our cache
interface CachedImage {
    url: string
    timestamp: number
    width: number
    height: number
}

interface ImageCache {
    [key: string]: CachedImage
}

// Maximum number of entries to store in the cache
const MAX_CACHE_SIZE = 2000

// How long to keep images in cache (7 days in milliseconds)
const CACHE_EXPIRY_TIME = 7 * 24 * 60 * 60 * 1000

// Base URL for the API (should be moved to environment variables in production)
const API_BASE_URL = 'http://192.168.1.27:8000'

/**
 * Generates a cache key for an image
 */
export const generateImageKey = (
    thumbnail: number,
    folderName: string,
    width: number,
    height: number
): string => {
    return `thumb_${folderName}_${thumbnail}_${width}x${height}`
}

/**
 * Generates the full URL for a thumbnail
 */
export const generateThumbnailUrl = (
    thumbnail: number,
    folderName: string,
    width: number,
    height: number
): string => {
    return `${API_BASE_URL}/folders/thumbnail/folder/download?number=${thumbnail}&folder=${folderName}&width=${width}&height=${height}`
}

/**
 * Stores an image URL in localStorage cache
 */
export const cacheImageUrl = (
    thumbnail: number,
    folderName: string,
    width: number = 300,
    height: number = 400
): void => {
    try {
        // Generate the URL and cache key
        const url = generateThumbnailUrl(thumbnail, folderName, width, height)
        const key = generateImageKey(thumbnail, folderName, width, height)

        // Get the existing cache or initialize a new one
        const cacheJson = localStorage.getItem('thumbnailCache')
        const cache: ImageCache = cacheJson ? JSON.parse(cacheJson) : {}

        // Add or update the entry
        cache[key] = {
            url,
            timestamp: Date.now(),
            width,
            height,
        }

        // Clean up old entries if we exceed the maximum cache size
        cleanupCache(cache)

        // Save the updated cache
        localStorage.setItem('thumbnailCache', JSON.stringify(cache))
    } catch (error) {
        console.error('Error caching image URL:', error)
    }
}

/**
 * Gets a cached image URL if available
 */
export const getCachedImageUrl = (
    thumbnail: number,
    folderName: string,
    width: number = 300,
    height: number = 400
): string | null => {
    try {
        const key = generateImageKey(thumbnail, folderName, width, height)

        // Get the cache
        const cacheJson = localStorage.getItem('thumbnailCache')
        if (!cacheJson) return null

        const cache: ImageCache = JSON.parse(cacheJson)
        const cachedImage = cache[key]

        // Check if the image exists and hasn't expired
        if (
            cachedImage &&
            Date.now() - cachedImage.timestamp < CACHE_EXPIRY_TIME
        ) {
            return cachedImage.url
        }

        // If the image has expired, remove it from the cache
        if (cachedImage) {
            delete cache[key]
            localStorage.setItem('thumbnailCache', JSON.stringify(cache))
        }

        return null
    } catch (error) {
        console.error('Error retrieving cached image URL:', error)
        return null
    }
}

/**
 * Preloads an image into the browser cache
 */
export const preloadImage = (
    thumbnail: number,
    folderName: string,
    width: number = 300,
    height: number = 400
): Promise<void> => {
    return new Promise((resolve, reject) => {
        // Get the URL (from cache or generate a new one)
        let url = getCachedImageUrl(thumbnail, folderName, width, height)
        if (!url) {
            url = generateThumbnailUrl(thumbnail, folderName, width, height)
            cacheImageUrl(thumbnail, folderName, width, height)
        }

        // Create a new image to preload
        const img = new Image()
        img.onload = () => resolve()
        img.onerror = () => reject(new Error('Failed to preload image'))
        img.src = url
    })
}

/**
 * Removes old entries when the cache exceeds the maximum size
 */
const cleanupCache = (cache: ImageCache): void => {
    const keys = Object.keys(cache)

    // If we haven't reached the limit, no need to clean up
    if (keys.length <= MAX_CACHE_SIZE) return

    // Sort the keys by timestamp (oldest first)
    const sortedKeys = keys.sort(
        (a, b) => cache[a].timestamp - cache[b].timestamp
    )

    // Remove oldest entries until we're under the limit
    const keysToRemove = sortedKeys.slice(0, keys.length - MAX_CACHE_SIZE)
    keysToRemove.forEach((key) => {
        delete cache[key]
    })
}

/**
 * Clears all cached image URLs
 */
export const clearImageCache = (): void => {
    localStorage.removeItem('thumbnailCache')
}

/**
 * Gets cache statistics
 */
export const getCacheStats = (): {
    size: number
    oldestEntry: number
    newestEntry: number
} => {
    try {
        const cacheJson = localStorage.getItem('thumbnailCache')
        if (!cacheJson) return { size: 0, oldestEntry: 0, newestEntry: 0 }

        const cache: ImageCache = JSON.parse(cacheJson)
        const keys = Object.keys(cache)

        if (keys.length === 0)
            return { size: 0, oldestEntry: 0, newestEntry: 0 }

        const timestamps = keys.map((key) => cache[key].timestamp)

        return {
            size: keys.length,
            oldestEntry: Math.min(...timestamps),
            newestEntry: Math.max(...timestamps),
        }
    } catch (error) {
        console.error('Error getting cache stats:', error)
        return { size: 0, oldestEntry: 0, newestEntry: 0 }
    }
}

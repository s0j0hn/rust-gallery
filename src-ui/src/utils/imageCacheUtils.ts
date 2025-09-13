import {
    API_BASE_URL as CONFIG_API_BASE_URL,
    CACHE_CONFIG,
} from '../config/constants'

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

// Cache configuration constants
const MAX_CACHE_SIZE = 2000
const CACHE_EXPIRY_TIME = CACHE_CONFIG.MAX_AGE_MS
const API_BASE_URL = CONFIG_API_BASE_URL
const CACHE_STORAGE_KEY = 'thumbnailCache'

// In-memory cache for the current session to avoid repeated localStorage access
let memoryCache: ImageCache | null = null
let memoryCacheLoaded = false

// Batch operations queue
interface BatchOperation {
    key: string
    value: CachedImage
}
let batchQueue: BatchOperation[] = []
let batchTimeout: NodeJS.Timeout | null = null

/**
 * Loads cache from localStorage into memory
 */
const loadMemoryCache = (): ImageCache => {
    if (memoryCacheLoaded && memoryCache) {
        return memoryCache
    }

    try {
        const cacheJson = localStorage.getItem(CACHE_STORAGE_KEY)
        const cache: ImageCache = cacheJson ? JSON.parse(cacheJson) : {}
        memoryCache = cache
        memoryCacheLoaded = true
        return cache
    } catch (error) {
        console.error('Error loading cache from localStorage:', error)
        const cache: ImageCache = {}
        memoryCache = cache
        memoryCacheLoaded = true
        return cache
    }
}

/**
 * Processes batched cache operations
 */
const processBatchOperations = (): void => {
    if (batchQueue.length === 0) return

    try {
        const cache = loadMemoryCache()

        // Apply all batch operations
        batchQueue.forEach(({ key, value }) => {
            cache[key] = value
        })

        // Clean up if needed
        cleanupCache(cache)

        // Save to localStorage
        localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(cache))

        // Update memory cache
        memoryCache = cache

        // Clear the batch queue
        batchQueue = []
    } catch (error) {
        // Handle quota exceeded error
        if (
            error instanceof DOMException &&
            error.name === 'QuotaExceededError'
        ) {
            console.warn(
                'localStorage quota exceeded, clearing old cache entries'
            )
            try {
                // Clear half of the cache and retry
                const cache = loadMemoryCache()
                const keys = Object.keys(cache)
                const sortedKeys = keys.sort(
                    (a, b) => cache[a].timestamp - cache[b].timestamp
                )
                const keysToRemove = sortedKeys.slice(
                    0,
                    Math.floor(keys.length / 2)
                )
                keysToRemove.forEach((key) => delete cache[key])

                // Apply pending operations
                batchQueue.forEach(({ key, value }) => {
                    cache[key] = value
                })

                localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(cache))
                memoryCache = cache
                batchQueue = []
            } catch (retryError) {
                console.error(
                    'Failed to save cache even after cleanup:',
                    retryError
                )
                // Clear everything as last resort
                clearImageCache()
            }
        } else {
            console.error('Error processing batch operations:', error)
        }
    }
}

/**
 * Schedules a batch operation
 */
const scheduleBatchOperation = (key: string, value: CachedImage): void => {
    // Add to queue
    batchQueue.push({ key, value })

    // Clear existing timeout
    if (batchTimeout) {
        clearTimeout(batchTimeout)
    }

    // Schedule batch processing (debounced to 100ms)
    batchTimeout = setTimeout(() => {
        processBatchOperations()
        batchTimeout = null
    }, 100)
}

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
 * Stores an image URL in cache (batched operation)
 */
export const cacheImageUrl = (
    thumbnail: number,
    folderName: string,
    width: number = 300,
    height: number = 400
): void => {
    try {
        const url = generateThumbnailUrl(thumbnail, folderName, width, height)
        const key = generateImageKey(thumbnail, folderName, width, height)

        const cacheEntry: CachedImage = {
            url,
            timestamp: Date.now(),
            width,
            height,
        }

        // Update memory cache immediately
        const cache = loadMemoryCache()
        cache[key] = cacheEntry

        // Schedule batch save to localStorage
        scheduleBatchOperation(key, cacheEntry)
    } catch (error) {
        console.error('Error caching image URL:', error)
    }
}

/**
 * Gets a cached image URL if available (from memory cache)
 */
export const getCachedImageUrl = (
    thumbnail: number,
    folderName: string,
    width: number = 300,
    height: number = 400
): string | null => {
    try {
        const key = generateImageKey(thumbnail, folderName, width, height)
        const cache = loadMemoryCache()
        const cachedImage = cache[key]

        // Check if the image exists and hasn't expired
        if (
            cachedImage &&
            Date.now() - cachedImage.timestamp < CACHE_EXPIRY_TIME
        ) {
            return cachedImage.url
        }

        // If the image has expired, remove it from cache
        if (cachedImage) {
            delete cache[key]
            // Schedule cleanup
            scheduleBatchOperation(key, null as any)
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
    localStorage.removeItem(CACHE_STORAGE_KEY)
    memoryCache = {}
    memoryCacheLoaded = true
    batchQueue = []
    if (batchTimeout) {
        clearTimeout(batchTimeout)
        batchTimeout = null
    }
}

/**
 * Gets cache statistics
 */
export const getCacheStats = (): {
    size: number
    oldestEntry: number
    newestEntry: number
    memoryCacheSize: number
    batchQueueSize: number
} => {
    try {
        const cache = loadMemoryCache()
        const keys = Object.keys(cache)

        if (keys.length === 0) {
            return {
                size: 0,
                oldestEntry: 0,
                newestEntry: 0,
                memoryCacheSize: 0,
                batchQueueSize: batchQueue.length,
            }
        }

        const timestamps = keys.map((key) => cache[key].timestamp)

        return {
            size: keys.length,
            oldestEntry: Math.min(...timestamps),
            newestEntry: Math.max(...timestamps),
            memoryCacheSize: keys.length,
            batchQueueSize: batchQueue.length,
        }
    } catch (error) {
        console.error('Error getting cache stats:', error)
        return {
            size: 0,
            oldestEntry: 0,
            newestEntry: 0,
            memoryCacheSize: 0,
            batchQueueSize: 0,
        }
    }
}

/**
 * Force flush any pending batch operations
 */
export const flushCache = (): void => {
    if (batchTimeout) {
        clearTimeout(batchTimeout)
        batchTimeout = null
    }
    if (batchQueue.length > 0) {
        processBatchOperations()
    }
}

// Auto-flush on page unload
if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', flushCache)
}

// Periodic cleanup (every hour)
if (typeof window !== 'undefined') {
    setInterval(() => {
        const cache = loadMemoryCache()
        const now = Date.now()
        let hasChanges = false

        // Remove expired entries
        Object.keys(cache).forEach((key) => {
            if (now - cache[key].timestamp > CACHE_EXPIRY_TIME) {
                delete cache[key]
                hasChanges = true
            }
        })

        if (hasChanges) {
            localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(cache))
            memoryCache = cache
        }
    }, CACHE_CONFIG.CLEANUP_INTERVAL_MS)
}

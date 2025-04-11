import React, { FC, useEffect, useState } from 'react'
import useImageCache from '../hooks/useImageCache'

interface CacheManagerProps {
    onClose: () => void
}

interface CachedItem {
    key: string
    folderName: string
    thumbnail: number
    timestamp: number
    url: string
}

const CacheManager: FC<CacheManagerProps> = ({ onClose }) => {
    const { stats, clearCache } = useImageCache()
    const [cachedItems, setCachedItems] = useState<CachedItem[]>([])

    // Load some cached items as examples
    useEffect(() => {
        try {
            const cacheJson = localStorage.getItem('thumbnailCache')
            if (!cacheJson) return

            const cache = JSON.parse(cacheJson)
            const items: CachedItem[] = []

            Object.keys(cache).forEach((key) => {
                // Parse the key format: thumb_folderName_thumbnail_widthxheight
                const parts = key.split('_')
                if (parts.length >= 3) {
                    const folderName = parts[1]
                    const thumbnail = parseInt(parts[2], 10)

                    items.push({
                        key,
                        folderName,
                        thumbnail,
                        timestamp: cache[key].timestamp,
                        url: cache[key].url,
                    })
                }
            })

            // Sort by newest first and limit to 6 items
            const sorted = items
                .sort((a, b) => b.timestamp - a.timestamp)
                .slice(0, 6)

            setCachedItems(sorted)
        } catch (error) {
            console.error('Error loading cached items:', error)
        }
    }, [stats.size])

    // Format timestamp to human-readable date
    const formatDate = (timestamp: number): string => {
        if (timestamp === 0) return 'N/A'
        return new Date(timestamp).toLocaleString()
    }

    // Format byte size to KB/MB
    const formatCacheSize = (size: number): string => {
        // Rough estimate - each entry is about 200 bytes
        const totalBytes = size * 200

        if (totalBytes < 1024) {
            return `${totalBytes} bytes`
        } else if (totalBytes < 1024 * 1024) {
            return `${(totalBytes / 1024).toFixed(2)} KB`
        } else {
            return `${(totalBytes / (1024 * 1024)).toFixed(2)} MB`
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-lg">
                <h2 className="text-xl font-bold mb-4">Image Cache Manager</h2>

                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold mb-2">Cache Statistics</h3>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <p>
                                <strong>Cached Images:</strong> {stats.size}
                            </p>
                            <p>
                                <strong>Estimated Size:</strong>{' '}
                                {formatCacheSize(stats.size)}
                            </p>
                        </div>
                        <div>
                            <p>
                                <strong>Oldest Cached:</strong>{' '}
                                {formatDate(stats.oldestEntry)}
                            </p>
                            <p>
                                <strong>Newest Cached:</strong>{' '}
                                {formatDate(stats.newestEntry)}
                            </p>
                        </div>
                    </div>
                </div>

                {cachedItems.length > 0 && (
                    <div className="mb-6">
                        <h3 className="font-semibold mb-2">
                            Recent Cached Thumbnails
                        </h3>
                        <div className="grid grid-cols-3 gap-2">
                            {cachedItems.map((item) => (
                                <div
                                    key={item.key}
                                    className="relative overflow-hidden rounded h-20 bg-gray-200"
                                >
                                    <img
                                        src={item.url}
                                        alt={`${item.folderName} thumbnail`}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 truncate">
                                        {item.folderName}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex justify-end space-x-2">
                    <button
                        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
                        onClick={() => {
                            if (
                                window.confirm(
                                    'Are you sure you want to clear the thumbnail cache?'
                                )
                            ) {
                                clearCache()
                                setCachedItems([])
                            }
                        }}
                    >
                        Clear Cache
                    </button>
                    <button
                        className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition"
                        onClick={onClose}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    )
}

export default CacheManager

// src/components/ThumbnailSlideshow.tsx
import React, { FC, useEffect, useState, useCallback } from 'react'
import {
    getCachedImageUrl,
    cacheImageUrl,
    preloadImage,
    generateThumbnailUrl,
} from '../utils/imageCacheUtils'

interface ThumbnailSlideshowProps {
    thumbnails: number[]
    folderName: string
}

const ThumbnailSlideshow: FC<ThumbnailSlideshowProps> = ({
    thumbnails,
    folderName,
}) => {
    const [currentIndex, setCurrentIndex] = useState<number>(0)
    const [loadedImages, setLoadedImages] = useState<Record<number, boolean>>(
        {}
    )
    const [isTouching, setIsTouching] = useState<boolean>(false)
    const [touchStartX, setTouchStartX] = useState<number | null>(null)

    // Get image URL with caching
    const getImageUrl = useCallback(
        (thumbnail: number, isThumbnail: boolean = false) => {
            const width = isThumbnail ? 150 : 300
            const height = isThumbnail ? 200 : 400

            // Try to get from cache first
            const cachedUrl = getCachedImageUrl(
                thumbnail,
                folderName,
                width,
                height
            )
            if (cachedUrl) {
                return cachedUrl
            }

            // If not in cache, generate and cache the URL
            const url = generateThumbnailUrl(
                thumbnail,
                folderName,
                width,
                height
            )
            cacheImageUrl(thumbnail, folderName, width, height)
            return url
        },
        [folderName]
    )

    // Reset loaded state when thumbnails change
    useEffect(() => {
        setLoadedImages({})
    }, [thumbnails])

    // Set up interval for changing thumbnails when not being touched
    useEffect(() => {
        if (isTouching || thumbnails.length === 0) return

        const interval = setInterval(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % thumbnails.length)
        }, 5000)

        return () => clearInterval(interval)
    }, [thumbnails.length, isTouching])

    // Preload the next few images when current index changes
    useEffect(() => {
        if (thumbnails.length === 0) return

        // Preload the next 2 images
        const preloadNextImages = async () => {
            try {
                for (let i = 1; i <= 2; i++) {
                    const nextIndex = (currentIndex + i) % thumbnails.length
                    await preloadImage(thumbnails[nextIndex], folderName)
                }
            } catch (error) {
                console.error('Error preloading images:', error)
            }
        }

        preloadNextImages()
    }, [currentIndex, thumbnails, folderName])

    // Handle image load events
    const handleImageLoad = (index: number) => {
        setLoadedImages((prev) => ({ ...prev, [index]: true }))
    }

    // Check if image is loaded
    const isImageLoaded = (index: number) => !!loadedImages[index]

    // Swipe handling
    const handleTouchStart = (e: React.TouchEvent) => {
        setIsTouching(true)
        setTouchStartX(e.touches[0].clientX)
    }

    const handleTouchMove = (e: React.TouchEvent) => {
        if (touchStartX === null) return
    }

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (touchStartX === null) {
            setIsTouching(false)
            return
        }

        const touchEndX = e.changedTouches[0].clientX
        const diffX = touchStartX - touchEndX

        // If swipe was significant enough
        if (Math.abs(diffX) > 50) {
            if (diffX > 0) {
                // Swiped left - go to next
                setCurrentIndex((prev) => (prev + 1) % thumbnails.length)
            } else {
                // Swiped right - go to previous
                setCurrentIndex(
                    (prev) => (prev - 1 + thumbnails.length) % thumbnails.length
                )
            }
        }

        setTouchStartX(null)
        setIsTouching(false)
    }

    return (
        <div
            className="relative h-64 bg-gray-200 overflow-hidden"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {thumbnails.map((thumbnail, index) => {
                // Get the URLs (from cache if available)
                const regularUrl = getImageUrl(thumbnail)
                const thumbnailUrl = getImageUrl(thumbnail, true)

                return (
                    <img
                        key={index}
                        srcSet={`${thumbnailUrl} 1x, ${regularUrl} 2x`}
                        src={regularUrl}
                        alt={`Thumbnail ${index + 1}`}
                        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
                            index === currentIndex ? 'opacity-100' : 'opacity-0'
                        } ${isImageLoaded(index) ? 'block' : 'hidden'}`}
                        onLoad={() => handleImageLoad(index)}
                    />
                )
            })}

            {!isImageLoaded(currentIndex) && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            )}

            {/* Indicators */}
            <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
                {thumbnails.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrentIndex(index)}
                        className={`w-2 h-2 rounded-full border-none focus:outline-none ${
                            index === currentIndex
                                ? 'bg-white'
                                : 'bg-white bg-opacity-50'
                        }`}
                        aria-label={`Go to slide ${index + 1}`}
                    />
                ))}
            </div>

            {/* Touch hint overlay */}
            <div className="absolute inset-0 pointer-events-none flex items-center">
                <div className="w-6 h-12 mx-auto opacity-0 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <div className="animate-pulse">⟷</div>
                </div>
            </div>
        </div>
    )
}

export default ThumbnailSlideshow

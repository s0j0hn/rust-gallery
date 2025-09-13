import React, { FC, useCallback, useEffect, useState } from 'react'
import {
    cacheImageUrl,
    generateThumbnailUrl,
    getCachedImageUrl,
    preloadImage,
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
    const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set())
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
        setLoadedImages(new Set())
        setCurrentIndex(0) // Reset to first image when thumbnails change
    }, [thumbnails])

    // Set up interval for changing thumbnails when not being touched
    useEffect(() => {
        if (isTouching || thumbnails.length === 0) return

        const interval = setInterval(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % thumbnails.length)
        }, 5000)

        return () => clearInterval(interval)
    }, [thumbnails.length, isTouching])

    // Preload adjacent images when current index changes
    useEffect(() => {
        if (thumbnails.length === 0) return

        const controller = new AbortController()

        // Preload the next 2 images and previous 1 image
        const preloadAdjacentImages = async () => {
            try {
                const preloadPromises = []

                // Preload next 2 images
                for (let i = 1; i <= 2; i++) {
                    const nextIndex = (currentIndex + i) % thumbnails.length
                    if (!controller.signal.aborted) {
                        preloadPromises.push(
                            preloadImage(thumbnails[nextIndex], folderName)
                        )
                    }
                }

                // Preload previous image
                const prevIndex =
                    (currentIndex - 1 + thumbnails.length) % thumbnails.length
                if (!controller.signal.aborted) {
                    preloadPromises.push(
                        preloadImage(thumbnails[prevIndex], folderName)
                    )
                }

                await Promise.allSettled(preloadPromises)
            } catch (error) {
                if (!controller.signal.aborted) {
                    console.error('Error preloading images:', error)
                }
            }
        }

        preloadAdjacentImages()

        // Cleanup function to abort pending preloads
        return () => {
            controller.abort()
        }
    }, [currentIndex, thumbnails, folderName])

    // Handle image load events
    const handleImageLoad = useCallback((index: number) => {
        setLoadedImages((prev) => {
            const newSet = new Set(prev)
            newSet.add(index)
            return newSet
        })
    }, [])

    // Check if image is loaded
    const isImageLoaded = useCallback(
        (index: number) => loadedImages.has(index),
        [loadedImages]
    )

    // Swipe handling
    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        setIsTouching(true)
        setTouchStartX(e.touches[0].clientX)
    }, [])

    const handleTouchMove = useCallback(
        (e: React.TouchEvent) => {
            if (touchStartX === null) return
            // Prevent default to avoid scrolling while swiping
            e.preventDefault()
        },
        [touchStartX]
    )

    const handleTouchEnd = useCallback(
        (e: React.TouchEvent) => {
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
                        (prev) =>
                            (prev - 1 + thumbnails.length) % thumbnails.length
                    )
                }
            }

            setTouchStartX(null)
            setIsTouching(false)
        },
        [touchStartX, thumbnails.length]
    )

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
                        loading="lazy"
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

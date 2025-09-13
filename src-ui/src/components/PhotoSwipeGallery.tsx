import React, { FC, useEffect, useState } from 'react'
import { Gallery, Item, useGallery } from 'react-photoswipe-gallery'
import '../style/photoswipe.css'
import { JsonFilePhoto } from '../types/gallery'
import { API_BASE_URL } from '../config/constants'

interface PhotoSwipeGalleryProps {
    images: JsonFilePhoto[]
    onClick?: (index: number) => void
}

export const GalleryContent: FC<{
    images: JsonFilePhoto[]
    hidden: boolean
    openNow?: boolean
}> = ({ images, hidden, openNow }) => {
    const { open, close } = useGallery()
    const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>(
        {}
    )

    // Handle image load events
    const handleImageLoad = (photoId: string) => {
        setLoadedImages((prev) => ({ ...prev, [photoId]: true }))
    }

    // Check if image is loaded
    const isImageLoaded = (photoId: string) => !!loadedImages[photoId]

    useEffect(() => {
        if (hidden) {
            open(0)
        }
        // Delay the opening slightly to ensure refs are properly set up
        const timer = setTimeout(() => {
            // Only try to open if we have images
            if (images.length > 0) {
                if (openNow) {
                    open(0)
                }
            }
        }, 100)

        return () => {
            close()
            return clearTimeout(timer)
        }
    }, [open, close, images])

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-1">
            {images.map((image, index) => (
                <Item
                    key={image.hash}
                    original={`${API_BASE_URL}/files/${image.hash}/download`}
                    thumbnail={`${API_BASE_URL}/files/thumbnail/photo/download?hash=${image.hash}&width=400&height=300`}
                    width={image.width}
                    alt={`${image.filename}.${image.extention}`}
                    height={image.height}
                    caption={`${image.folder_name} - ${image.filename} (${image.height}x${image.width}) - ${JSON.parse(image.tags)}`}
                >
                    {({ ref, open }) => (
                        <div className="cursor-pointer bg-gray-100 rounded overflow-hidden">
                            <div className="relative pb-full">
                                <img
                                    ref={ref}
                                    hidden={hidden}
                                    srcSet={`
                                        ${API_BASE_URL}/files/thumbnail/photo/download?hash=${image.hash}&width=150&height=200 1x,
                                        ${API_BASE_URL}/files/thumbnail/photo/download?hash=${image.hash}&width=400&height=300 2x
                                    `}
                                    src={`${API_BASE_URL}/files/thumbnail/photo/download?hash=${image.hash}&width=400&height=300`}
                                    alt={`${image.filename}.${image.extention}`}
                                    loading="lazy"
                                    fetchPriority="low"
                                    onClick={open}
                                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
                                        isImageLoaded(image.hash)
                                            ? 'opacity-100'
                                            : 'opacity-0'
                                    }`}
                                    onLoad={() => handleImageLoad(image.hash)}
                                />
                                {!isImageLoaded(image.hash) && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                                        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </Item>
            ))}
        </div>
    )
}

const PhotoSwipeGallery: FC<PhotoSwipeGalleryProps> = ({ images }) => {
    return (
        <Gallery
            withCaption
            withDownloadButton
            options={{
                bgOpacity: 1,
                zoom: false,
                preload: [2, 4],
                loop: false,
                pinchToClose: false,
                closeOnVerticalDrag: false,
            }}
        >
            <div>
                <GalleryContent images={images} hidden={false} />
            </div>
        </Gallery>
    )
}

export default PhotoSwipeGallery

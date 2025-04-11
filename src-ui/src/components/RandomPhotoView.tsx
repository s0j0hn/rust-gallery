import React, { FC, useEffect } from 'react'
import { Gallery } from 'react-photoswipe-gallery'
import { RandomPhotoProps } from '../types/gallery'
import { GalleryContent } from './PhotoSwipeGallery'
import { useUI } from '../hooks/useUI'

const RandomPhotoView: FC<RandomPhotoProps> = ({ photos }) => {
    // Get the closeRandomPhotos function from context
    const { closeRandomPhotos } = useUI()

    // Add cleanup effect when component unmounts
    useEffect(() => {
        return () => {
            // This ensures the state is cleaned up even if the component is unmounted
            // without explicit closing (e.g., when navigating away)
            closeRandomPhotos()
        }
    }, [closeRandomPhotos])

    return (
        <Gallery
            withCaption
            withDownloadButton
            onOpen={(pswpInstance) => {
                pswpInstance.on('close', () => {
                    console.log('CLOSED CALLED')
                    closeRandomPhotos()
                })
            }}
            options={{
                bgOpacity: 1,
                preload: [2, 4],
                loop: false,
                zoom: false,
                pinchToClose: false,
                closeOnVerticalDrag: false,
            }}
        >
            <div>
                <GalleryContent images={photos} hidden={true} openNow={true} />
            </div>
        </Gallery>
    )
}

export default RandomPhotoView

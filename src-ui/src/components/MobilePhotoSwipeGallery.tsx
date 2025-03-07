import React, { FC, useState, useEffect } from 'react';
import { Gallery, Item } from 'react-photoswipe-gallery';
import 'photoswipe/dist/photoswipe.css';
import { Eye } from 'lucide-react';

interface PhotoSwipeImage {
    id: number;
    src: string;
    thumbnail: string;
    title: string;
    w: number;
    h: number;
}

interface MobilePhotoSwipeGalleryProps {
    images: PhotoSwipeImage[];
    className?: string;
    onClick?: (index: number) => void;
}

const MobilePhotoSwipeGallery: FC<MobilePhotoSwipeGalleryProps> = ({
                                                                       images,
                                                                       className = '',
                                                                       onClick
                                                                   }) => {
    const [touchStartX, setTouchStartX] = useState<number | null>(null);
    const [touchStartY, setTouchStartY] = useState<number | null>(null);
    const [loadedImages, setLoadedImages] = useState<Record<number, boolean>>({});

    // Reset loaded state when images change
    useEffect(() => {
        setLoadedImages({});
    }, [images]);

    // Handle image load events
    const handleImageLoad = (id: number) => {
        setLoadedImages(prev => ({ ...prev, [id]: true }));
    };

    // Check if image is loaded
    const isImageLoaded = (id: number) => !!loadedImages[id];

    // Mobile swipe detection
    const handleTouchStart = (e: React.TouchEvent) => {
        setTouchStartX(e.touches[0].clientX);
        setTouchStartY(e.touches[0].clientY);
    };

    const handleTouchEnd = (e: React.TouchEvent, index: number, openGallery: (e?: any, c?: any) => void) => {
        if (touchStartX === null || touchStartY === null) return;

        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;

        const diffX = touchStartX - touchEndX;
        const diffY = touchStartY - touchEndY;

        // If it's more of a tap than a swipe, open the gallery
        if (Math.abs(diffX) < 10 && Math.abs(diffY) < 10) {
            openGallery();
            if (onClick) onClick(index);
        }

        setTouchStartX(null);
        setTouchStartY(null);
    };


    return (
        <Gallery options={{
            showHideAnimationType: 'zoom',
            allowPanToNext: true,
            pinchToClose: true,
            closeOnVerticalDrag: true,
            wheelToZoom: true,
            padding: { top: 20, bottom: 20, left: 20, right: 20 }
        }}>
            <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-4 ${className}`}>
                {images.map((image, index) => (
                    <Item
                        key={image.id}
                        original={image.src}
                        thumbnail={image.thumbnail}
                        width={image.w}
                        height={image.h}
                        // @ts-ignore
                        title={image.title}
                    >
                        {({ ref, open }) => (
                            <div
                                className="cursor-pointer bg-gray-100 rounded overflow-hidden relative"
                                ref={ref as unknown as React.RefObject<HTMLDivElement>}
                                onTouchStart={handleTouchStart}
                                onTouchEnd={(e) => handleTouchEnd(e, index, open)}
                                onClick={open}
                            >
                                <div className="relative pb-full">
                                    <img
                                        src={image.thumbnail}
                                        alt={image.title}
                                        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${isImageLoaded(image.id) ? 'opacity-100' : 'opacity-0'}`}
                                        onLoad={() => handleImageLoad(image.id)}
                                    />
                                    {!isImageLoaded(image.id) && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                                            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black opacity-0 hover:opacity-10 transition-opacity flex items-center justify-center">
                                        <Eye size={24} className="text-white opacity-80" />
                                    </div>
                                </div>
                            </div>
                        )}
                    </Item>
                ))}
            </div>
        </Gallery>
    );
};

export default MobilePhotoSwipeGallery;
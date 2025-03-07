import React, { FC } from 'react';
import { Gallery, Item } from 'react-photoswipe-gallery';
import 'photoswipe/dist/photoswipe.css';

interface PhotoSwipeImage {
  id: number;
  src: string;
  thumbnail: string;
  title: string;
  w: number;
  h: number;
}

interface PhotoSwipeGalleryProps {
  images: PhotoSwipeImage[];
  className?: string;
  onClick?: (index: number) => void;
}

const PhotoSwipeGallery: FC<PhotoSwipeGalleryProps> = ({ images, className = '', onClick }) => {
  return (
    <Gallery>
      <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 ${className}`}>
        {images.map((image, index) => (
          <Item
            key={image.id}
            original={image.src}
            thumbnail={image.thumbnail}
            width={image.w}
            height={image.h}
          >
            {({ ref, open }) => (
              <div 
                className="cursor-pointer bg-gray-100 rounded overflow-hidden"
                ref={ref as unknown as React.RefObject<HTMLDivElement>}
                onClick={open}
              >
                <div className="relative pb-full">
                  <img 
                    src={image.thumbnail} 
                    alt={image.title}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
              </div>
            )}
          </Item>
        ))}
      </div>
    </Gallery>
  );
};

export default PhotoSwipeGallery;

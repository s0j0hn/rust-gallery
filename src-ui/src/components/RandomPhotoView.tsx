import React, {FC} from 'react';
import {Gallery, Item} from 'react-photoswipe-gallery';
import {X} from 'lucide-react';
import {RandomPhotoProps} from "../types/gallery";

const RandomPhotoView: FC<RandomPhotoProps> = ({ photo, onClose, onShowAnother, onViewAlbum }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-screen overflow-hidden">
        <div className="p-4 flex justify-between items-center border-b">
          <h3 className="text-xl font-bold">{photo.title}</h3>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-200"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="p-4">
          <Gallery>
            <Item
              original={photo.src}
              width={photo.w}
              height={photo.h}
            >
              {({ ref, open }) => (
                <img 
                  ref={ref as unknown as React.RefObject<HTMLImageElement>}
                  src={photo.src} 
                  alt={photo.title}
                  className="max-h-96 max-w-full mx-auto rounded cursor-pointer"
                  onClick={open}
                />
              )}
            </Item>
          </Gallery>
        </div>
        
        <div className="p-4 flex justify-between border-t">
          <button
            onClick={onShowAnother}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
          >
            Show Another Random
          </button>
          <button
            onClick={onViewAlbum}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
          >
            View Album
          </button>
        </div>
      </div>
    </div>
  );
};

export default RandomPhotoView;

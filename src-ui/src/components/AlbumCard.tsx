import React, { FC, MouseEvent } from 'react';
import { Camera, Tag, Play, FolderOpen, Trash2 } from 'lucide-react';
import ThumbnailSlideshow from './ThumbnailSlideshow';
import {Album} from "../types/gallery";

interface AlbumCardProps {
    album: Album;
    onView: (albumId: number) => void;
    onTagClick: (type: 'tag' | 'folder', value: string) => void;
    onTagManage: (albumId: number) => void;
    onRandomPhoto: (albumId: number) => void;
    onDelete: (album: Album) => void;
}

const AlbumCard: FC<AlbumCardProps> = ({
                                           album,
                                           onView,
                                           onTagClick,
                                           onTagManage,
                                           onRandomPhoto,
                                           onDelete
                                       }) => {
    // Detect mobile screen width
    const isMobile = window.innerWidth < 768;

    return (
        <div className="bg-white shadow-md overflow-hidden">
            <div className="relative">
                <ThumbnailSlideshow thumbnails={album.thumbnails} />
                <div
                    className="absolute top-2 right-2 px-2 py-1 bg-blue-500 text-white text-xs rounded cursor-pointer hover:bg-blue-600"
                    onClick={(e: MouseEvent<HTMLDivElement>) => {
                        e.stopPropagation();
                        onTagClick('folder', album.folder);
                    }}
                >
                    {album.folder}
                </div>
            </div>

            <div className="p-4">
                <div className="flex justify-between items-start">
                    <h2 className="text-xl font-semibold mb-2">{album.title}</h2>
                    <button
                        onClick={(e: MouseEvent<HTMLButtonElement>) => {
                            e.stopPropagation();
                            onDelete(album);
                        }}
                        className="p-2 text-red-500 hover:bg-red-100 rounded-full"
                        title="Delete album"
                        aria-label="Delete album"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>

                <p className="text-gray-600 mb-2 flex items-center">
                    <Camera size={16} className="mr-1" />
                    <span>{album.photoCount} photos</span>
                </p>

                <p className="text-gray-600 mb-4 flex items-center">
                    <FolderOpen size={16} className="mr-1" />
                    <span>{album.folder}</span>
                </p>

                {album.tags.length > 0 && (
                    <div className="mb-4 flex flex-wrap gap-2">
                        {album.tags.map(tag => (
                            <span
                                key={tag}
                                className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full cursor-pointer hover:bg-blue-200"
                                onClick={(e: MouseEvent<HTMLSpanElement>) => {
                                    e.stopPropagation();
                                    onTagClick('tag', tag);
                                }}
                            >
                {tag}
              </span>
                        ))}
                    </div>
                )}

                {isMobile ? (
                    // Mobile layout: stacked buttons
                    <div className="flex flex-col gap-2">
                        <button
                            onClick={() => onView(album.id)}
                            className="action-button py-3 bg-blue-500 text-white rounded hover:bg-blue-600 transition flex items-center justify-center"
                        >
                            <Play size={16} className="mr-2" /> View Album
                        </button>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => onRandomPhoto(album.id)}
                                className="action-button py-2 bg-green-500 text-white rounded hover:bg-green-600 transition flex items-center justify-center"
                            >
                                <Camera size={16} className="mr-1" /> Random
                            </button>
                            <button
                                onClick={() => onTagManage(album.id)}
                                className="action-button py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition flex items-center justify-center"
                            >
                                <Tag size={16} className="mr-1" /> Tags
                            </button>
                        </div>
                    </div>
                ) : (
                    // Desktop layout: grid
                    <div className="grid grid-cols-2 gap-2 mt-4">
                        <button
                            onClick={() => onView(album.id)}
                            className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition flex items-center justify-center"
                        >
                            <Play size={16} className="mr-1" /> View Album
                        </button>
                        <button
                            onClick={() => onRandomPhoto(album.id)}
                            className="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition flex items-center justify-center"
                        >
                            <Camera size={16} className="mr-1" /> Random Photo
                        </button>
                        <button
                            onClick={() => onTagManage(album.id)}
                            className="px-3 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition flex items-center justify-center col-span-2"
                        >
                            <Tag size={16} className="mr-1" /> Manage Tags
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AlbumCard;
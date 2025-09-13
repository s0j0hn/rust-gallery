import React, { FC, memo, MouseEvent } from 'react'
import { Camera, Play, Tag, Trash2 } from 'lucide-react'
import ThumbnailSlideshow from './ThumbnailSlideshow'
import { Folder } from '../types/gallery'
import { highlightText } from '../utils/highlight'
import { useFolders } from '../hooks/useFolders'

interface FolderCardProps {
    folder: Folder
    onView: (folderName: string) => void
    onTagClick: (type: 'tag' | 'root', value: string) => void
    onTagManage: (folder: Folder) => void
    onRandomPhoto: (folderName: string) => void
    onDelete: (album: Folder) => void
}

const FolderCard: FC<FolderCardProps> = memo(
    ({ folder, onView, onTagClick, onTagManage, onRandomPhoto, onDelete }) => {
        const { searchQuery } = useFolders()

        return (
            <div className="bg-white shadow-md overflow-hidden">
                <div className="relative">
                    <ThumbnailSlideshow
                        key={`thumbnail-${folder.title}-${Date.now()}`} // Add a unique key with timestamp
                        thumbnails={[1, 2, 3]}
                        folderName={folder.title}
                    />
                    <div
                        className="absolute top-2 right-2 px-2 py-1 bg-blue-500 text-white text-xs rounded cursor-pointer hover:bg-blue-600"
                        onClick={(e: MouseEvent<HTMLDivElement>) => {
                            e.stopPropagation()
                            onTagClick('root', folder.root)
                        }}
                    >
                        {folder.root}
                    </div>
                </div>

                <div className="p-4">
                    <div className="flex justify-between items-start">
                        <h2 className="text-xl font-semibold mb-2">
                            {searchQuery
                                ? highlightText(folder.title, searchQuery)
                                : folder.title}
                        </h2>
                        <button
                            onClick={(e: MouseEvent<HTMLButtonElement>) => {
                                e.stopPropagation()
                                onDelete(folder)
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
                        <span>{folder.photo_count} photos</span>
                    </p>

                    {folder.tags.length > 0 && (
                        <div className="mb-4 flex flex-wrap gap-2">
                            {folder.tags.map((tag) => (
                                <span
                                    key={tag}
                                    className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full cursor-pointer hover:bg-blue-200"
                                    onClick={(
                                        e: MouseEvent<HTMLSpanElement>
                                    ) => {
                                        e.stopPropagation()
                                        onTagClick('tag', tag)
                                    }}
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 mt-4">
                        <button
                            onClick={() => onView(folder.title)}
                            className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition flex items-center justify-center"
                        >
                            <Play size={16} className="mr-1" /> View Album
                        </button>
                        <button
                            onClick={() => onRandomPhoto(folder.title)}
                            className="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition flex items-center justify-center"
                        >
                            <Camera size={16} className="mr-1" /> Random Photo
                        </button>
                        <button
                            onClick={() => onTagManage(folder)}
                            className="px-3 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition flex items-center justify-center col-span-2"
                        >
                            <Tag size={16} className="mr-1" /> Manage Tags
                        </button>
                    </div>
                </div>
            </div>
        )
    },
    (prevProps, nextProps) => {
        // Custom comparison function for memo
        return (
            prevProps.folder.title === nextProps.folder.title &&
            prevProps.folder.photo_count === nextProps.folder.photo_count &&
            prevProps.folder.root === nextProps.folder.root &&
            JSON.stringify(prevProps.folder.tags) ===
                JSON.stringify(nextProps.folder.tags)
        )
    }
)

FolderCard.displayName = 'FolderCard'

export default FolderCard

// src/components/MenuSection.tsx
import React, { useState } from 'react'
import {
    Database, // Add this new icon
    FileText,
    FolderOpen,
    Info,
    RefreshCw,
    Search,
    Tag,
    X,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useFolders } from '../hooks/useFolders'
import { MenuSectionProps } from '../types/gallery'
import CacheManager from './CacheManager' // Import the CacheManager component

const MenuSection: React.FC<MenuSectionProps> = ({
    onTagClick,
    onApiDocsClick,
}) => {
    const [menuOpen, setMenuOpen] = useState<boolean>(false)
    const [showCacheManager, setShowCacheManager] = useState<boolean>(false) // New state for showing cache manager
    const {
        folders,
        roots,
        tags,
        searchQuery,
        setSearchQuery,
        selectedRoot,
        setSelectedRoot,
        isIndexing,
        startIndexation,
    } = useFolders()
    const navigate = useNavigate()

    // Calculate total photos
    const totalPhotos = roots.reduce(
        (total, folder) => total + folder.photo_count,
        0
    )

    // Extract unique tags from all albums
    const allTags = tags.sort()

    const handleRootClick = (rootName: string) => {
        if (rootName) {
            console.log('Click on: ' + rootName)
            setSelectedRoot(rootName)
        }
    }

    const handleTagClick = (type: 'tag' | 'root', value: string) => {
        if (onTagClick) {
            onTagClick(type, value)
        } else {
            if (type === 'tag') {
                navigate(`/tag/${value}`)
            } else if (type === 'root') {
                navigate('/', { state: { selectedRoot: value } })
                setSelectedRoot(value)
            }
        }
    }

    const handleApiDocsClick = () => {
        if (onApiDocsClick) {
            onApiDocsClick()
        } else {
            navigate('/api-docs')
        }
    }

    // New function to toggle the cache manager
    const toggleCacheManager = () => {
        setShowCacheManager(!showCacheManager)
    }

    return (
        <div
            className="mb-6 menu-section"
            data-open={menuOpen ? 'true' : 'false'}
        >
            <div className="flex justify-between items-center mb-4">
                <div className="flex space-x-2">
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition flex items-center"
                    >
                        <Info size={16} className="mr-2" />
                        {menuOpen ? 'Hide Menu' : 'Show Menu'}
                    </button>

                    <button
                        onClick={startIndexation}
                        disabled={isIndexing}
                        className={`px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition flex items-center ${isIndexing ? 'opacity-75 cursor-not-allowed' : ''}`}
                    >
                        {isIndexing ? (
                            <>
                                <RefreshCw
                                    size={16}
                                    className="mr-2 animate-spin"
                                />
                                Indexing...
                            </>
                        ) : (
                            <>
                                <RefreshCw size={16} className="mr-2" />
                                Index New Photos
                            </>
                        )}
                    </button>

                    <button
                        onClick={handleApiDocsClick}
                        className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition flex items-center"
                    >
                        <FileText size={16} className="mr-2" />
                        API Docs
                    </button>

                    {/* New Cache Manager Button */}
                    <button
                        onClick={toggleCacheManager}
                        className="px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600 transition flex items-center"
                    >
                        <Database size={16} className="mr-2" />
                        Manage Cache
                    </button>
                </div>

                <div className="relative w-full max-w-md ml-4">
                    <Search
                        size={16}
                        className="absolute left-3 top-3 text-gray-400"
                    />
                    <input
                        type="text"
                        value={searchQuery ? searchQuery : undefined}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search folders..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>
            </div>

            {menuOpen && (
                <div className="bg-white p-4 rounded-lg shadow-md mb-6 transition-all">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <h3 className="text-lg font-semibold mb-2 flex items-center">
                                <FolderOpen size={18} className="mr-2" />
                                Statistics
                            </h3>
                            <ul className="space-y-1">
                                <li className="flex items-center">
                                    <span className="mr-2">•</span>
                                    Total Albums:{' '}
                                    <span className="font-medium ml-2">
                                        {folders.length}
                                    </span>
                                </li>
                                <li className="flex items-center">
                                    <span className="mr-2">•</span>
                                    Total Photos:{' '}
                                    <span className="font-medium ml-2">
                                        {totalPhotos}
                                    </span>
                                </li>
                                <li className="flex items-center">
                                    <span className="mr-2">•</span>
                                    Total Roots:{' '}
                                    <span className="font-medium ml-2">
                                        {roots.length}
                                    </span>
                                </li>
                                <li className="flex items-center">
                                    <span className="mr-2">•</span>
                                    Total Tags:{' '}
                                    <span className="font-medium ml-2">
                                        {allTags.length}
                                    </span>
                                </li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold mb-2 flex items-center">
                                <FolderOpen size={18} className="mr-2" />
                                Roots
                            </h3>
                            <div className="flex flex-col space-y-2">
                                <div
                                    className={`px-3 py-2 rounded cursor-pointer ${!selectedRoot ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                                    onClick={() => handleRootClick('')}
                                >
                                    All Roots
                                </div>
                                {roots.map((root) => (
                                    <div
                                        key={root.root}
                                        className={`px-3 py-2 rounded cursor-pointer ${selectedRoot === root.root ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                                        onClick={() =>
                                            handleRootClick(root.root)
                                        }
                                    >
                                        {root.root}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold mb-2 flex items-center">
                                <Tag size={18} className="mr-2" />
                                Available Tags
                            </h3>
                            {allTags.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {allTags.map((tag) => (
                                        <span
                                            key={tag}
                                            className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full cursor-pointer hover:bg-blue-200"
                                            onClick={() =>
                                                handleTagClick('tag', tag)
                                            }
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500">
                                    No tags available
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Cache Manager Modal */}
            {showCacheManager && (
                <CacheManager onClose={() => setShowCacheManager(false)} />
            )}
        </div>
    )
}

export default React.memo(MenuSection)

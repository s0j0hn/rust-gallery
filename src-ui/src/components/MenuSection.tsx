import React, { useEffect, useState } from 'react'
import {
    Database,
    FileText,
    FolderOpen,
    Info,
    RefreshCw,
    Search,
    Settings,
    Tag,
    X,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useFolders } from '../hooks/useFolders'
import { MenuSectionProps } from '../types/gallery'
import CacheManager from './CacheManager'
import ConfigManager from './ConfigManager'
import useMobile from '../hooks/useMobile'
import SearchBar from './SearchBar'

const MenuSection: React.FC<MenuSectionProps> = ({
    onTagClick,
    onApiDocsClick,
    isOpen = false,
    onClose, // Add this prop
}) => {
    // Use internal state but synchronize with prop
    const [menuOpen, setMenuOpen] = useState<boolean>(isOpen)
    const [showCacheManager, setShowCacheManager] = useState<boolean>(false)
    const [showConfigManager, setShowConfigManager] = useState<boolean>(false)
    const isMobile = useMobile() // Add this to detect mobile view

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
        cancelIndexation,
    } = useFolders()
    const navigate = useNavigate()

    // Sync internal state with prop
    useEffect(() => {
        setMenuOpen(isOpen)
    }, [isOpen])

    // When internal state changes, notify parent
    const handleMenuToggle = () => {
        const newState = !menuOpen
        setMenuOpen(newState)
        if (!newState && onClose) {
            onClose()
        }
    }

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

    const toggleCacheManager = () => {
        setShowCacheManager(!showCacheManager)
    }

    const toggleConfigManager = () => {
        setShowConfigManager(!showConfigManager)
    }

    return (
        <div
            className="mb-16 menu-section"
            data-open={menuOpen ? 'true' : 'false'}
        >
            {/* Updated layout for mobile responsiveness */}
            <div
                className={`${isMobile ? 'flex flex-col space-y-3' : 'flex justify-between items-center'} mb-4`}
            >
                <div
                    className={`${isMobile ? 'flex flex-wrap gap-2' : 'flex space-x-2'}`}
                >
                    <button
                        onClick={handleMenuToggle}
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

                    {/* New cancel indexation button */}
                    <button
                        onClick={cancelIndexation}
                        disabled={!isIndexing}
                        hidden={!isIndexing}
                        className={`px-4 py-2 rounded-md transition-colors ${
                            !isIndexing
                                ? 'bg-gray-300 cursor-not-allowed'
                                : 'bg-red-500 hover:bg-red-600 text-white'
                        }`}
                    >
                        Cancel Indexation
                    </button>

                    <button
                        onClick={handleApiDocsClick}
                        className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition flex items-center"
                    >
                        <FileText size={16} className="mr-2" />
                        API Docs
                    </button>

                    {/* Cache Manager Button */}
                    <button
                        onClick={toggleCacheManager}
                        className="px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600 transition flex items-center"
                    >
                        <Database size={16} className="mr-2" />
                        Manage Cache
                    </button>

                    {/* New Config Manager Button */}
                    <button
                        onClick={toggleConfigManager}
                        className="px-4 py-2 bg-amber-500 text-white rounded hover:bg-amber-600 transition flex items-center"
                    >
                        <Settings size={16} className="mr-2" />
                        Settings
                    </button>
                </div>

                {/* Make search bar responsive */}
                <div
                    className={`${isMobile ? 'w-full' : 'w-full max-w-md ml-4'}`}
                >
                    <SearchBar
                        value={searchQuery || ''}
                        onChange={setSearchQuery}
                        placeholder="Search folders..."
                    />
                </div>
            </div>

            {menuOpen && (
                <div className="bg-white p-4 rounded-lg shadow-md mt-12 transition-all">
                    <div
                        className={`grid grid-cols-1 ${isMobile ? '' : 'md:grid-cols-3'} gap-4`}
                    >
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

            {/* Config Manager Modal */}
            {showConfigManager && (
                <ConfigManager onClose={() => setShowConfigManager(false)} />
            )}
        </div>
    )
}

export default React.memo(MenuSection)

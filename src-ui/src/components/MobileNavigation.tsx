// src/components/MobileNavigation.tsx
import React, { FC, useState } from 'react'
import {
    Database,
    FileText,
    FolderOpen,
    Home,
    Menu,
    RefreshCw,
    Tag,
    X,
} from 'lucide-react'
import CacheManager from './CacheManager' // Import the CacheManager component

interface MobileNavigationProps {
    onHomeClick: () => void
    onRootClick: () => void
    onTagsClick: () => void
    onIndexClick: () => void
    onApiDocsClick?: () => void
    isIndexing: boolean
}

const MobileNavigation: FC<MobileNavigationProps> = ({
    onHomeClick,
    onRootClick,
    onTagsClick,
    onIndexClick,
    onApiDocsClick,
    isIndexing,
}) => {
    const [menuOpen, setMenuOpen] = useState(false)
    const [showCacheManager, setShowCacheManager] = useState(false) // New state

    const toggleMenu = () => {
        setMenuOpen(!menuOpen)
    }

    return (
        <>
            {/* Fixed button at bottom right */}
            <button
                onClick={toggleMenu}
                className="fixed bottom-4 right-4 z-40 w-14 h-14 rounded-full bg-blue-500 text-white shadow-lg flex items-center justify-center"
            >
                {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Menu that appears when button is clicked */}
            {menuOpen && (
                <div className="fixed bottom-20 right-4 z-40 bg-white rounded-lg shadow-xl overflow-hidden">
                    <div className="flex flex-col w-56">
                        <button
                            onClick={() => {
                                onHomeClick()
                                toggleMenu()
                            }}
                            className="flex items-center px-4 py-3 hover:bg-gray-100 transition"
                        >
                            <Home size={18} className="mr-3" />
                            <span>Home</span>
                        </button>

                        <button
                            onClick={() => {
                                onRootClick()
                                toggleMenu()
                            }}
                            className="flex items-center px-4 py-3 hover:bg-gray-100 transition"
                        >
                            <FolderOpen size={18} className="mr-3" />
                            <span>Roots</span>
                        </button>

                        <button
                            onClick={() => {
                                onTagsClick()
                                toggleMenu()
                            }}
                            className="flex items-center px-4 py-3 hover:bg-gray-100 transition"
                        >
                            <Tag size={18} className="mr-3" />
                            <span>Tags</span>
                        </button>

                        <button
                            onClick={() => {
                                onIndexClick()
                                toggleMenu()
                            }}
                            disabled={isIndexing}
                            className={`flex items-center px-4 py-3 hover:bg-gray-100 transition ${isIndexing ? 'opacity-50' : ''}`}
                        >
                            <RefreshCw
                                size={18}
                                className={`mr-3 ${isIndexing ? 'animate-spin' : ''}`}
                            />
                            <span>
                                {isIndexing ? 'Indexing...' : 'Index Photos'}
                            </span>
                        </button>

                        {/* New Cache Manager Button */}
                        <button
                            onClick={() => {
                                setShowCacheManager(true)
                                toggleMenu()
                            }}
                            className="flex items-center px-4 py-3 hover:bg-gray-100 transition"
                        >
                            <Database size={18} className="mr-3" />
                            <span>Manage Cache</span>
                        </button>

                        {onApiDocsClick && (
                            <button
                                onClick={() => {
                                    onApiDocsClick()
                                    toggleMenu()
                                }}
                                className="flex items-center px-4 py-3 hover:bg-gray-100 transition"
                            >
                                <FileText size={18} className="mr-3" />
                                <span>API Docs</span>
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Cache Manager Modal */}
            {showCacheManager && (
                <CacheManager onClose={() => setShowCacheManager(false)} />
            )}
        </>
    )
}

export default MobileNavigation

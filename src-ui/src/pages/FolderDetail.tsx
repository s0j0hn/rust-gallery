import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import PhotoSwipeGallery from '../components/PhotoSwipeGallery'
import MenuSection from '../components/MenuSection'
import MobileNavigation from '../components/MobileNavigation'
import { Folder, JsonFilePhoto } from '../types/gallery'
import { api } from '../services/api'
import { useFolders } from '../hooks/useFolders'
import useMobile from '../hooks/useMobile'
import { useInfiniteScroll } from '../hooks/useInfiniteScroll'

const FolderDetail: React.FC = () => {
    const [photos, setPhotos] = useState<JsonFilePhoto[]>([])
    const [page, setPage] = useState<number>(1)
    const [showEverything, setShowEverything] = useState<boolean>(false)
    const [hasMore, setHasMore] = useState<boolean>(true)
    const [loading, setLoading] = useState<boolean>(true)
    const [sFolder, setFolder] = useState<Folder | null>(null)
    const { folderName } = useParams<{ folderName: string }>()
    const navigate = useNavigate()
    const isMobile = useMobile()
    const { isIndexing, startIndexation } = useFolders()
    const perPage = 200 // Reduced from 200 to improve initial load time

    // Load more photos function for infinite scroll
    const loadMorePhotos = async () => {
        if (!folderName || !hasMore || loading) return

        setLoading(true)
        try {
            const data = await api.photos.getAllByFolder(
                folderName,
                perPage,
                page
            )

            // If we got fewer items than perPage, or no items, there are no more photos
            if (!data.items.length || data.items.length < perPage) {
                setHasMore(false)
            }

            // Append new photos to existing ones
            setPhotos((prevPhotos) => [...prevPhotos, ...data.items])
            setPage((prevPage) => prevPage + 1)
        } catch (err) {
            console.error('Failed to fetch more photos:', err)
            setHasMore(false)
        } finally {
            setLoading(false)
        }
    }

    // Infinite scroll hook
    const loadMoreRef = useInfiniteScroll({
        onLoadMore: loadMorePhotos,
        hasMore,
        loading,
    })

    // First effect: Fetch folder details
    useEffect(() => {
        if (!folderName) return

        setLoading(true)
        setPhotos([]) // Reset photos when folder changes
        setPage(1) // Reset page
        setHasMore(true) // Reset hasMore

        api.folders
            .getByName(folderName)
            .then(async (folder) => {
                if (folder) {
                    folder.tags = await api.tags.getAll(folder.title)
                    setFolder(folder)
                }
            })
            .catch((err) =>
                console.error('Failed to fetch folder details:', err)
            )
            .finally(() => setLoading(false))
    }, [folderName])

    // Second effect: Initial photos fetch
    useEffect(() => {
        if (!folderName) return

        loadMorePhotos() // Initial load of photos
    }, [folderName]) // Only run on folder change

    const handleBack = () => {
        if (sFolder?.root) {
            navigate(`/?root=${sFolder.root}`)
        } else {
            navigate('/')
        }
    }

    const handleTagClick = (type: 'tag' | 'root', value: string) => {
        if (type === 'tag') {
            navigate(`/tag/${value}`)
        } else if (type === 'root') {
            navigate('/', { state: { selectedRoot: value } })
        }
    }

    const handleApiDocsClick = () => {
        navigate('/api-docs')
    }

    if (!photos.length && loading) {
        return (
            <div className="flex justify-center items-center h-64">
                Loading photos...
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-100 mobile-safe-bottom">
            <div className="container mx-auto p-4">
                <MenuSection
                    onTagClick={handleTagClick}
                    onApiDocsClick={handleApiDocsClick}
                />

                <div className="container mx-auto p-4">
                    <div className="flex items-center mb-6">
                        <button
                            onClick={handleBack}
                            className="mr-4 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition"
                        >
                            Back
                        </button>
                        <button
                            onClick={() => {
                                setShowEverything(!showEverything)
                            }}
                            className="mr-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-gray-300 transition"
                        >
                            Show everything
                        </button>
                        <h1 className="text-3xl font-bold">
                            {sFolder?.title || 'Album'}
                        </h1>
                        {sFolder?.root && (
                            <span
                                className="ml-4 px-3 py-1 bg-blue-500 text-white text-sm rounded-full cursor-pointer hover:bg-blue-600"
                                onClick={() =>
                                    handleTagClick('root', sFolder.root)
                                }
                            >
                                {sFolder.root}
                            </span>
                        )}
                    </div>

                    <PhotoSwipeGallery images={photos} />

                    {/* Infinite scroll sentinel */}
                    {hasMore && (
                        <div
                            ref={loadMoreRef}
                            className="flex justify-center items-center py-8"
                        >
                            {loading && (
                                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {isMobile && (
                <MobileNavigation
                    onHomeClick={handleBack}
                    onRootClick={() => {
                        navigate('/', { state: { showRoots: true } })
                    }}
                    onTagsClick={() => {
                        navigate('/')
                    }}
                    onIndexClick={startIndexation}
                    onApiDocsClick={handleApiDocsClick}
                    isIndexing={isIndexing}
                />
            )}
        </div>
    )
}

export default FolderDetail

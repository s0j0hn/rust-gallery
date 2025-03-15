// src-ui/src/pages/TagView.tsx
import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import MenuSection from '../components/MenuSection'
import MobileNavigation from '../components/MobileNavigation'
import { Photo } from '../types/gallery'
import { api } from '../services/api'
import { useFolders } from '../hooks/useFolders'
import useMobile from '../hooks/useMobile'

const TagView: React.FC = () => {
    const [photos, setPhotos] = useState<Photo[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const { tagName } = useParams<{ tagName: string }>()
    const navigate = useNavigate()
    const isMobile = useMobile()
    const { isIndexing, startIndexation } = useFolders()

    useEffect(() => {
        if (!tagName) return

        setLoading(true)
        api.photos
            .getRandomByTag(tagName)
            .then((data) => {
                setPhotos(data)
                setLoading(false)
            })
            .catch((err) => {
                console.error('Failed to fetch photos by tag:', err)
                setLoading(false)
            })
    }, [tagName])

    const location = useLocation()

    const handleBack = () => {
        // Check if we should return to a specific root view
        const prevRoot = new URLSearchParams(location.search).get('from-root')
        if (prevRoot) {
            navigate(`/?root=${prevRoot}`)
        } else {
            navigate('/')
        }
    }

    // When clicking on a root tag from the tag view
    const handleTagClick = (type: 'tag' | 'root', value: string) => {
        if (type === 'tag') {
            // Add the current tag name as a param to preserve context
            navigate(`/tag/${value}?from-tag=${tagName}`)
        } else if (type === 'root') {
            navigate(`/?root=${value}`)
        }
    }

    const handleApiDocsClick = () => {
        navigate('/api-docs')
    }

    const openPhotoSwipe = (index: number): void => {
        // In a real application, you would initialize PhotoSwipe here
        console.log('Opening PhotoSwipe with photo at index', index)
        // This is a placeholder for actual PhotoSwipe implementation
        alert(`Viewing photo ${index + 1} of ${photos.length}`)
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                Loading photos with tag "{tagName}"...
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
                        <h1 className="text-3xl font-bold">
                            Photos Tagged:{' '}
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                {tagName}
                            </span>
                        </h1>
                    </div>

                    {photos.length === 0 ? (
                        <div className="bg-white rounded-lg shadow-md p-8 text-center">
                            <h2 className="text-xl font-semibold mb-2">
                                No photos found
                            </h2>
                            <p className="text-gray-600">
                                No photos with the tag "{tagName}" were found.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {photos.map((photo, index) => (
                                <div
                                    key={photo.id}
                                    className="cursor-pointer bg-gray-100 rounded overflow-hidden"
                                    onClick={() => openPhotoSwipe(index)}
                                >
                                    <div className="relative pb-full">
                                        <img
                                            src={photo.thumbnail}
                                            alt={photo.title}
                                            className="absolute inset-0 w-full h-full object-cover"
                                        />
                                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2">
                                            <p className="text-white text-xs truncate">
                                                Album: {photo.folderName}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
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

export default TagView

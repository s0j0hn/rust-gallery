import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import MenuSection from '../components/MenuSection'
import { JsonFilePhoto } from '../types/gallery'
import { api } from '../services/api'
import PhotoSwipeGallery from '../components/PhotoSwipeGallery'
import { useConfig } from '../context/ConfigContext'

const TagView: React.FC = () => {
    const { tagName } = useParams<{ tagName: string }>()
    const [photos, setPhotos] = useState<JsonFilePhoto[]>([])
    const [loading, setLoading] = useState<boolean>(false)
    const [error, setError] = useState<string | null>(null)
    const { config } = useConfig()
    const navigate = useNavigate()

    // Load photos for the selected tag
    useEffect(() => {
        if (!tagName) return

        const fetchPhotos = async () => {
            setLoading(true)
            setError(null)

            try {
                // Fetching photos for tag
                const data = await api.photos.getRandomByTag(
                    tagName,
                    config.photo_per_random
                )
                // Photos received

                setPhotos(data.items)
            } catch (err) {
                console.error('Failed to fetch photos:', err)
                setError('Failed to load photos. Please try again.')
            } finally {
                setLoading(false)
            }
        }

        fetchPhotos()
    }, [tagName, config.photo_per_random])

    const handleBack = () => {
        navigate('/')
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

    // Show loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100">
                <div className="container mx-auto p-4">
                    <MenuSection
                        onTagClick={handleTagClick}
                        onApiDocsClick={handleApiDocsClick}
                    />
                    <div className="flex justify-center items-center h-64">
                        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <span className="ml-3 text-lg">Loading photos...</span>
                    </div>
                </div>
            </div>
        )
    }

    // Show error state
    if (error) {
        return (
            <div className="min-h-screen bg-gray-100">
                <div className="container mx-auto p-4">
                    <MenuSection
                        onTagClick={handleTagClick}
                        onApiDocsClick={handleApiDocsClick}
                    />
                    <div className="flex flex-col justify-center items-center h-64">
                        <div className="text-red-500 mb-4">{error}</div>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-100">
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
                            {`Photos tagged with "${tagName}"`}
                        </h1>
                    </div>

                    {photos.length > 0 ? (
                        <PhotoSwipeGallery images={photos} />
                    ) : (
                        <div className="text-center py-8">
                            No photos found with this tag.
                        </div>
                    )}

                    {/* Show total count if available */}
                    {photos.length > 0 && (
                        <div className="text-center text-gray-600 mt-4">
                            Showing {photos.length} photos
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default TagView

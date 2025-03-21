// src/context/TagsContext.tsx
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react'
import { api } from '../services/api'

interface TagsContextType {
    tags: string[]
    isLoading: boolean
    error: string | null
    refreshTags: () => Promise<void>
}

const TagsContext = createContext<TagsContextType>({
    tags: [],
    isLoading: false,
    error: null,
    refreshTags: async () => {},
})

export const TagsProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [tags, setTags] = useState<string[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Fetch tags function with proper loading and error states
    const fetchTags = useCallback(async () => {
        setIsLoading(true)
        setError(null)

        try {
            const response = await api.tags.getAll()
            setTags(response)
        } catch (err) {
            console.error('Error fetching tags:', err)
            setError('Failed to load tags. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }, [])

    // Initial data loading
    useEffect(() => {
        fetchTags()
    }, [fetchTags])

    // Memoize the context value
    const contextValue = useMemo(
        () => ({
            tags,
            isLoading,
            error,
            refreshTags: fetchTags,
        }),
        [tags, isLoading, error, fetchTags]
    )

    return (
        <TagsContext.Provider value={contextValue}>
            {children}
        </TagsContext.Provider>
    )
}

// Custom hook for using the tags context
export const useTags = () => {
    const context = useContext(TagsContext)
    if (context === undefined) {
        throw new Error('useTags must be used within a TagsProvider')
    }
    return context
}

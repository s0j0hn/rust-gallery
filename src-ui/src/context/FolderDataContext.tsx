// src/context/FolderDataContext.tsx
import React, {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
} from 'react'
import { api } from '../services/api'
import { useSearch } from './SearchContext'
import { usePagination } from './PaginationContext'
import { Folder } from '../types/gallery'

interface FolderDataContextType {
    folders: Folder[]
    isLoading: boolean
    error: string | null
    refetch: () => void
}

const FolderDataContext = createContext<FolderDataContextType>({
    folders: [],
    isLoading: false,
    error: null,
    refetch: () => {},
})

// Constants for pagination
const FOLDERS_PER_PAGE = 50

export const FolderDataProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [folders, setFolders] = useState<Folder[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Get search and pagination context
    const { searchQuery, selectedRoot } = useSearch()
    const { currentPage, setTotalItems } = usePagination()

    // Fetch folders with abortable requests
    const fetchFolders = useCallback(async () => {
        setIsLoading(true)
        setError(null)

        // Create abort controller for cancellable requests
        const controller = new AbortController()
        const signal = controller.signal

        try {
            const foldersRes = await api.folders.getAll(
                currentPage,
                FOLDERS_PER_PAGE,
                selectedRoot || '',
                searchQuery
                // { signal }
            )

            setFolders(foldersRes)
            setTotalItems(foldersRes.length)
        } catch (err: any) {
            if (err.name !== 'AbortError') {
                setError('Failed to fetch folders. Please try again.')
                console.error('Error fetching folders:', err)
            }
        } finally {
            setIsLoading(false)
        }

        return () => controller.abort()
    }, [currentPage, selectedRoot, searchQuery, setTotalItems])

    // Fetch folders when dependencies change
    // useEffect(() => {
    //     const abortFetch = fetchFolders()
    //
    //     // Cleanup function to abort fetch on unmount or dependency change
    //     return () => {
    //         abortFetch()
    //     }
    // }, [fetchFolders])

    // Memoize the context value
    const contextValue = useMemo(
        () => ({
            folders,
            isLoading,
            error,
            refetch: fetchFolders,
        }),
        [folders, isLoading, error, fetchFolders]
    )

    return (
        <FolderDataContext.Provider value={contextValue}>
            {children}
        </FolderDataContext.Provider>
    )
}

// Custom hook for using the folder data context
export const useFolderData = () => {
    const context = useContext(FolderDataContext)
    if (context === undefined) {
        throw new Error(
            'useFolderData must be used within a FolderDataProvider'
        )
    }
    return context
}

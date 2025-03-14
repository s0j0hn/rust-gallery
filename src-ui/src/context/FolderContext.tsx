import React, {
    createContext,
    ReactNode,
    useCallback,
    useEffect,
    useState,
} from 'react'
import { Folder, Root } from '../types/gallery'
import { api } from '../services/api'
import { Location, useLocation, useNavigate } from 'react-router-dom'

interface FolderContextType {
    folders: Folder[]
    roots: Root[]
    tags: string[]
    filteredFolders: Folder[]
    loading: boolean
    searchQuery: string
    selectedRoot: string | null
    setSearchQuery: (query: string) => void
    setSelectedRoot: (rootName: string) => void
    refreshFolders: () => Promise<void>
    updateFolderTags: (folderTitle: string, tags: string[]) => Promise<void>
    deleteFolder: (folderTitle: string) => Promise<void>
    isIndexing: boolean
    startIndexation: () => Promise<void>
    hasMore: boolean
    loadMoreFolders: () => void
    page: number
}

export const FolderContext = createContext<FolderContextType>(
    {} as FolderContextType
)

// Helper function to update search params without navigation
const getUpdatedSearchParams = (
    location: Location,
    query: string,
    root: string | null
): string => {
    const params = new URLSearchParams(location.search)
    if (query) {
        params.set('searchBy', query)
    } else {
        params.delete('searchBy')
    }
    if (root) {
        params.set('root', root)
    } else {
        params.delete('root')
    }
    return params.toString()
}

export const FolderProvider: React.FC<{ children: ReactNode }> = ({
    children,
}) => {
    const [folders, setFolders] = useState<Folder[]>([])
    const [roots, setFolderRoots] = useState<Root[]>([])
    const [tags, setTags] = useState<string[]>([])
    const [filteredFolders, setFilteredFolders] = useState<Folder[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [searchQuery, setSearchQuery] = useState<string>('')
    const [selectedRoot, setSelectedRoot] = useState<string>('files')
    const [isIndexing, setIsIndexing] = useState<boolean>(false)
    const [page, setPage] = useState<number>(1)
    const [hasMore, setHasMore] = useState<boolean>(true)
    const FOLDERS_PER_PAGE = 8
    const location = useLocation()
    const navigate = useNavigate()

    // Update URL with search parameters
    const updateSearchParams = useCallback(
        (query: string, root: string | null) => {
            const search = getUpdatedSearchParams(location, query, root)
            const newUrl = `${location.pathname}${search ? `?${search}` : ''}`
            navigate(newUrl, { replace: true })
        },
        [location, navigate]
    )

    // Fetch folders with pagination and search
    const fetchFolders = useCallback(
        async (currentPage: number, root: string | null, query: string) => {
            setLoading(true)
            try {
                // Here you'll need to modify your API call to include search parameters
                const data = await api.folders.getAll(
                    currentPage,
                    FOLDERS_PER_PAGE,
                    root || '',
                    query
                )

                // Check if we have more folders to load
                const hasMoreFolders = data.length === FOLDERS_PER_PAGE
                setHasMore(hasMoreFolders)

                return data
            } catch (err) {
                console.error('Failed to fetch folders:', err)
                return []
            } finally {
                setLoading(false)
            }
        },
        []
    )

    // Refresh folders (used for initial load or reset)
    const refreshFolders = useCallback(async () => {
        setPage(1)
        const newFolders = await fetchFolders(1, selectedRoot, searchQuery)
        setFolders(newFolders)
        setFilteredFolders(newFolders)
    }, [fetchFolders, selectedRoot, searchQuery])

    // Load more folders function
    const loadMoreFolders = useCallback(async () => {
        if (!hasMore || loading) return

        const nextPage = page + 1
        const newFolders = await fetchFolders(
            nextPage,
            selectedRoot,
            searchQuery
        )

        if (newFolders.length > 0) {
            setFolders((prev) => [...prev, ...newFolders])
            setFilteredFolders((prev) => [...prev, ...newFolders])
            setPage(nextPage)
        }
    }, [fetchFolders, hasMore, loading, page, selectedRoot, searchQuery])

    // Handle search query and root selection changes
    useEffect(() => {
        const params = new URLSearchParams(location.search)
        const rootParam = params.get('root')
        const searchParam = params.get('searchBy')

        // Only update if values are different
        if (rootParam !== selectedRoot) {
            setSelectedRoot(rootParam ? selectedRoot : 'files')
        }
        if (searchParam !== searchQuery) {
            setSearchQuery(searchParam || '')
        }

        // Reset and refresh folders when search params change
        setPage(1)
        refreshFolders()
    }, [location.search])

    // Fetch roots
    useEffect(() => {
        const fetchRoots = async () => {
            try {
                const data = await api.folders.getRoots()
                setFolderRoots(data)
            } catch (err) {
                console.error('Failed to fetch roots:', err)
            }
        }

        fetchRoots()
    }, [])

    // Fetch tags
    useEffect(() => {
        const fetchTags = async () => {
            try {
                const data = await api.tags.getAll()
                setTags(data)
            } catch (err) {
                console.error('Failed to fetch tags:', err)
            }
        }

        fetchTags()
    }, [])

    // Update folder tags
    const updateFolderTags = useCallback(
        async (folderTitle: string, tags: string[]) => {
            try {
                const result = await api.folders.updateTags(folderTitle, tags)

                setFolders((prevFolders) =>
                    prevFolders.map((folder) =>
                        folder.title === folderTitle
                            ? { ...folder, tags: result }
                            : folder
                    )
                )
                setFilteredFolders((prevFolders) =>
                    prevFolders.map((folder) =>
                        folder.title === folderTitle
                            ? { ...folder, tags: result }
                            : folder
                    )
                )
            } catch (err) {
                console.error('Failed to update tags:', err)
                throw err
            }
        },
        []
    )

    // Delete folder
    const deleteFolder = useCallback(async (folderTitle: string) => {
        try {
            await api.folders.delete(folderTitle)
            setFolders((prevFolders) =>
                prevFolders.filter((folder) => folder.title !== folderTitle)
            )
            setFilteredFolders((prevFolders) =>
                prevFolders.filter((folder) => folder.title !== folderTitle)
            )
        } catch (err) {
            console.error(`Failed to delete folder ${folderTitle}:`, err)
            throw err
        }
    }, [])

    // Start indexation
    const startIndexation = useCallback(async () => {
        setIsIndexing(true)
        try {
            await api.indexation.indexPhotos()
            await refreshFolders()
        } catch (err) {
            console.error('Indexation failed:', err)
            throw err
        } finally {
            setIsIndexing(false)
        }
    }, [refreshFolders])

    // Custom setSearchQuery that updates URL
    const handleSetSearchQuery = useCallback(
        (query: string) => {
            setSearchQuery(query)
            updateSearchParams(query, selectedRoot)
        },
        [selectedRoot, updateSearchParams]
    )

    // Custom setSelectedRoot that updates URL
    const handleSetSelectedRoot = useCallback(
        (root: string) => {
            setSelectedRoot(root)
            updateSearchParams(searchQuery, root)
        },
        [searchQuery, updateSearchParams]
    )

    return (
        <FolderContext.Provider
            value={{
                folders,
                roots,
                tags,
                filteredFolders,
                loading,
                searchQuery,
                selectedRoot,
                setSearchQuery: handleSetSearchQuery,
                setSelectedRoot: handleSetSelectedRoot,
                refreshFolders,
                updateFolderTags,
                deleteFolder,
                isIndexing,
                startIndexation,
                hasMore,
                loadMoreFolders,
                page,
            }}
        >
            {children}
        </FolderContext.Provider>
    )
}

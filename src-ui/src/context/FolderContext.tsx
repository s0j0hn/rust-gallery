import { createContext, ReactNode, useCallback, useEffect, useRef, useState, FC } from 'react'
import { Folder, JsonRootResponse } from '../types/gallery'
import { api } from '../services/api'
import { Location, useLocation, useNavigate } from 'react-router-dom'
import { useConfig } from './ConfigContext'

interface FolderContextType {
  folders: Folder[]
  roots: JsonRootResponse[]
  tags: string[]
  filteredFolders: Folder[]
  loading: boolean
  searchQuery: string
  selectedRoot: string | null
  recentSearches: string[]
  setSearchQuery: (query: string) => void
  setSelectedRoot: (rootName: string) => void
  refreshFolders: () => Promise<void>
  updateFolderTags: (folderTitle: string, tags: string[]) => Promise<void>
  deleteFolder: (folderTitle: string) => Promise<void>
  isIndexing: boolean
  startIndexation: () => Promise<void>
  cancelIndexation: () => Promise<void> // New function to cancel indexation
  hasMore: boolean
  loadMoreFolders: () => void
  page: number
}

export const FolderContext = createContext<FolderContextType>({} as FolderContextType)

// Helper function to update search params without navigation
const getUpdatedSearchParams = (location: Location, query: string, root: string | null): string => {
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

export const FolderProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [folders, setFolders] = useState<Folder[]>([])
  const [roots, setFolderRoots] = useState<JsonRootResponse[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [filteredFolders, setFilteredFolders] = useState<Folder[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [selectedRoot, setSelectedRoot] = useState<string>('files')
  const [isIndexing, setIsIndexing] = useState<boolean>(false)
  const [page, setPage] = useState<number>(1)
  const [hasMore, setHasMore] = useState<boolean>(true)
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const [recentSearches, setRecentSearches] = useState<string[]>([])

  const location = useLocation()
  const navigate = useNavigate()
  const { config } = useConfig()

  // Add this effect to load recent searches on mount
  useEffect(() => {
    try {
      const savedSearches = localStorage.getItem('recentSearches')
      if (savedSearches) {
        setRecentSearches(JSON.parse(savedSearches))
      }
    } catch (err) {
      console.error('Failed to load recent searches', err)
    }
  }, [])

  // Update URL with search parameters
  const updateSearchParams = useCallback(
    (query: string, root: string | null) => {
      const search = getUpdatedSearchParams(location, query, root)
      const newUrl = `${location.pathname}${search ? `?${search}` : ''}`
      navigate(newUrl, { replace: true })
    },
    [location, navigate]
  )

  // Modify your setSearchQuery handler
  const handleSetSearchQuery = useCallback(
    (query: string) => {
      // Original logic
      setSearchQuery(query)
      updateSearchParams(query, selectedRoot)

      // Add to recent searches if not empty
      if (query.trim()) {
        const newRecentSearches = [
          query,
          ...recentSearches.filter((search) => search !== query),
        ].slice(0, 5) // Keep only the 5 most recent

        setRecentSearches(newRecentSearches)
        localStorage.setItem('recentSearches', JSON.stringify(newRecentSearches))
      }
    },
    [selectedRoot, updateSearchParams, recentSearches]
  )

  // checkIndexationStatus removed - inlined in startIndexation to avoid circular dependency

  // Clear interval on unmount
  useEffect(() => {
    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current)
        checkIntervalRef.current = null
      }
    }
  }, [])

  // Fetch folders with pagination and search
  const fetchFolders = useCallback(
    async (currentPage: number, root: string | null, query: string) => {
      setLoading(true)
      try {
        // Here you'll need to modify your API call to include search parameters
        const data = await api.folders.getAll(
          currentPage,
          config.folders_per_page,
          root || '',
          query
        )

        // Check if we have more folders to load
        const hasMoreFolders = data.length === config.folders_per_page
        setHasMore(hasMoreFolders)

        return data
      } catch (err) {
        console.error('Failed to fetch folders:', err)
        return []
      } finally {
        setLoading(false)
      }
    },
    [config.folders_per_page]
  )

  // Refresh folders (used for initial load or reset)
  const refreshFolders = useCallback(async () => {
    // await refreshConfig()
    setPage(1)
    const newFolders = await fetchFolders(1, selectedRoot, searchQuery)
    setFolders(newFolders)
    setFilteredFolders(newFolders)
  }, [fetchFolders, selectedRoot, searchQuery])

  // Load more folders function
  const loadMoreFolders = useCallback(async () => {
    if (!hasMore || loading) return

    const nextPage = page + 1
    const newFolders = await fetchFolders(nextPage, selectedRoot, searchQuery)

    if (newFolders.length > 0) {
      setFolders((prev) => {
        // Get all existing folder titles for duplicate checking
        const existingTitles = new Set(prev.map((folder) => folder.title))

        // Only add new folders that don't already exist
        const uniqueNewFolders = newFolders.filter((folder) => !existingTitles.has(folder.title))

        return [...prev, ...uniqueNewFolders]
      })

      setFilteredFolders((prev) => {
        const existingTitles = new Set(prev.map((folder) => folder.title))
        const uniqueNewFolders = newFolders.filter((folder) => !existingTitles.has(folder.title))
        return [...prev, ...uniqueNewFolders]
      })

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
      setSelectedRoot(rootParam || 'files')
    }
    if (searchParam !== searchQuery) {
      setSearchQuery(searchParam || '')
    }
  }, [location.search]) // Remove refreshFolders from here to avoid loops

  // Separate effect for refreshing folders when params actually change
  useEffect(() => {
    setPage(1)
    refreshFolders()
  }, [selectedRoot, searchQuery, refreshFolders])

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

        // Update both states in a single operation
        const updateFunction = (prevFolders: Folder[]) =>
          prevFolders.map((folder) =>
            folder.title === folderTitle ? { ...folder, tags: result } : folder
          )

        setFolders(updateFunction)
        setFilteredFolders(updateFunction)
      } catch (err) {
        console.error('Failed to update tags:', err)
        throw err
      }
    },
    [refreshFolders]
  )

  // Delete folder
  const deleteFolder = useCallback(async (folderTitle: string) => {
    try {
      await api.folders.delete(folderTitle)

      // Update both states in a single operation
      const filterFunction = (prevFolders: Folder[]) =>
        prevFolders.filter((folder) => folder.title !== folderTitle)

      setFolders(filterFunction)
      setFilteredFolders(filterFunction)
      // Remove refreshFolders call to avoid unnecessary API call
    } catch (err) {
      console.error(`Failed to delete folder ${folderTitle}:`, err)
      throw err
    }
  }, [])

  // Start indexation
  const startIndexation = useCallback(async () => {
    // Clear any existing interval
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current)
      checkIntervalRef.current = null
    }

    setIsIndexing(true)
    try {
      const data = await api.indexation.indexPhotos()
      if (!data.task_running) {
        // Set up interval to check status every 30 seconds
        checkIntervalRef.current = setInterval(async () => {
          try {
            const status = await api.indexation.indexPhotos()
            setIsIndexing(status.task_running)

            if (!status.task_running && checkIntervalRef.current) {
              clearInterval(checkIntervalRef.current)
              checkIntervalRef.current = null
              await refreshFolders()
            }
          } catch (err) {
            console.error('Failed to check indexation status:', err)
          }
        }, 30000)
        await refreshFolders()
      }
      await new Promise((r) => setTimeout(r, 2000))
    } catch (err) {
      console.error('Indexation failed:', err)
      setIsIndexing(false)
      throw err
    }
  }, [refreshFolders])

  // Cancel indexation
  const cancelIndexation = useCallback(async () => {
    try {
      // Using the correct API endpoint to cancel the indexation task
      const response = await api.indexation.cancelIndexTask()

      // Clear the check interval
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current)
        checkIntervalRef.current = null
      }

      if (response.status === 'success') {
        setIsIndexing(false)
        await refreshFolders()
      }
    } catch (err) {
      console.error('Failed to cancel indexation:', err)
      throw err
    }
  }, [refreshFolders])

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
        recentSearches,
        setSearchQuery: handleSetSearchQuery,
        setSelectedRoot: handleSetSelectedRoot,
        refreshFolders,
        updateFolderTags,
        deleteFolder,
        isIndexing,
        startIndexation,
        cancelIndexation, // Add the new cancelIndexation function
        hasMore,
        loadMoreFolders,
        page,
      }}
    >
      {children}
    </FolderContext.Provider>
  )
}

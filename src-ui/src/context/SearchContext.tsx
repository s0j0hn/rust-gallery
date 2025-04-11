// src/context/SearchContext.tsx
import React, {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
} from 'react'
import { useSearchParams } from 'react-router-dom'
import debounce from 'lodash/debounce'

interface SearchContextType {
    searchQuery: string
    setSearchQuery: (query: string) => void
    setSearchQueryImmediate: (query: string) => void
    selectedRoot: string
    setSelectedRoot: (root: string) => void
    roots: string[]
    setRoots: (roots: string[]) => void
}

const SearchContext = createContext<SearchContextType>({
    searchQuery: '',
    setSearchQuery: () => {},
    setSearchQueryImmediate: () => {},
    selectedRoot: '',
    setSelectedRoot: () => {},
    roots: [],
    setRoots: () => {},
})

export const SearchProvider: React.FC<{
    children: React.ReactNode
    initialRoots?: string[]
}> = ({ children, initialRoots = [] }) => {
    const [searchParams, setSearchParams] = useSearchParams()

    const [searchQuery, setSearchQueryState] = useState(
        searchParams.get('query') || ''
    )
    const [selectedRoot, setSelectedRootState] = useState(
        searchParams.get('root') || ''
    )
    const [roots, setRoots] = useState<string[]>(initialRoots)

    // Memoize the update search params function
    const updateSearchParams = useCallback(
        (query: string, root: string) => {
            const params: Record<string, string> = {}

            if (query) params.query = query
            if (root) params.root = root

            setSearchParams(params, { replace: true })
        },
        [setSearchParams]
    )

    // Debounced search query setter
    const debouncedSetSearchQuery = useMemo(
        () =>
            debounce((query: string) => {
                setSearchQueryState(query)
                updateSearchParams(query, selectedRoot)
            }, 300),
        [selectedRoot, updateSearchParams]
    )

    // Immediate setter for when we need to update without debounce
    const setSearchQueryImmediate = useCallback(
        (query: string) => {
            setSearchQueryState(query)
            updateSearchParams(query, selectedRoot)
        },
        [selectedRoot, updateSearchParams]
    )

    // Root setter with URL update
    const setSelectedRoot = useCallback(
        (root: string) => {
            setSelectedRootState(root)
            updateSearchParams(searchQuery, root)
        },
        [searchQuery, updateSearchParams]
    )

    // Memoize the context value
    const contextValue = useMemo(
        () => ({
            searchQuery,
            setSearchQuery: debouncedSetSearchQuery,
            setSearchQueryImmediate,
            selectedRoot,
            setSelectedRoot,
            roots,
            setRoots,
        }),
        [
            searchQuery,
            debouncedSetSearchQuery,
            setSearchQueryImmediate,
            selectedRoot,
            setSelectedRoot,
            roots,
        ]
    )

    return (
        <SearchContext.Provider value={contextValue}>
            {children}
        </SearchContext.Provider>
    )
}

// Custom hook for using the search context
export const useSearch = () => {
    const context = useContext(SearchContext)
    if (context === undefined) {
        throw new Error('useSearch must be used within a SearchProvider')
    }
    return context
}

import React, {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
} from 'react'

interface PaginationContextType {
    currentPage: number
    totalPages: number
    totalItems: number
    itemsPerPage: number
    setPage: (page: number) => void
    setTotalItems: (total: number) => void
    setItemsPerPage: (count: number) => void
}

const PaginationContext = createContext<PaginationContextType>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 50,
    setPage: () => {},
    setTotalItems: () => {},
    setItemsPerPage: () => {},
})

export const PaginationProvider: React.FC<{
    children: React.ReactNode
    defaultItemsPerPage?: number
}> = ({ children, defaultItemsPerPage = 50 }) => {
    const [currentPage, setCurrentPage] = useState(1)
    const [totalItems, setTotalItems] = useState(0)
    const [itemsPerPage, setItemsPerPage] = useState(defaultItemsPerPage)

    // Calculate total pages based on total items and items per page
    const totalPages = useMemo(() => {
        return Math.max(1, Math.ceil(totalItems / itemsPerPage))
    }, [totalItems, itemsPerPage])

    // Enhanced page setter with validation
    const setPage = useCallback(
        (page: number) => {
            const validPage = Math.max(1, Math.min(page, totalPages))
            setCurrentPage(validPage)
        },
        [totalPages]
    )

    // Memoize the context value
    const contextValue = useMemo(
        () => ({
            currentPage,
            totalPages,
            totalItems,
            itemsPerPage,
            setPage,
            setTotalItems,
            setItemsPerPage,
        }),
        [currentPage, totalPages, totalItems, itemsPerPage, setPage]
    )

    return (
        <PaginationContext.Provider value={contextValue}>
            {children}
        </PaginationContext.Provider>
    )
}

// Custom hook for using the pagination context
export const usePagination = () => {
    const context = useContext(PaginationContext)
    if (context === undefined) {
        throw new Error(
            'usePagination must be used within a PaginationProvider'
        )
    }
    return context
}

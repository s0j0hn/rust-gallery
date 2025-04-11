import { useFolderData } from './FolderDataContext'
import { usePagination } from './PaginationContext'
import { useSearch } from './SearchContext'
import { useTags } from './TagsContext'

// This hook combines all the new split contexts to provide the same interface as the old useFolders hook
export const useFoldersCompat = () => {
    const { folders, isLoading, error, refetch } = useFolderData()
    const { currentPage, totalPages, setPage } = usePagination()
    const {
        searchQuery,
        setSearchQuery,
        setSearchQueryImmediate,
        selectedRoot,
        setSelectedRoot,
        roots,
    } = useSearch()
    const { tags } = useTags()

    return {
        folders,
        isLoading,
        currentPage,
        totalPages,
        setPage,
        searchQuery,
        setSearchQuery,
        setSearchQueryImmediate,
        selectedRoot,
        setSelectedRoot,
        roots,
        tags,
        error,
        refetch,
    }
}

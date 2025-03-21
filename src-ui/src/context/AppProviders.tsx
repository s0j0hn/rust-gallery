import React, { useEffect } from 'react'
import { SearchProvider } from './SearchContext'
import { PaginationProvider } from './PaginationContext'
import { TagsProvider } from './TagsContext'
import { FolderDataProvider } from './FolderDataContext'
import { api } from '../services/api'

// This component combines all context providers
export const AppProviders: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [roots, setRoots] = React.useState<string[]>([])

    // Fetch roots once at startup
    useEffect(() => {
        const fetchRoots = async () => {
            try {
                const response = await api.folders.getRoots()
                setRoots(response.map((root) => root.root))
            } catch (err) {
                console.error('Error fetching roots:', err)
            }
        }

        fetchRoots()
    }, [])

    return (
        <SearchProvider initialRoots={roots}>
            <PaginationProvider defaultItemsPerPage={50}>
                <TagsProvider>
                    <FolderDataProvider>{children}</FolderDataProvider>
                </TagsProvider>
            </PaginationProvider>
        </SearchProvider>
    )
}

import React, { createContext, ReactNode, useCallback, useState } from 'react'
import { Folder, JsonFilePhoto } from '../types/gallery'
import { api } from '../services/api'

interface UIContextType {
    tagDialogOpen: boolean
    deleteDialogOpen: boolean
    randomPhotoDialogOpen: boolean
    selectedFolder: Folder | null
    folderToDelete: Folder | null
    randomPhotos: JsonFilePhoto[]
    openTagDialog: (folder: any) => void
    closeTagDialog: () => void
    openDeleteDialog: (folder: Folder) => void
    closeDeleteDialog: () => void
    openRandomPhotos: (folderName: string) => Promise<void>
    closeRandomPhotos: () => void // New function
}

export const UIContext = createContext<UIContextType>({} as UIContextType)

export const UIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [tagDialogOpen, setTagDialogOpen] = useState<boolean>(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false)
    const [randomPhotoDialogOpen, setRandomPhotoDialogOpen] =
        useState<boolean>(false)
    const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null)
    const [folderToDelete, setFolderToDelete] = useState<Folder | null>(null)
    const [randomPhotos, setRandomPhotos] = useState<JsonFilePhoto[]>([])

    // Tag dialog functions
    const openTagDialog = useCallback(async (folder: Folder) => {
        const tags = await api.tags.getAll(folder.title)
        setSelectedFolder({
            ...folder,
            tags: [...tags], // Create a deep copy to avoid reference issues
        })
        setTagDialogOpen(true)
    }, [])

    const closeTagDialog = useCallback(() => {
        setTagDialogOpen(false)
        setSelectedFolder(null)
    }, [])

    // Delete dialog functions
    const openDeleteDialog = useCallback((folder: Folder) => {
        setFolderToDelete(folder)
        setDeleteDialogOpen(true)
    }, [])

    const closeDeleteDialog = useCallback(() => {
        setDeleteDialogOpen(false)
        setFolderToDelete(null)
    }, [])

    // Random photo functions
    const openRandomPhotos = useCallback(async (folderTitle: string) => {
        try {
            const photos = await api.photos.getRandomByFolder(folderTitle)
            if (photos.items.length > 0) {
                setRandomPhotos(photos.items)
                setRandomPhotoDialogOpen(true)
            }
        } catch (error) {
            console.error('Error fetching random photo:', error)
        }
    }, [])

    // Add close function for random photos
    const closeRandomPhotos = useCallback(() => {
        setRandomPhotoDialogOpen(false)
        setRandomPhotos([]) // Clear the photos array to free memory
    }, [])

    return (
        <UIContext.Provider
            value={{
                tagDialogOpen,
                deleteDialogOpen,
                randomPhotoDialogOpen,
                selectedFolder,
                folderToDelete,
                randomPhotos,
                openTagDialog,
                closeTagDialog,
                openDeleteDialog,
                closeDeleteDialog,
                openRandomPhotos,
                closeRandomPhotos, // Add the new function to the context
            }}
        >
            {children}
        </UIContext.Provider>
    )
}

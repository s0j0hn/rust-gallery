// src-ui/src/hooks/useAlbums.ts
import { useContext } from 'react'
import { FolderContext } from '../context/FolderContext'

export const useFolders = () => {
    return useContext(FolderContext)
}

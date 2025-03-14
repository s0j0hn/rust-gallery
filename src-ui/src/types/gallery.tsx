// Define TypeScript interfaces for our data structures
export interface Folder {
    title: string
    thumbnails: string[]
    photo_count: number
    tags: string[]
    root: string
}

export interface Root {
    photo_count: number
    root: string
}

export interface JsonResponseTags {
    status: number
    tags: string[]
}

export interface JsonResponse<T> {
    total: number
    page: number
    items: T
}

export interface JsonFilePhoto {
    id: number
    path: string
    hash: string
    extention: string
    filename: string
    folder_name: string
    width: number
    height: number
    tags: string
    root: string
}

export interface Photo {
    id: number
    title: string
    thumbnail: string
    src: string
    w: number
    h: number
    tags: string[]
    folderName?: string // Optional property, present when viewing photos by tag
}

export interface MenuSectionProps {
    folders?: Folder[]
    tags?: string[]
    searchQuery?: string
    setSearchQuery?: (query: string) => void
    selectedRoot?: string | null
    setSelectedRoot?: (folder: string | null) => void
    onTagClick?: (type: 'tag' | 'root', value: string) => void
    onIndexation?: () => void
    onApiDocsClick?: () => void
    isIndexing?: boolean
}

export interface RandomPhotoProps {
    photos: JsonFilePhoto[]
}

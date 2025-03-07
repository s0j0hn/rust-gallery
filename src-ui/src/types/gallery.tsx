// Define TypeScript interfaces for our data structures
export interface Album {
    id: number;
    title: string;
    thumbnails: string[];
    photoCount: number;
    tags: string[];
    folder: string;
}

export interface Photo {
    id: number;
    title: string;
    thumbnail: string;
    src: string;
    w: number;
    h: number;
    tags: string[];
    albumId?: number; // Optional property, present when viewing photos by tag
}

export interface ThumbnailSlideshowProps {
    thumbnails: string[];
}

export interface TagPhotoViewProps {
    tag: string;
    onBack: () => void;
    isMobile: boolean;
}

export interface AlbumDetailProps {
    albumId: number;
    onBack: () => void;
    onTagClick: (type: 'tag' | 'folder', value: string) => void;
    isMobile: boolean;
}

export interface MenuSectionProps {
    albums: Album[];
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    selectedFolder: string | null;
    setSelectedFolder: (folder: string | null) => void;
    onTagClick: (type: 'tag' | 'folder', value: string) => void;
    onIndexation: () => void;
    onApiDocsClick?: () => void;
    isIndexing: boolean;
}

export interface RandomPhotoProps {
    photo: {
        id: number;
        title: string;
        src: string;
        w: number;
        h: number;
        albumId?: number;
    };
    onClose: () => void;
    onShowAnother: () => void;
    onViewAlbum: () => void;
}
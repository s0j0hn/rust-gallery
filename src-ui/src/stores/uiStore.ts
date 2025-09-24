import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface UIState {
  // State
  isSidebarOpen: boolean
  viewMode: 'grid' | 'list'
  imageSize: 'small' | 'medium' | 'large'
  theme: 'light' | 'dark'
  tagDialogOpen: boolean
  deleteDialogOpen: boolean
  randomPhotoDialogOpen: boolean
  selectedFolder: any
  folderToDelete: any
  randomPhotos: any[]

  // Actions
  toggleSidebar: () => void
  setSidebarOpen: (isOpen: boolean) => void
  setViewMode: (mode: 'grid' | 'list') => void
  setImageSize: (size: 'small' | 'medium' | 'large') => void
  setTheme: (theme: 'light' | 'dark') => void
  openTagDialog: (folder: any) => void
  closeTagDialog: () => void
  openDeleteDialog: (folder: any) => void
  closeDeleteDialog: () => void
  openRandomPhotos: (photos: any[]) => void
  closeRandomPhotos: () => void
}

export const useUIStore = create<UIState>()(
  devtools(
    (set) => ({
      // Initial state
      isSidebarOpen: false,
      viewMode: 'grid',
      imageSize: 'medium',
      theme: 'light',
      tagDialogOpen: false,
      deleteDialogOpen: false,
      randomPhotoDialogOpen: false,
      selectedFolder: null,
      folderToDelete: null,
      randomPhotos: [],

      // Actions
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      setSidebarOpen: (isOpen: boolean) => set({ isSidebarOpen: isOpen }),
      setViewMode: (mode: 'grid' | 'list') => set({ viewMode: mode }),
      setImageSize: (size: 'small' | 'medium' | 'large') => set({ imageSize: size }),
      setTheme: (theme: 'light' | 'dark') => {
        // Apply theme to document
        if (theme === 'dark') {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
        set({ theme })
      },
      openTagDialog: (folder: any) => set({ tagDialogOpen: true, selectedFolder: folder }),
      closeTagDialog: () => set({ tagDialogOpen: false, selectedFolder: null }),
      openDeleteDialog: (folder: any) => set({ deleteDialogOpen: true, folderToDelete: folder }),
      closeDeleteDialog: () => set({ deleteDialogOpen: false, folderToDelete: null }),
      openRandomPhotos: (photos: any[]) =>
        set({ randomPhotoDialogOpen: true, randomPhotos: photos }),
      closeRandomPhotos: () => set({ randomPhotoDialogOpen: false, randomPhotos: [] }),
    }),
    {
      name: 'UIStore',
    }
  )
)

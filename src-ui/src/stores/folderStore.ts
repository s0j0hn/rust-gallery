import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { Folder, JsonRootResponse } from '../types/gallery'
import { api } from '../services/api'

interface FolderState {
  // State
  folders: Folder[]
  roots: JsonRootResponse[]
  tags: string[]
  filteredFolders: Folder[]
  loading: boolean
  searchQuery: string
  selectedRoot: string | null
  recentSearches: string[]
  isIndexing: boolean
  hasMore: boolean
  page: number

  // Actions
  setSearchQuery: (query: string) => void
  setSelectedRoot: (rootName: string | null) => void
  refreshFolders: () => Promise<void>
  updateFolderTags: (folderTitle: string, tags: string[]) => Promise<void>
  deleteFolder: (folderTitle: string) => Promise<void>
  startIndexation: () => Promise<void>
  cancelIndexation: () => Promise<void>
  loadMoreFolders: () => Promise<void>
  fetchRoots: () => Promise<void>
  fetchTags: () => Promise<void>
}

export const useFolderStore = create<FolderState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        folders: [],
        roots: [],
        tags: [],
        filteredFolders: [],
        loading: false,
        searchQuery: '',
        selectedRoot: 'files',
        recentSearches: [],
        isIndexing: false,
        hasMore: true,
        page: 1,

        // Actions
        setSearchQuery: (query: string) => {
          const { recentSearches } = get()

          // Update recent searches
          if (query.trim()) {
            const newRecentSearches = [
              query,
              ...recentSearches.filter((search) => search !== query),
            ].slice(0, 5)

            set({
              searchQuery: query,
              recentSearches: newRecentSearches,
              page: 1,
            })
          } else {
            set({ searchQuery: query, page: 1 })
          }
        },

        setSelectedRoot: (rootName: string | null) => {
          set({ selectedRoot: rootName, page: 1 })
        },

        refreshFolders: async () => {
          const { selectedRoot, searchQuery } = get()
          set({ loading: true, page: 1 })

          try {
            const configResponse = await api.config.getConfig()
            const data = await api.folders.getAll(
              1,
              configResponse.folders_per_page,
              selectedRoot || '',
              searchQuery
            )

            const hasMoreFolders = data.length === configResponse.folders_per_page
            set({
              folders: data,
              filteredFolders: data,
              hasMore: hasMoreFolders,
              loading: false,
            })
          } catch (err) {
            console.error('Failed to fetch folders:', err)
            set({ loading: false })
          }
        },

        loadMoreFolders: async () => {
          const { hasMore, loading, page, selectedRoot, searchQuery, folders, filteredFolders } =
            get()

          if (!hasMore || loading) return

          const nextPage = page + 1
          set({ loading: true })

          try {
            const configResponse = await api.config.getConfig()
            const newFolders = await api.folders.getAll(
              nextPage,
              configResponse.folders_per_page,
              selectedRoot || '',
              searchQuery
            )

            if (newFolders.length > 0) {
              const existingTitles = new Set(folders.map((folder) => folder.title))
              const uniqueNewFolders = newFolders.filter(
                (folder) => !existingTitles.has(folder.title)
              )

              set({
                folders: [...folders, ...uniqueNewFolders],
                filteredFolders: [...filteredFolders, ...uniqueNewFolders],
                page: nextPage,
                hasMore: newFolders.length === configResponse.folders_per_page,
                loading: false,
              })
            } else {
              set({ hasMore: false, loading: false })
            }
          } catch (err) {
            console.error('Failed to load more folders:', err)
            set({ loading: false })
          }
        },

        updateFolderTags: async (folderTitle: string, tags: string[]) => {
          try {
            const result = await api.folders.updateTags(folderTitle, tags)

            set((state) => ({
              folders: state.folders.map((folder) =>
                folder.title === folderTitle ? { ...folder, tags: result } : folder
              ),
              filteredFolders: state.filteredFolders.map((folder) =>
                folder.title === folderTitle ? { ...folder, tags: result } : folder
              ),
            }))
          } catch (err) {
            console.error('Failed to update tags:', err)
            throw err
          }
        },

        deleteFolder: async (folderTitle: string) => {
          try {
            await api.folders.delete(folderTitle)

            set((state) => ({
              folders: state.folders.filter((folder) => folder.title !== folderTitle),
              filteredFolders: state.filteredFolders.filter(
                (folder) => folder.title !== folderTitle
              ),
            }))
          } catch (err) {
            console.error(`Failed to delete folder ${folderTitle}:`, err)
            throw err
          }
        },

        startIndexation: async () => {
          set({ isIndexing: true })

          try {
            const data = await api.indexation.indexPhotos()
            if (!data.task_running) {
              // Poll for completion
              const checkInterval = setInterval(async () => {
                try {
                  const status = await api.indexation.indexPhotos()
                  if (!status.task_running) {
                    clearInterval(checkInterval)
                    set({ isIndexing: false })
                    get().refreshFolders()
                  }
                } catch (err) {
                  console.error('Failed to check indexation status:', err)
                  clearInterval(checkInterval)
                  set({ isIndexing: false })
                }
              }, 30000)

              // Store interval ID for cleanup if needed
              set({ isIndexing: true })
            }
          } catch (err) {
            console.error('Indexation failed:', err)
            set({ isIndexing: false })
            throw err
          }
        },

        cancelIndexation: async () => {
          try {
            const response = await api.indexation.cancelIndexTask()

            if (response.status === 'success') {
              set({ isIndexing: false })
              get().refreshFolders()
            }
          } catch (err) {
            console.error('Failed to cancel indexation:', err)
            throw err
          }
        },

        fetchRoots: async () => {
          try {
            const data = await api.folders.getRoots()
            set({ roots: data })
          } catch (err) {
            console.error('Failed to fetch roots:', err)
          }
        },

        fetchTags: async () => {
          try {
            const data = await api.tags.getAll()
            set({ tags: data })
          } catch (err) {
            console.error('Failed to fetch tags:', err)
          }
        },
      }),
      {
        name: 'folder-storage',
        partialize: (state) => ({
          recentSearches: state.recentSearches,
          selectedRoot: state.selectedRoot,
        }),
      }
    ),
    {
      name: 'FolderStore',
    }
  )
)

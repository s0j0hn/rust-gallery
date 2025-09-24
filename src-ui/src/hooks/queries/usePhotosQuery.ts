import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import { api } from '../../services/api'

// Query keys factory
export const photoKeys = {
  all: ['photos'] as const,
  lists: () => [...photoKeys.all, 'list'] as const,
  list: (folderName: string) => [...photoKeys.lists(), folderName] as const,
  random: () => [...photoKeys.all, 'random'] as const,
  randomByTag: (tag: string, size: number) => [...photoKeys.random(), 'tag', tag, size] as const,
  randomByFolder: (folderName: string, size: number) =>
    [...photoKeys.random(), 'folder', folderName, size] as const,
}

// Fetch photos by folder with infinite scrolling
export const useInfinitePhotosQuery = (folderName: string, perPage: number = 50) => {
  return useInfiniteQuery({
    queryKey: photoKeys.list(folderName),
    queryFn: async ({ pageParam = 1 }) => {
      const response = await api.photos.getAllByFolder(folderName, perPage, pageParam)
      return {
        ...response,
        nextPage: response.items.length === perPage ? pageParam + 1 : undefined,
      }
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    enabled: !!folderName,
  })
}

// Fetch random photos by tag
export const useRandomPhotosByTagQuery = (tag: string, size: number = 10) => {
  return useQuery({
    queryKey: photoKeys.randomByTag(tag, size),
    queryFn: () => api.photos.getRandomByTag(tag, size),
    enabled: !!tag,
  })
}

// Fetch random photos by folder
export const useRandomPhotosByFolderQuery = (folderName: string, size: number = 10) => {
  return useQuery({
    queryKey: photoKeys.randomByFolder(folderName, size),
    queryFn: () => api.photos.getRandomByFolder(folderName, size),
    enabled: !!folderName,
  })
}

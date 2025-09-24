import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { api } from '../../services/api'
import { Folder } from '../../types/gallery'

// Query keys factory
export const folderKeys = {
  all: ['folders'] as const,
  lists: () => [...folderKeys.all, 'list'] as const,
  list: (filters: { page?: number; root?: string; searchBy?: string }) =>
    [...folderKeys.lists(), filters] as const,
  details: () => [...folderKeys.all, 'detail'] as const,
  detail: (name: string) => [...folderKeys.details(), name] as const,
}

// Fetch folders with infinite query for pagination
export const useInfiniteFoldersQuery = (
  perPage: number = 15,
  root: string = '',
  searchBy?: string
) => {
  return useInfiniteQuery({
    queryKey: folderKeys.list({ root, searchBy }),
    queryFn: async ({ pageParam = 1 }) => {
      const folders = await api.folders.getAll(pageParam, perPage, root, searchBy)
      return {
        folders,
        nextPage: folders.length === perPage ? pageParam + 1 : undefined,
      }
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    select: (data) => ({
      pages: data.pages,
      pageParams: data.pageParams,
      folders: data.pages.flatMap((page) => page.folders),
    }),
  })
}

// Fetch single folder
export const useFolderQuery = (folderName: string) => {
  return useQuery({
    queryKey: folderKeys.detail(folderName),
    queryFn: () => api.folders.getByName(folderName),
    enabled: !!folderName,
  })
}

// Update folder tags mutation
export const useUpdateFolderTagsMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ folderName, tags }: { folderName: string; tags: string[] }) =>
      api.folders.updateTags(folderName, tags),
    onSuccess: (tags, { folderName }) => {
      // Update cache optimistically
      queryClient.setQueriesData({ queryKey: folderKeys.lists() }, (oldData: any) => {
        if (!oldData) return oldData

        return {
          ...oldData,
          pages: oldData.pages.map((page: any) => ({
            ...page,
            folders: page.folders.map((folder: Folder) =>
              folder.title === folderName ? { ...folder, tags } : folder
            ),
          })),
        }
      })

      // Invalidate queries to refetch
      queryClient.invalidateQueries({ queryKey: folderKeys.detail(folderName) })
    },
  })
}

// Delete folder mutation
export const useDeleteFolderMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (folderName: string) => api.folders.delete(folderName),
    onSuccess: (_, folderName) => {
      // Remove from cache
      queryClient.setQueriesData({ queryKey: folderKeys.lists() }, (oldData: any) => {
        if (!oldData) return oldData

        return {
          ...oldData,
          pages: oldData.pages.map((page: any) => ({
            ...page,
            folders: page.folders.filter((folder: Folder) => folder.title !== folderName),
          })),
        }
      })

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: folderKeys.lists() })
    },
  })
}

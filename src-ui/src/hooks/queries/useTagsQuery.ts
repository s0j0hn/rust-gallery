import { useQuery } from '@tanstack/react-query'
import { api } from '../../services/api'

// Query keys factory
export const tagKeys = {
  all: ['tags'] as const,
  list: (folderName?: string) => [...tagKeys.all, 'list', folderName] as const,
}

// Fetch all tags
export const useTagsQuery = (folderName?: string) => {
  return useQuery({
    queryKey: tagKeys.list(folderName),
    queryFn: () => api.tags.getAll(folderName),
    staleTime: 1000 * 60 * 10, // Tags don't change often, cache for 10 minutes
  })
}

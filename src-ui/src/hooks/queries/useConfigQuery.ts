import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../services/api'
import { JsonConfig } from '../../types/gallery'

// Query keys factory
export const configKeys = {
  all: ['config'] as const,
  current: () => [...configKeys.all, 'current'] as const,
}

// Fetch config
export const useConfigQuery = () => {
  return useQuery({
    queryKey: configKeys.current(),
    queryFn: () => api.config.getConfig(),
    staleTime: 1000 * 60 * 30, // Config rarely changes, cache for 30 minutes
  })
}

// Update config mutation
export const useUpdateConfigMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (config: JsonConfig) => api.config.updateConfig(config),
    onSuccess: (_, newConfig) => {
      // Update cache
      queryClient.setQueryData(configKeys.current(), newConfig)
      // Invalidate to ensure consistency
      queryClient.invalidateQueries({ queryKey: configKeys.current() })
    },
  })
}

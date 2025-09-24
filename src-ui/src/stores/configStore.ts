import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { JsonConfig } from '../types/gallery'
import { api } from '../services/api'

interface ConfigState {
  // State
  config: JsonConfig
  loading: boolean
  error: string | null

  // Actions
  refreshConfig: () => Promise<void>
  updateConfig: (config: JsonConfig) => Promise<void>
}

const defaultConfig: JsonConfig = {
  random_equal_folders: 1,
  photo_per_random: 10,
  folders_per_page: 15,
  equal_enabled: true,
}

export const useConfigStore = create<ConfigState>()(
  devtools(
    (set) => ({
      // Initial state
      config: defaultConfig,
      loading: false,
      error: null,

      // Actions
      refreshConfig: async () => {
        set({ loading: true, error: null })
        try {
          const data = await api.config.getConfig()
          set({ config: data, loading: false })
        } catch (err) {
          console.error('Failed to fetch config:', err)
          set({
            error: err instanceof Error ? err.message : 'Failed to fetch config',
            loading: false,
          })
        }
      },

      updateConfig: async (config: JsonConfig) => {
        set({ loading: true, error: null })
        try {
          await api.config.updateConfig(config)
          set({ config, loading: false })
        } catch (err) {
          console.error('Failed to update config:', err)
          set({
            error: err instanceof Error ? err.message : 'Failed to update config',
            loading: false,
          })
          throw err
        }
      },
    }),
    {
      name: 'ConfigStore',
    }
  )
)

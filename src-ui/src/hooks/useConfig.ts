import { useConfigStore } from '../stores/configStore'

export const useConfig = () => {
  return useConfigStore()
}

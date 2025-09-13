import React, {
    createContext,
    ReactNode,
    useCallback,
    useEffect,
    useState,
} from 'react'
import { JsonConfig } from '../types/gallery'
import { api } from '../services/api'

interface ConfigContextType {
    config: JsonConfig
    loading: boolean
    error: string | null
    refreshConfig: () => Promise<void>
    updateConfig: (newConfig: JsonConfig) => Promise<void>
}

const defaultConfig: JsonConfig = {
    random_equal_folders: 25,
    photo_per_random: 500,
    folders_per_page: 16,
    equal_enabled: 1,
}

export const ConfigContext = createContext<ConfigContextType>({
    config: defaultConfig,
    loading: false,
    error: null,
    refreshConfig: async () => {},
    updateConfig: async () => {},
})

export const ConfigProvider: React.FC<{ children: ReactNode }> = ({
    children,
}) => {
    const [config, setConfig] = useState<JsonConfig>(defaultConfig)
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string | null>(null)

    const refreshConfig = useCallback(async () => {
        try {
            setLoading(true)
            const configData = await api.config.getConfig()
            setConfig(configData)
            setError(null)
        } catch (err) {
            console.error('Failed to load configuration:', err)
            setError('Failed to load configuration')
        } finally {
            setLoading(false)
        }
    }, [])

    const updateConfig = useCallback(
        async (newConfig: JsonConfig) => {
            try {
                setLoading(true)
                await api.config.updateConfig(newConfig)
                setConfig(newConfig)
                setError(null)
            } catch (err) {
                console.error('Failed to update configuration:', err)
                setError('Failed to update configuration')
                throw err
            } finally {
                setLoading(false)
            }
        },
        [] // Remove config dependency as it's not used in the callback
    )

    useEffect(() => {
        refreshConfig()
    }, [refreshConfig])

    return (
        <ConfigContext.Provider
            value={{
                config,
                loading,
                error,
                refreshConfig,
                updateConfig,
            }}
        >
            {children}
        </ConfigContext.Provider>
    )
}

// Create a hook for easy access
export const useConfig = () => {
    const context = React.useContext(ConfigContext)
    if (context === undefined) {
        throw new Error('useConfig must be used within a ConfigProvider')
    }
    return context
}

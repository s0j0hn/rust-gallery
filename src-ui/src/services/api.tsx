import axios, { AxiosError } from 'axios'
import DOMPurify from 'dompurify'
import { API_BASE_URL } from '../config/constants'
import {
    Folder,
    JsonConfig,
    JsonFilePhoto,
    JsonResponse,
    JsonResponseCancelTask,
    JsonResponseIndex,
    JsonRootResponse,
} from '../types/gallery'

// Sanitization utilities
const sanitize = {
    // Basic string sanitization
    string: (value: string): string => {
        return DOMPurify.sanitize(value)
    },

    // Sanitize folder name (more restrictive)
    folderName: (name: string): string => {
        // First apply basic sanitization
        const sanitized = DOMPurify.sanitize(name)
        // Additionally remove any characters that shouldn't be in folder names
        return sanitized.replace(/[^a-zA-Z0-9_\-. ]/g, '')
    },

    // Sanitize array of strings
    stringArray: (arr: string[]): string[] => {
        return arr.map((item) => DOMPurify.sanitize(item))
    },

    // Safe query params
    queryParams: (params: Record<string, any>): Record<string, any> => {
        const sanitizedParams: Record<string, any> = {}

        for (const key in params) {
            if (params[key] === undefined) continue

            if (typeof params[key] === 'string') {
                sanitizedParams[key] = DOMPurify.sanitize(params[key])
            } else {
                sanitizedParams[key] = params[key]
            }
        }

        return sanitizedParams
    },
}

// Create an axios instance with default config
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000, // 10 seconds timeout
})

// Add response interceptor for error handling
apiClient.interceptors.response.use(
    // Success handler
    (response) => response,
    // Error handler
    (error: AxiosError) => {
        // Log the error but don't expose sensitive information to users
        console.error('API request failed:', {
            url: error.config?.url,
            method: error.config?.method,
            status: error.response?.status,
            message: error.message,
        })

        // You can handle specific status codes
        if (error.response) {
            switch (error.response.status) {
                case 400:
                    return Promise.reject(
                        new Error(
                            'Invalid request. Please check your input and try again.'
                        )
                    )
                case 401:
                    return Promise.reject(
                        new Error('You need to log in to perform this action.')
                    )
                case 403:
                    return Promise.reject(
                        new Error(
                            "You don't have permission to perform this action."
                        )
                    )
                case 404:
                    return Promise.reject(
                        new Error('The requested resource was not found.')
                    )
                case 429:
                    return Promise.reject(
                        new Error('Too many requests. Please try again later.')
                    )
                case 500:
                case 502:
                case 503:
                case 504:
                    return Promise.reject(
                        new Error('Server error. Please try again later.')
                    )
                default:
                    return Promise.reject(
                        new Error(
                            'An unexpected error occurred. Please try again later.'
                        )
                    )
            }
        }

        // Network errors
        if (error.code === 'ECONNABORTED') {
            return Promise.reject(
                new Error(
                    'Request timeout. Please check your connection and try again.'
                )
            )
        }

        if (!navigator.onLine) {
            return Promise.reject(
                new Error(
                    'You are offline. Please check your internet connection.'
                )
            )
        }

        return Promise.reject(
            new Error(
                'An error occurred while connecting to the server. Please try again later.'
            )
        )
    }
)

// API methods
export const api = {
    config: {
        getConfig: async (): Promise<JsonConfig> => {
            const response = await apiClient.get('/config')
            return response.data
        },
        updateConfig: async (params: JsonConfig): Promise<void> => {
            const response = await apiClient.post('/config', params)
            if (response.data.status === 'error') {
                throw new Error(
                    'Error while updating the config: ' + response.data.error
                )
            }
        },
    },
    // Folder-related API calls
    folders: {
        // Get all roots folders
        getRoots: async (): Promise<JsonRootResponse[]> => {
            const response = await apiClient.get('/folders/roots')
            return response.data
        },

        // Get all folders with tags in a single request (avoiding N+1 queries)
        getAll: async (
            page: number = 1,
            perPage: number = 15,
            root: string,
            searchBy?: string
        ): Promise<Folder[]> => {
            const sanitizedRoot = root ? sanitize.folderName(root) : undefined
            const sanitizedSearchBy = searchBy
                ? sanitize.string(searchBy)
                : undefined

            const params = sanitize.queryParams({
                root: sanitizedRoot,
                per_page: perPage,
                page,
                searchby: sanitizedSearchBy,
            })

            const response = await apiClient.get('/folders/json', { params })
            const folders: Folder[] = response.data

            // Batch fetch tags for all folders in a single request if needed
            // For now, return folders as-is since tags might already be included
            // or fetched separately when needed
            return folders.map((folder: Folder) => ({
                ...folder,
                tags: folder.tags || [],
            }))
        },

        // Get folder by name
        getByName: async (folderName: string): Promise<Folder | null> => {
            const sanitizedName = sanitize.folderName(folderName)
            const response = await apiClient.get(
                `/folders/json/name/${sanitizedName}`
            )
            return response.data[0] ? response.data[0] : null
        },

        // Delete album
        delete: async (folderName: string): Promise<void> => {
            const sanitizedName = sanitize.folderName(folderName)
            const response = await apiClient.post(`/folders/delete`, {
                folder_name: sanitizedName,
            })
            if (response.data) {
                if (response.data.rows !== 1) {
                    throw new Error('Error while deleting folder')
                }
            }
        },

        // Update album tags
        updateTags: async (
            folderName: string,
            tags: string[]
        ): Promise<string[]> => {
            const sanitizedName = sanitize.folderName(folderName)
            const sanitizedTags = sanitize.stringArray(tags)

            const response = await apiClient.post(`/tags/assign/folder`, {
                tags: sanitizedTags,
                folder_name: sanitizedName,
            })
            return response.data.tags ? response.data.tags : []
        },
    },

    // Photo-related API calls
    photos: {
        // Get photos by album ID
        getAllByFolder: async (
            folderName: string,
            perPage: number = 50,
            page: number = 1
        ): Promise<JsonResponse<JsonFilePhoto[]>> => {
            const sanitizedName = sanitize.folderName(folderName)

            const params = sanitize.queryParams({
                folder: sanitizedName,
                per_page: perPage,
                page: page,
            })

            const response = await apiClient.get(`/files/json`, { params })
            return response.data
        },

        // Get random photos by tag
        getRandomByTag: async (
            tag: string,
            size: number
        ): Promise<JsonResponse<JsonFilePhoto[]>> => {
            let params = {}
            if (tag) {
                const sanitizedTag = sanitize.folderName(tag)
                params = {
                    tag: sanitizedTag,
                    size: size,
                }
            }

            const response = await apiClient.get('/files/random/json', {
                params,
            })

            return response.data
        },

        // Get random photo from album
        getRandomByFolder: async (
            folderName: string,
            size: number
        ): Promise<JsonResponse<JsonFilePhoto[]>> => {
            const sanitizedName = sanitize.folderName(folderName)

            const params = sanitize.queryParams({
                size,
                folder: sanitizedName,
            })

            const response = await apiClient.get(`/files/random/json`, {
                params,
            })
            return response.data
        },
    },

    // Tag-related API calls
    tags: {
        // Get all tags
        getAll: async (folderName?: string): Promise<string[]> => {
            let params = {}
            if (folderName) {
                const sanitizedName = sanitize.folderName(folderName)
                params = { folder: sanitizedName }
            }

            const response = await apiClient.get('/tags', { params })
            return response.data
        },
    },

    // Indexation API call
    indexation: {
        // Trigger photo indexation
        indexPhotos: async (): Promise<JsonResponseIndex> => {
            const response = await apiClient.get('/files/task/index')
            return response.data
        },
        cancelIndexTask: async (): Promise<JsonResponseCancelTask> => {
            const response = await apiClient.get('/files/task/cancel')
            return response.data
        },
    },
}

// Export the API client for direct use when needed
export default apiClient

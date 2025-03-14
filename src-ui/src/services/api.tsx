import axios from 'axios'
import {
    Folder,
    JsonFilePhoto,
    JsonResponse,
    JsonResponseTags,
    Photo,
    Root,
} from '../types/gallery'

// Create an axios instance with default config
const apiClient = axios.create({
    baseURL: 'http://192.168.1.27:8000/',
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000, // 10 seconds timeout
})

// API endpoints
const endpoints = {
    folders: '/folders',
    photos: '/photos',
    tags: '/tags',
    indexPhotos: '/index',
}

// API methods
export const api = {
    // Folder-related API calls
    folders: {
        // Get all roots folders
        getRoots: async (): Promise<Root[]> => {
            const response = await apiClient.get('/folders/roots')
            return response.data
        },

        // Get all folders
        getAll: async (
            page: number = 1,
            perPage: number = 15,
            root: string,
            searchBy?: string
        ): Promise<Folder[]> => {
            const response = await apiClient.get('/folders/json', {
                params: {
                    root: root ? root : undefined,
                    per_page: perPage,
                    page,
                    searchby: searchBy,
                },
            })
            return response.data
        },

        // Get folder by name
        getByName: async (folderName: string): Promise<Folder | null> => {
            const response = await apiClient.get(
                `/folders/json/name/${folderName}`
            )
            return response.data[0] ? response.data[0] : null
        },

        // Delete album
        delete: async (folderName: string): Promise<void> => {
            const response = await apiClient.post(
                `${endpoints.folders}/delete`,
                { data: folderName }
            )
            if (response.data) {
                if (response.data.rows != 1) {
                    throw new Error('Error while deleting folder')
                }
            }
        },

        // Update album tags
        updateTags: async (
            folderName: string,
            tags: string[]
        ): Promise<string[]> => {
            const response = await apiClient.post(`/tags/assign/folder`, {
                tags,
                folder_name: folderName,
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
            const response = await apiClient.get(`/files/json`, {
                params: {
                    folder: folderName,
                    per_page: perPage,
                    page: page,
                },
            })
            return response.data
        },

        // Get photos by tag
        getRandomByTag: async (tag: string): Promise<Photo[]> => {
            const response = await apiClient.get(
                `${endpoints.photos}?tag=${encodeURIComponent(tag)}`
            )
            return response.data
        },

        // Get random photo from album
        getRandomByFolder: async (
            folderNem: string,
            size: number = 200
        ): Promise<JsonResponse<JsonFilePhoto[]>> => {
            const response = await apiClient.get(`/files/random/json`, {
                params: {
                    size,
                    folder: folderNem,
                },
            })
            return response.data
        },

        // Update photo tags
        updateTags: async (
            imageHash: string,
            tags: string[]
        ): Promise<string[]> => {
            const response = await apiClient.post(`/tags/assign`, {
                tags,
                image_hash: imageHash,
            })
            return response.data.tags ? response.data.tags : []
        },
    },

    // Tag-related API calls
    tags: {
        // Get all tags
        getAll: async (folderName?: string): Promise<string[]> => {
            let params = {}
            if (folderName) {
                params = { folder: folderName }
            }

            const response = await apiClient.get(endpoints.tags, { params })
            return response.data
        },
    },

    // Indexation API call
    indexation: {
        // Trigger photo indexation
        indexPhotos: async (): Promise<{ indexed: number }> => {
            const response = await apiClient.post(endpoints.indexPhotos)
            return response.data
        },
    },
}

// Export the API client for direct use when needed
export default apiClient

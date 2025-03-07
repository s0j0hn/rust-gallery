import axios from 'axios';
import {Album, Photo} from "../types/gallery";

// Create an axios instance with default config
const apiClient = axios.create({
    baseURL: 'http://192.168.1.27:8000',
    headers: {
        'Content-Type': 'application/json'
    },
    timeout: 10000 // 10 seconds timeout
});

// API endpoints
const endpoints = {
    albums: '/albums',
    photos: '/photos',
    tags: '/tags',
    folders: '/folders',
    indexPhotos: '/index'
};

// API methods
export const api = {
    // Album-related API calls
    albums: {
        // Get all albums
        getAll: async (): Promise<Album[]> => {
            const response = await apiClient.get(endpoints.albums);
            return response.data;
        },

        // Get album by ID
        getById: async (id: number): Promise<Album> => {
            const response = await apiClient.get(`${endpoints.albums}/${id}`);
            return response.data;
        },

        // Delete album
        delete: async (id: number): Promise<void> => {
            await apiClient.delete(`${endpoints.albums}/${id}`);
        },

        // Update album tags
        updateTags: async (id: number, tags: string[]): Promise<Album> => {
            const response = await apiClient.put(`${endpoints.albums}/${id}/tags`, { tags });
            return response.data;
        }
    },

    // Photo-related API calls
    photos: {
        // Get photos by album ID
        getByAlbumId: async (albumId: number): Promise<Photo[]> => {
            const response = await apiClient.get(`${endpoints.albums}/${albumId}/photos`);
            return response.data;
        },

        // Get photos by tag
        getByTag: async (tag: string): Promise<Photo[]> => {
            const response = await apiClient.get(`${endpoints.photos}?tag=${encodeURIComponent(tag)}`);
            return response.data;
        },

        // Get random photo from album
        getRandomsFromAlbum: async (albumId: number): Promise<Photo[]> => {
            const response = await apiClient.get(`${endpoints.albums}/${albumId}/photos/random`);
            return response.data;
        },

        // Update photo tags
        updateTags: async (id: number, tags: string[]): Promise<Photo> => {
            const response = await apiClient.put(`${endpoints.photos}/${id}/tags`, { tags });
            return response.data;
        }
    },

    // Tag-related API calls
    tags: {
        // Get all tags
        getAll: async (): Promise<string[]> => {
            const response = await apiClient.get(endpoints.tags);
            return response.data;
        }
    },

    // Folder-related API calls
    folders: {
        // Get all folders
        getAll: async (): Promise<string[]> => {
            const response = await apiClient.get(endpoints.folders);
            return response.data;
        }
    },

    // Indexation API call
    indexation: {
        // Trigger photo indexation
        indexPhotos: async (): Promise<{ indexed: number }> => {
            const response = await apiClient.post(endpoints.indexPhotos);
            return response.data;
        }
    }
};

// Export the API client for direct use when needed
export default apiClient;
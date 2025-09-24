// API Configuration - use relative URLs in dev to leverage Vite proxy
export const API_BASE_URL = 'http://localhost:8000'

// Ensure URL doesn't have trailing slash
export const getApiUrl = (path: string = '') => {
  const baseUrl = API_BASE_URL.replace(/\/$/, '')
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `${baseUrl}${cleanPath}`
}

// Cache configuration
export const CACHE_CONFIG = {
  MAX_SIZE_MB: 50,
  MAX_AGE_MS: 24 * 60 * 60 * 1000, // 24 hours
  CLEANUP_INTERVAL_MS: 60 * 60 * 1000, // 1 hour
}

// Image loading configuration
export const IMAGE_CONFIG = {
  THUMBNAIL_WIDTH: 150,
  THUMBNAIL_HEIGHT: 200,
  PREVIEW_WIDTH: 300,
  PREVIEW_HEIGHT: 400,
  FULL_WIDTH: 1920,
  FULL_HEIGHT: 1080,
}

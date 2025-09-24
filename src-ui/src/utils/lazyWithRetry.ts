import { ComponentType, lazy } from 'react'

// Retry logic for lazy loading with exponential backoff
export function lazyWithRetry<T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>,
  maxRetries = 3,
  baseDelay = 1000
): React.LazyExoticComponent<T> {
  return lazy(async () => {
    let lastError: Error | null = null

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await componentImport()
      } catch (error) {
        lastError = error as Error

        // If it's the last attempt, throw the error
        if (attempt === maxRetries - 1) {
          // Check if the error is due to a failed dynamic import
          if (
            error instanceof Error &&
            error.message.includes('Failed to fetch dynamically imported module')
          ) {
            // Reload the page to get fresh assets
            window.location.reload()
          }
          throw error
        }

        // Wait with exponential backoff before retrying
        const delay = baseDelay * Math.pow(2, attempt)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }

    throw lastError || new Error('Failed to load component after retries')
  })
}

// Preload a lazy component
export function preloadComponent(
  componentImport: () => Promise<{ default: ComponentType<any> }>
): void {
  componentImport().catch((error) => {
    console.error('Failed to preload component:', error)
  })
}

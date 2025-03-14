import { useCallback, useEffect, useRef } from 'react'

interface UseInfiniteScrollProps {
    onLoadMore: () => void
    hasMore: boolean
    loading: boolean
}

export const useInfiniteScroll = ({
    onLoadMore,
    hasMore,
    loading,
}: UseInfiniteScrollProps) => {
    const observerRef = useRef<IntersectionObserver | null>(null)
    const loadMoreRef = useCallback(
        (node: HTMLDivElement) => {
            if (loading) return

            if (observerRef.current) {
                observerRef.current.disconnect()
            }

            observerRef.current = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting && hasMore) {
                    onLoadMore()
                }
            })

            if (node) {
                observerRef.current.observe(node)
            }
        },
        [loading, hasMore, onLoadMore]
    )

    useEffect(() => {
        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect()
            }
        }
    }, [])

    return loadMoreRef
}

import React, { useState, useEffect, useRef } from 'react'
import { Search, X, Clock } from 'lucide-react'

interface SearchBarProps {
    value: string
    onChange: (query: string) => void
    placeholder?: string
    className?: string
}

const SearchBar: React.FC<SearchBarProps> = ({
    value,
    onChange,
    placeholder = 'Search folders...',
    className = '',
}) => {
    const [isFocused, setIsFocused] = useState(false)
    const [showRecent, setShowRecent] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    // Get recent searches from localStorage
    const getRecentSearches = (): string[] => {
        try {
            const saved = localStorage.getItem('recentSearches')
            return saved ? JSON.parse(saved) : []
        } catch (error) {
            console.error('Error loading recent searches:', error)
            return []
        }
    }

    const [recentSearches, setRecentSearches] =
        useState<string[]>(getRecentSearches)

    // Save search to recent searches
    const saveToRecentSearches = (query: string) => {
        if (!query.trim()) return

        try {
            const newRecent = [
                query,
                ...recentSearches.filter((item) => item !== query),
            ].slice(0, 5) // Keep only 5 most recent

            setRecentSearches(newRecent)
            localStorage.setItem('recentSearches', JSON.stringify(newRecent))
        } catch (error) {
            console.error('Error saving recent searches:', error)
        }
    }

    // Clear recent searches
    const clearRecentSearches = () => {
        setRecentSearches([])
        localStorage.removeItem('recentSearches')
    }

    // Handle search submission
    const handleSearch = (query: string) => {
        onChange(query)
        if (query.trim()) {
            saveToRecentSearches(query)
        }
    }

    // Handle keyboard shortcut (/) to focus search
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
                e.preventDefault()
                inputRef.current?.focus()
            }
        }

        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [])

    return (
        <div className={`relative ${className}`}>
            <div
                className={`
        relative flex items-center border rounded transition-all
        ${isFocused ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-300'}
        ${value ? 'bg-blue-50' : 'bg-white'}
      `}
            >
                <Search
                    size={16}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                />

                <input
                    ref={inputRef}
                    type="text"
                    value={value}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder={`${placeholder} (Press '/' to focus)`}
                    className="w-full pl-10 pr-10 py-2 bg-transparent outline-none"
                    onFocus={() => {
                        setIsFocused(true)
                        setShowRecent(recentSearches.length > 0)
                    }}
                    onBlur={() => {
                        setIsFocused(false)
                        // Delay hiding to allow clicking on the dropdown
                        setTimeout(() => setShowRecent(false), 200)
                    }}
                    aria-label="Search folders"
                />

                {/* Clear button */}
                {value && (
                    <button
                        type="button"
                        onClick={() => handleSearch('')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        aria-label="Clear search"
                    >
                        <X size={16} />
                    </button>
                )}
            </div>

            {/* Search status indicator */}
            {value && (
                <div className="absolute -bottom-6 left-0 text-sm text-blue-600 font-medium flex items-center">
                    <Search size={12} className="mr-1" />
                    Searching: "{value}"
                    <button
                        onClick={() => handleSearch('')}
                        className="ml-2 text-blue-800 hover:underline text-xs"
                        type="button"
                    >
                        Clear
                    </button>
                </div>
            )}

            {/* Recent searches dropdown */}
            {showRecent && recentSearches.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-md shadow-md z-10 border border-gray-200">
                    <div className="p-2 border-b border-gray-100">
                        <p className="text-xs text-gray-500 font-medium flex items-center">
                            <Clock size={12} className="mr-1" />
                            Recent searches
                        </p>
                    </div>
                    <ul>
                        {recentSearches.map((search, index) => (
                            <li key={index}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        handleSearch(search)
                                        setShowRecent(false)
                                    }}
                                    className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center"
                                >
                                    <Search
                                        size={14}
                                        className="mr-2 text-gray-400"
                                    />
                                    {search}
                                </button>
                            </li>
                        ))}
                        <li className="border-t border-gray-100">
                            <button
                                type="button"
                                onClick={() => {
                                    clearRecentSearches()
                                    setShowRecent(false)
                                }}
                                className="w-full text-left px-3 py-2 text-sm text-gray-500 hover:bg-gray-100"
                            >
                                Clear recent searches
                            </button>
                        </li>
                    </ul>
                </div>
            )}
        </div>
    )
}

export default SearchBar

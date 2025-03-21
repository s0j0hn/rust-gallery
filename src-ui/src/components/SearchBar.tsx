import React from 'react'
import { useSearch } from '../context/SearchContext'

const SearchBar: React.FC = () => {
    // Now we're only using the search context
    const {
        searchQuery,
        setSearchQuery,
        selectedRoot,
        setSelectedRoot,
        roots,
    } = useSearch()

    return (
        <div className="search-bar">
            <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search folders..."
            />
            <select
                value={selectedRoot}
                onChange={(e) => setSelectedRoot(e.target.value)}
            >
                <option value="">All roots</option>
                {roots.map((root) => (
                    <option key={root} value={root}>
                        {root}
                    </option>
                ))}
            </select>
        </div>
    )
}

export default SearchBar

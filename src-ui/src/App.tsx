import React, {FC, useCallback, useEffect, useState} from 'react';
import {FileText, FolderOpen, Info, RefreshCw, Search, Tag, Trash2, X} from 'lucide-react';
import PhotoSwipeGallery from './components/PhotoSwipeGallery';
import RandomPhotoView from './components/RandomPhotoView';
import MobileNavigation from './components/MobileNavigation';
import AlbumCard from './components/AlbumCard';
import useMobile from './hooks/useMobile';
import ApiDocs from './components/ApiDocs';
import {
  Album,
  AlbumDetailProps,
  MenuSectionProps,
  Photo,
  TagPhotoViewProps,
} from "./types/gallery";
import {api} from "./services/api";

// Tag Photo View Component
const TagPhotoView: FC<TagPhotoViewProps> = ({ tag, onBack }) => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setLoading(true);
    api.photos.getByTag(tag)
        .then(data => {
          setPhotos(data);
          setLoading(false);
        })
        .catch(err => {
          console.error('Failed to fetch photos by tag:', err);
          setLoading(false);
        });
  }, [tag]);

  const openPhotoSwipe = (index: number): void => {
    // In a real application, you would initialize PhotoSwipe here
    console.log('Opening PhotoSwipe with photo at index', index);
    // This is a placeholder for actual PhotoSwipe implementation
    alert(`Viewing photo ${index + 1} of ${photos.length}`);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading photos with tag "{tag}"...</div>;
  }

  return (
      <div className="container mx-auto p-4">
        <div className="flex items-center mb-6">
          <button
              onClick={onBack}
              className="mr-4 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition"
          >
            Back
          </button>
          <h1 className="text-3xl font-bold">Photos Tagged: <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">{tag}</span></h1>
        </div>

        {photos.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <h2 className="text-xl font-semibold mb-2">No photos found</h2>
              <p className="text-gray-600">No photos with the tag "{tag}" were found.</p>
            </div>
        ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {photos.map((photo, index) => (
                  <div
                      key={photo.id}
                      className="cursor-pointer bg-gray-100 rounded overflow-hidden"
                      onClick={() => openPhotoSwipe(index)}
                  >
                    <div className="relative pb-full">
                      <img
                          src={photo.thumbnail}
                          alt={photo.title}
                          className="absolute inset-0 w-full h-full object-cover"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2">
                        <p className="text-white text-xs truncate">
                          Album: {photo.albumId}
                        </p>
                      </div>
                    </div>
                  </div>
              ))}
            </div>
        )}
      </div>
  );
};

// Album Detail Component
const AlbumDetail: FC<AlbumDetailProps> = ({ albumId, onBack, onTagClick }) => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [album, setAlbum] = useState<Album | null>(null);

  // First effect: Fetch album details
  useEffect(() => {
    setLoading(true);

    api.albums.getAll()
        .then(albums => {
          const currentAlbum = albums.find(a => a.id === albumId);
          if (currentAlbum) {
            setAlbum(currentAlbum);
          }
        })
        .catch(err => console.error('Failed to fetch album details:', err));
  }, [albumId]); // Only depend on albumId, not album

  // Second effect: Fetch photos after album is loaded
  useEffect(() => {
    if (!album) return; // Skip if album is not loaded yet

    api.photos.getByAlbumId(albumId)
        .then(data => {
          // For demo, let's assign some tags to photos
          const tagsPool = album.tags.length > 0
              ? album.tags
              : ['nature', 'travel', 'family', 'friends'];

          const dataWithTags = data.map(photo => ({
            ...photo,
            tags: Math.random() > 0.5 ? [tagsPool[Math.floor(Math.random() * tagsPool.length)]] : []
          }));

          setPhotos(dataWithTags);
          setLoading(false);
        })
        .catch(err => {
          console.error('Failed to fetch photos:', err);
          setLoading(false);
        });
  }, [albumId, album]); // This is fine now because we check if album exists first

  // Handler for when a photo is clicked
  const handlePhotoClick = (index: number): void => {
    console.log('Photo clicked at index', index);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading photos...</div>;
  }

  return (
      <div className="container mx-auto p-4">
        <div className="flex items-center mb-6">
          <button
              onClick={onBack}
              className="mr-4 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition"
          >
            Back
          </button>
          <h1 className="text-3xl font-bold">{album?.title || 'Album'}</h1>
          {album?.folder && (
              <span
                  className="ml-4 px-3 py-1 bg-blue-500 text-white text-sm rounded-full cursor-pointer hover:bg-blue-600"
                  onClick={() => onTagClick('folder', album.folder)}
              >
            {album.folder}
          </span>
          )}
        </div>

        {/* Using our PhotoSwipeGallery component */}
        <PhotoSwipeGallery
            images={photos.map(photo => ({
              id: photo.id,
              src: photo.src,
              thumbnail: photo.thumbnail,
              title: photo.title,
              w: photo.w,
              h: photo.h
            }))}
            onClick={handlePhotoClick}
        />

        {/* Photo tags displayed separately */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {photos.filter(photo => photo.tags.length > 0).map(photo => (
              <div key={`tags-${photo.id}`} className="flex flex-col">
                <div className="text-sm font-medium">{photo.title}</div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {photo.tags.map(tag => (
                      <span
                          key={tag}
                          className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full cursor-pointer hover:bg-blue-200"
                          onClick={() => onTagClick('tag', tag)}
                      >
                  {tag}
                </span>
                  ))}
                </div>
              </div>
          ))}
        </div>
      </div>
  );
};
// Menu Section Component
const MenuSection: FC<MenuSectionProps> = ({
                                             albums,
                                             searchQuery,
                                             setSearchQuery,
                                             selectedFolder,
                                             setSelectedFolder,
                                             onTagClick,
                                             onApiDocsClick,
                                             onIndexation
                                           }) => {
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [isIndexing] = useState<boolean>(false);

  // Calculate total photos
  const totalPhotos = albums.reduce((total, album) => total + album.photoCount, 0);

  // Extract unique tags from all albums
  const allTags = [...new Set(albums.flatMap(album => album.tags))].sort();

  // Extract unique folders
  const allFolders = [...new Set(albums.map(album => album.folder))].sort();

  return (
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex space-x-2">
            <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition flex items-center"
            >
              <Info size={16} className="mr-2" />
              {menuOpen ? 'Hide Menu' : 'Show Menu'}
            </button>

            <button
                onClick={() => {
                  onIndexation();
                }}
                disabled={isIndexing}
                className={`px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition flex items-center ${isIndexing ? 'opacity-75 cursor-not-allowed' : ''}`}
            >
              {isIndexing ? (
                  <>
                    <RefreshCw size={16} className="mr-2 animate-spin" />
                    Indexing...
                  </>
              ) : (
                  <>
                    <RefreshCw size={16} className="mr-2" />
                    Index New Photos
                  </>
              )}
            </button>

            {onApiDocsClick && (
                <button
                    onClick={onApiDocsClick}
                    className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition flex items-center"
                >
                  <FileText size={16} className="mr-2" />
                  API Docs
                </button>
            )}
          </div>

          <div className="relative w-full max-w-md ml-4">
            <Search size={16} className="absolute left-3 top-3 text-gray-400" />
            <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search albums..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded"
            />
            {searchQuery && (
                <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  <X size={16} />
                </button>
            )}
          </div>
        </div>

        {menuOpen && (
            <div className="bg-white p-4 rounded-lg shadow-md mb-6 transition-all">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2 flex items-center">
                    <FolderOpen size={18} className="mr-2" />
                    Statistics
                  </h3>
                  <ul className="space-y-1">
                    <li className="flex items-center">
                      <span className="mr-2">•</span>
                      Total Albums: <span className="font-medium ml-2">{albums.length}</span>
                    </li>
                    <li className="flex items-center">
                      <span className="mr-2">•</span>
                      Total Photos: <span className="font-medium ml-2">{totalPhotos}</span>
                    </li>
                    <li className="flex items-center">
                      <span className="mr-2">•</span>
                      Total Folders: <span className="font-medium ml-2">{allFolders.length}</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2 flex items-center">
                    <FolderOpen size={18} className="mr-2" />
                    Folders
                  </h3>
                  <div className="flex flex-col space-y-2">
                    <div
                        className={`px-3 py-2 rounded cursor-pointer ${!selectedFolder ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                        onClick={() => setSelectedFolder(null)}
                    >
                      All Folders
                    </div>
                    {allFolders.map(folder => (
                        <div
                            key={folder}
                            className={`px-3 py-2 rounded cursor-pointer ${selectedFolder === folder ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                            onClick={() => setSelectedFolder(folder)}
                        >
                          {folder}
                        </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2 flex items-center">
                    <Tag size={18} className="mr-2" />
                    Available Tags
                  </h3>
                  {allTags.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {allTags.map(tag => (
                            <span
                                key={tag}
                                className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full cursor-pointer hover:bg-blue-200"
                                onClick={() => onTagClick('tag', tag)}
                            >
                      {tag}
                    </span>
                        ))}
                      </div>
                  ) : (
                      <p className="text-gray-500">No tags available</p>
                  )}
                </div>
              </div>
            </div>
        )}
      </div>
  );
};

// Main App Component
const App: FC = () => {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [filteredAlbums, setFilteredAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [tagDialogOpen, setTagDialogOpen] = useState<boolean>(false);
  const [selectedAlbumId, setSelectedAlbumId] = useState<number | null>(null);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [currentView, setCurrentView] = useState<'albumList' | 'albumDetail' | 'tagView' | 'apiDocs'>('albumList');
  const [currentAlbumId, setCurrentAlbumId] = useState<number | null>(null);
  const [currentTag, setCurrentTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [randomPhotoDialogOpen, setRandomPhotoDialogOpen] = useState<boolean>(false);
  const [randomPhoto, setRandomPhoto] = useState<Photo | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [albumToDelete, setAlbumToDelete] = useState<Album | null>(null);
  const [isIndexing, setIsIndexing] = useState<boolean>(false);

  // API Documentation URL (replace with your actual API docs URL)
  const apiDocsUrl = 'https://petstore.swagger.io/v2/swagger.json';

  // Check if we're on mobile
  const isMobile = useMobile();

  // All possible tags in the system
  const [availableTags] = useState<string[]>([
    'travel', 'vacation', 'family', 'nature', 'city', 'food',
    'animals', 'celebration', 'holiday', 'beach', 'mountains',
    'architecture', 'art', 'friends', 'party', 'work', 'sports'
  ]);

  useEffect(() => {
    setLoading(true);
    api.albums.getAll()
        .then(data => {
          setAlbums(data);
          setFilteredAlbums(data);
          setLoading(false);
        })
        .catch(err => {
          console.error('Failed to fetch albums:', err);
          setLoading(false);
        });
  }, []);

  // When selectedAlbumId changes, update selectedAlbum
  useEffect(() => {
    if (selectedAlbumId) {
      const album = albums.find(a => a.id === selectedAlbumId);
      if (album) {
        // Create a copy to avoid reference issues
        setSelectedAlbum({...album});
      }
    }
  }, [selectedAlbumId, albums]);

  // Filter albums based on search query and selected folder
  useEffect(() => {
    let filtered = [...albums];

    // Filter by folder if selected
    if (selectedFolder) {
      filtered = filtered.filter(album => album.folder === selectedFolder);
    }

    // Filter by search query if provided
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(album =>
          album.title.toLowerCase().includes(query) ||
          album.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    setFilteredAlbums(filtered);
  }, [searchQuery, selectedFolder, albums]);

  const handleIndexation = useCallback((): void => {
    // This would be an API call to the backend in a real application
    console.log('Starting indexation of new photos...');
    setIsIndexing(true);

    // Simulate a delay to represent the indexation process
    setTimeout(() => {
      console.log('Indexation complete');

      // In a real app, you might refetch the albums here to get the updated data
      // For this demo, we'll just simulate adding 5 photos to the first album
      if (albums.length > 0) {
        const updatedAlbums = [...albums];
        updatedAlbums[0] = {
          ...updatedAlbums[0],
          photoCount: updatedAlbums[0].photoCount + 5
        };

        setAlbums(updatedAlbums);

        // Also update filtered albums if the first album is in the filtered list
        setFilteredAlbums(prevFiltered =>
            prevFiltered.map(album =>
                album.id === updatedAlbums[0].id ? updatedAlbums[0] : album
            )
        );
      }

      // Reset indexing state
      setIsIndexing(false);
    }, 2000);
  }, [albums]);

  const openDeleteDialog = useCallback((album: Album): void => {
    setAlbumToDelete(album);
    setDeleteDialogOpen(true);
  }, []);

  const closeDeleteDialog = useCallback((): void => {
    setDeleteDialogOpen(false);
    setAlbumToDelete(null);
  }, []);

  const deleteAlbum = useCallback((): void => {
    if (!albumToDelete) return;

    // In a real app, you would call an API to delete the album
    console.log(`Deleting album: ${albumToDelete.title}`);

    // Update the state to remove the album
    const updatedAlbums = albums.filter(album => album.id !== albumToDelete.id);
    setAlbums(updatedAlbums);
    setFilteredAlbums(prevFiltered =>
        prevFiltered.filter(album => album.id !== albumToDelete.id)
    );

    // Close the dialog
    closeDeleteDialog();
  }, [albumToDelete, albums, closeDeleteDialog]);

  const openTagDialog = useCallback((albumId: number): void => {
    setSelectedAlbumId(albumId);

    // Find the album in the albums array
    const album = albums.find(a => a.id === albumId);

    // Make sure we create a deep copy to avoid reference issues
    if (album) {
      setSelectedAlbum({
        ...album,
        tags: [...album.tags] // Create a new array for tags
      });
    }

    setTagDialogOpen(true);
  }, [albums]);

  const closeTagDialog = useCallback((): void => {
    setTagDialogOpen(false);
    setSelectedAlbumId(null);
    setSelectedAlbum(null);
  }, []);

  const toggleTag = useCallback((tag: string): void => {
    if (!selectedAlbum) return;

    // Create a copy of the selected album to avoid reference issues
    const updatedAlbum = { ...selectedAlbum };

    // Create a new tags array (avoid mutating the existing one)
    if (updatedAlbum.tags.includes(tag)) {
      // Remove the tag
      updatedAlbum.tags = updatedAlbum.tags.filter(t => t !== tag);
    } else {
      // Add the tag
      updatedAlbum.tags = [...updatedAlbum.tags, tag];
    }

    // Update the selected album state
    setSelectedAlbum(updatedAlbum);
  }, [selectedAlbum]);

  const saveAlbumTags = useCallback((): void => {
    if (!selectedAlbum || selectedAlbumId === null) return;

    // Update the albums array with the new tags
    const updatedAlbums = albums.map(album =>
        album.id === selectedAlbumId ? { ...album, tags: [...selectedAlbum.tags] } : album
    );

    setAlbums(updatedAlbums);

    // Also update filtered albums to see the changes immediately
    setFilteredAlbums(prevFiltered =>
        prevFiltered.map(album =>
            album.id === selectedAlbumId ? { ...album, tags: [...selectedAlbum.tags] } : album
        )
    );

    closeTagDialog();
  }, [albums, closeTagDialog, selectedAlbum, selectedAlbumId]);

  const viewAlbum = useCallback((albumId: number): void => {
    setCurrentAlbumId(albumId);
    setCurrentView('albumDetail');
  }, []);

  const goBackToAlbumList = useCallback((): void => {
    setCurrentView('albumList');
    setCurrentAlbumId(null);
    setCurrentTag(null);
  }, []);

  const viewRandomPhoto = useCallback(async (albumId: number): Promise<void> => {
    try {
      const photos = await api.photos.getRandomsFromAlbum(albumId);
      const randomIndex = Math.floor(Math.random() * photos.length);
      const photo = photos[randomIndex];

      setRandomPhoto({
        ...photo,
        albumId
      });
      setRandomPhotoDialogOpen(true);
    } catch (error) {
      console.error('Error fetching random photo:', error);
    }
  }, []);

  const handleTagClick = useCallback((type: 'tag' | 'folder', value: string): void => {
    if (type === 'tag') {
      setCurrentView('tagView');
      setCurrentTag(value);
    } else if (type === 'folder') {
      setCurrentView('albumList');
      setSelectedFolder(value);
    }
  }, []);

  const viewApiDocs = useCallback((): void => {
    setCurrentView('apiDocs');
  }, []);

  const goBackFromApiDocs = useCallback((): void => {
    setCurrentView('albumList');
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading albums...</div>;
  }

  if (currentView === 'apiDocs') {
    return (
        <div className="min-h-screen bg-gray-100 mobile-safe-bottom">
          <div className="container mx-auto p-4">
            <ApiDocs
                specUrl={apiDocsUrl}
                onBack={goBackFromApiDocs}
            />
          </div>

          {isMobile && (
              <MobileNavigation
                  onHomeClick={goBackFromApiDocs}
                  onFoldersClick={() => {
                    setCurrentView('albumList');
                    setSelectedFolder(null);
                  }}
                  onTagsClick={() => {
                    setCurrentView('albumList');
                  }}
                  onIndexClick={handleIndexation}
                  isIndexing={isIndexing}
              />
          )}
        </div>
    );
  }

  if (currentView === 'albumDetail' && currentAlbumId !== null) {
    return (
        <div className="min-h-screen bg-gray-100 mobile-safe-bottom">
          <div className="container mx-auto p-4">
            <MenuSection
                albums={albums}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                selectedFolder={selectedFolder}
                setSelectedFolder={setSelectedFolder}
                onTagClick={handleTagClick}
                onIndexation={handleIndexation}
                onApiDocsClick={viewApiDocs}
                isIndexing={isIndexing}
            />
            <AlbumDetail
                albumId={currentAlbumId}
                onBack={goBackToAlbumList}
                onTagClick={handleTagClick}
                isMobile={isMobile}
            />
          </div>

          {isMobile && (
              <MobileNavigation
                  onHomeClick={goBackToAlbumList}
                  onFoldersClick={() => {
                    setCurrentView('albumList');
                    setSelectedFolder(null);
                    // Open the menu to show folders
                    const menuSection = document.querySelector('.menu-section') as HTMLElement;
                    if (menuSection) menuSection.dataset.open = 'true';
                  }}
                  onTagsClick={() => {
                    // Just go back to album list and let user pick a tag
                    setCurrentView('albumList');
                  }}
                  onIndexClick={handleIndexation}
                  onApiDocsClick={viewApiDocs}
                  isIndexing={isIndexing}
              />
          )}
        </div>
    );
  }

  if (currentView === 'tagView' && currentTag !== null) {
    return (
        <div className="min-h-screen bg-gray-100 mobile-safe-bottom">
          <div className="container mx-auto p-4">
            <MenuSection
                albums={albums}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                selectedFolder={selectedFolder}
                setSelectedFolder={setSelectedFolder}
                onTagClick={handleTagClick}
                onIndexation={handleIndexation}
                onApiDocsClick={viewApiDocs}
                isIndexing={isIndexing}
            />
            <TagPhotoView
                tag={currentTag}
                onBack={goBackToAlbumList}
                isMobile={isMobile}
            />
          </div>

          {isMobile && (
              <MobileNavigation
                  onHomeClick={goBackToAlbumList}
                  onFoldersClick={() => {
                    setCurrentView('albumList');
                    setSelectedFolder(null);
                  }}
                  onTagsClick={() => {
                    setCurrentView('albumList');
                  }}
                  onIndexClick={handleIndexation}
                  onApiDocsClick={viewApiDocs}
                  isIndexing={isIndexing}
              />
          )}
        </div>
    );
  }

  return (
      <div className="min-h-screen bg-gray-100 mobile-safe-bottom">
        <div className="container mx-auto p-4">
          <h1 className="text-3xl font-bold mb-6">Gallery NAS</h1>

          <MenuSection
              albums={albums}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedFolder={selectedFolder}
              setSelectedFolder={setSelectedFolder}
              onTagClick={handleTagClick}
              onIndexation={handleIndexation}
              onApiDocsClick={viewApiDocs}
              isIndexing={isIndexing}
          />

          {filteredAlbums.length === 0 && (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <h2 className="text-xl font-semibold mb-2">No albums found</h2>
                <p className="text-gray-600">
                  {selectedFolder
                      ? `No albums in folder "${selectedFolder}"${searchQuery ? ` matching "${searchQuery}"` : ''}`
                      : `No albums match your search criteria "${searchQuery}"`}
                </p>
                <div className="mt-4 flex flex-col md:flex-row justify-center gap-2">
                  {searchQuery && (
                      <button
                          onClick={() => setSearchQuery('')}
                          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                      >
                        Clear Search
                      </button>
                  )}
                  {selectedFolder && (
                      <button
                          onClick={() => setSelectedFolder(null)}
                          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
                      >
                        Show All Folders
                      </button>
                  )}
                </div>
              </div>
          )}

          {/* Random Photo Dialog */}
          {randomPhotoDialogOpen && randomPhoto && (
              <RandomPhotoView
                  photo={randomPhoto}
                  onClose={() => setRandomPhotoDialogOpen(false)}
                  onShowAnother={() => {
                    if (randomPhoto.albumId) {
                      viewRandomPhoto(randomPhoto.albumId);
                    }
                  }}
                  onViewAlbum={() => {
                    setRandomPhotoDialogOpen(false);
                    if (randomPhoto.albumId) {
                      viewAlbum(randomPhoto.albumId);
                    }
                  }}
              />
          )}

          {/* Delete Album Confirmation Dialog */}
          {deleteDialogOpen && albumToDelete && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-lg p-6 w-full max-w-md">
                  <h3 className="text-xl font-bold mb-2">Delete Album</h3>
                  <p className="mb-4">
                    Are you sure you want to delete "{albumToDelete.title}"? This action cannot be undone.
                  </p>
                  <div className="flex justify-end gap-2 mt-6">
                    <button
                        onClick={closeDeleteDialog}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition"
                    >
                      Cancel
                    </button>
                    <button
                        onClick={deleteAlbum}
                        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition flex items-center"
                    >
                      <Trash2 size={16} className="mr-2" />
                      Delete Album
                    </button>
                  </div>
                </div>
              </div>
          )}

          {/* Tag Dialog */}
          {tagDialogOpen && selectedAlbum && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className={`bg-white rounded-lg p-6 w-full ${isMobile ? 'max-h-[85vh]' : 'max-w-2xl max-h-[90vh]'} overflow-hidden flex flex-col`}>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">Manage Tags for "{selectedAlbum.title}"</h3>
                    <button
                        onClick={closeTagDialog}
                        className="p-2 rounded-full hover:bg-gray-200"
                    >
                      <X size={24} />
                    </button>
                  </div>

                  <div className="mb-4">
                    <h4 className="font-semibold mb-2">Current Tags</h4>
                    {selectedAlbum.tags && selectedAlbum.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {selectedAlbum.tags.map(tag => (
                              <span
                                  key={tag}
                                  className="px-3 py-1 bg-blue-500 text-white text-sm rounded-full flex items-center"
                              >
                        {tag}
                                <button
                                    onClick={() => toggleTag(tag)}
                                    className="ml-2 bg-blue-600 rounded-full p-1 hover:bg-blue-700 min-h-0 min-w-0"
                                >
                          <X size={12} />
                        </button>
                      </span>
                          ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 mb-4">No tags assigned to this album yet.</p>
                    )}
                  </div>

                  <div className="overflow-auto flex-grow">
                    <h4 className="font-semibold mb-2">Available Tags</h4>
                    <div className={`grid ${isMobile ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'} gap-2`}>
                      {availableTags
                          .filter(tag => !selectedAlbum.tags || !selectedAlbum.tags.includes(tag))
                          .map(tag => (
                              <div
                                  key={tag}
                                  className="px-3 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-100 hover:border-blue-500 flex items-center"
                                  onClick={() => toggleTag(tag)}
                              >
                                <span className="mr-2 w-4 h-4 flex items-center justify-center bg-gray-200 text-gray-700 rounded-full">+</span> {tag}
                              </div>
                          ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
                    <button
                        onClick={closeTagDialog}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition"
                    >
                      Cancel
                    </button>
                    <button
                        onClick={saveAlbumTags}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
          )}

          <div className={`grid grid-cols-1 ${isMobile ? 'gap-4' : 'md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'}`}>
            {filteredAlbums.map(album => (
                <AlbumCard
                    key={album.id}
                    album={album}
                    onView={viewAlbum}
                    onTagClick={handleTagClick}
                    onTagManage={openTagDialog}
                    onRandomPhoto={viewRandomPhoto}
                    onDelete={openDeleteDialog}
                />
            ))}
          </div>
        </div>

        {isMobile && (
            <MobileNavigation
                onHomeClick={() => {
                  setCurrentView('albumList');
                  setSelectedFolder(null);
                  setSearchQuery('');
                }}
                onFoldersClick={() => {
                  const menuSection = document.querySelector('.menu-section') as HTMLElement;
                  if (menuSection) menuSection.dataset.open = 'true';
                }}
                onTagsClick={() => {
                  const menuSection = document.querySelector('.menu-section') as HTMLElement;
                  if (menuSection) menuSection.dataset.open = 'true';
                }}
                onIndexClick={handleIndexation}
                onApiDocsClick={viewApiDocs}
                isIndexing={isIndexing}
            />
        )}
      </div>
  );
};

export default App;
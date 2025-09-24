import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import FolderCard from '../FolderCard'
import { Folder } from '../../types/gallery'

// Mock the hooks
vi.mock('../../hooks/useFolders', () => ({
  useFolders: () => ({
    searchQuery: '',
  }),
}))

// Mock ThumbnailSlideshow component
vi.mock('../ThumbnailSlideshow', () => ({
  default: () => <div data-testid="thumbnail-slideshow">Thumbnail Slideshow</div>,
}))

describe('FolderCard', () => {
  const mockFolder: Folder = {
    title: 'Test Album',
    thumbnails: ['thumb1.jpg', 'thumb2.jpg'],
    photo_count: 42,
    tags: ['test', 'vitest'],
    root: 'photos',
  }

  const mockProps = {
    folder: mockFolder,
    onView: vi.fn(),
    onTagClick: vi.fn(),
    onTagManage: vi.fn(),
    onRandomPhoto: vi.fn(),
    onDelete: vi.fn(),
  }

  it('renders folder information correctly', () => {
    render(<FolderCard {...mockProps} />)

    expect(screen.getByText('Test Album')).toBeInTheDocument()
    expect(screen.getByText('42 photos')).toBeInTheDocument()
    expect(screen.getByText('photos')).toBeInTheDocument()
    expect(screen.getByText('test')).toBeInTheDocument()
    expect(screen.getByText('vitest')).toBeInTheDocument()
  })

  it('calls onView when View Album button is clicked', () => {
    render(<FolderCard {...mockProps} />)

    const viewButton = screen.getByText('View Album')
    fireEvent.click(viewButton)

    expect(mockProps.onView).toHaveBeenCalledWith('Test Album')
  })

  it('calls onRandomPhoto when Random Photo button is clicked', () => {
    render(<FolderCard {...mockProps} />)

    const randomButton = screen.getByText('Random Photo')
    fireEvent.click(randomButton)

    expect(mockProps.onRandomPhoto).toHaveBeenCalledWith('Test Album')
  })

  it('calls onTagManage when Manage Tags button is clicked', () => {
    render(<FolderCard {...mockProps} />)

    const tagButton = screen.getByText('Manage Tags')
    fireEvent.click(tagButton)

    expect(mockProps.onTagManage).toHaveBeenCalledWith(mockFolder)
  })

  it('calls onDelete when delete button is clicked', () => {
    render(<FolderCard {...mockProps} />)

    const deleteButton = screen.getByRole('button', { name: /delete album/i })
    fireEvent.click(deleteButton)

    expect(mockProps.onDelete).toHaveBeenCalledWith(mockFolder)
  })

  it('calls onTagClick when a tag is clicked', () => {
    render(<FolderCard {...mockProps} />)

    const tagElement = screen.getByText('test')
    fireEvent.click(tagElement)

    expect(mockProps.onTagClick).toHaveBeenCalledWith('tag', 'test')
  })

  it('calls onTagClick when root label is clicked', () => {
    render(<FolderCard {...mockProps} />)

    const rootElement = screen.getByText('photos')
    fireEvent.click(rootElement)

    expect(mockProps.onTagClick).toHaveBeenCalledWith('root', 'photos')
  })
})

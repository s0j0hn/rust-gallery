import { http, HttpResponse } from 'msw'
import { API_BASE_URL } from '../config/constants'

// Mock data
const mockFolders = [
  {
    title: 'Summer Vacation 2024',
    thumbnails: ['thumb1.jpg', 'thumb2.jpg'],
    photo_count: 150,
    tags: ['vacation', 'summer', '2024'],
    root: 'photos',
  },
  {
    title: 'Family Reunion',
    thumbnails: ['thumb3.jpg', 'thumb4.jpg'],
    photo_count: 87,
    tags: ['family', 'events'],
    root: 'photos',
  },
]

const mockConfig = {
  random_equal_folders: 1,
  photo_per_random: 10,
  folders_per_page: 15,
  equal_enabled: true,
}

const mockRoots = [
  { photo_count: 500, root: 'photos' },
  { photo_count: 200, root: 'archives' },
]

// Request handlers
export const handlers = [
  // Config endpoints
  http.get(`${API_BASE_URL}/config`, () => {
    return HttpResponse.json(mockConfig)
  }),

  http.post(`${API_BASE_URL}/config`, async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({ status: 'success', config: body })
  }),

  // Folders endpoints
  http.get(`${API_BASE_URL}/folders/json`, ({ request }) => {
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const perPage = parseInt(url.searchParams.get('per_page') || '15')
    const searchBy = url.searchParams.get('searchby') || ''

    let filteredFolders = [...mockFolders]

    // Filter by search query
    if (searchBy) {
      filteredFolders = filteredFolders.filter((folder) =>
        folder.title.toLowerCase().includes(searchBy.toLowerCase())
      )
    }

    // Paginate
    const start = (page - 1) * perPage
    const end = start + perPage
    const paginatedFolders = filteredFolders.slice(start, end)

    return HttpResponse.json(paginatedFolders)
  }),

  http.get(`${API_BASE_URL}/folders/roots`, () => {
    return HttpResponse.json(mockRoots)
  }),

  http.get(`${API_BASE_URL}/folders/json/name/:name`, ({ params }) => {
    const folder = mockFolders.find((f) => f.title === params.name)
    return HttpResponse.json(folder ? [folder] : [])
  }),

  http.post(`${API_BASE_URL}/folders/delete`, async ({ request }) => {
    const body = (await request.json()) as any
    return HttpResponse.json({ rows: 1, folder_name: body?.folder_name })
  }),

  // Tags endpoints
  http.get(`${API_BASE_URL}/tags`, () => {
    const allTags = Array.from(new Set(mockFolders.flatMap((f) => f.tags)))
    return HttpResponse.json(allTags)
  }),

  http.post(`${API_BASE_URL}/tags/assign/folder`, async ({ request }) => {
    const body = (await request.json()) as any
    return HttpResponse.json({ tags: body?.tags || [] })
  }),

  // Photos endpoints
  http.get(`${API_BASE_URL}/files/json`, ({ request }) => {
    const url = new URL(request.url)
    const folder = url.searchParams.get('folder')
    const page = parseInt(url.searchParams.get('page') || '1')

    const mockPhotos = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      path: `/photos/${folder}/photo${i + 1}.jpg`,
      hash: `hash${i + 1}`,
      extention: 'jpg',
      filename: `photo${i + 1}.jpg`,
      folder_name: folder,
      width: 1920,
      height: 1080,
      tags: '',
      root: 'photos',
    }))

    return HttpResponse.json({
      total: 50,
      page,
      items: mockPhotos,
    })
  }),

  // Indexation endpoints
  http.get(`${API_BASE_URL}/files/task/index`, () => {
    return HttpResponse.json({
      status: 'info',
      task_running: false,
      message: 'No indexation running',
      last_indexed: Date.now(),
    })
  }),

  http.get(`${API_BASE_URL}/files/task/cancel`, () => {
    return HttpResponse.json({
      status: 'success',
      task_running: false,
      message: 'Task cancelled',
    })
  }),
]

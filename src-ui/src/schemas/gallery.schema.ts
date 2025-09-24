import { z } from 'zod'

// Folder schema
export const FolderSchema = z.object({
  title: z.string().min(1, 'Folder title is required'),
  thumbnails: z.array(z.string()).optional().default([]),
  photo_count: z.number().int().nonnegative(),
  tags: z.array(z.string()),
  root: z.string(),
})

export type Folder = z.infer<typeof FolderSchema>

// Config schema
export const JsonConfigSchema = z.object({
  random_equal_folders: z.number().int().nonnegative(),
  photo_per_random: z.number().int().positive(),
  folders_per_page: z.number().int().positive().max(100),
  equal_enabled: z.boolean(),
})

export type JsonConfig = z.infer<typeof JsonConfigSchema>

// Root response schema
export const JsonRootResponseSchema = z.object({
  photo_count: z.number().int().nonnegative(),
  root: z.string(),
})

export type JsonRootResponse = z.infer<typeof JsonRootResponseSchema>

// Index response schema
export const JsonResponseIndexSchema = z.object({
  status: z.string(),
  task_running: z.boolean(),
  message: z.string(),
  last_indexed: z.number().optional(),
})

export type JsonResponseIndex = z.infer<typeof JsonResponseIndexSchema>

// Cancel task response schema
export const JsonResponseCancelTaskSchema = z.object({
  status: z.enum(['info', 'success']),
  task_running: z.boolean(),
  message: z.string(),
})

export type JsonResponseCancelTask = z.infer<typeof JsonResponseCancelTaskSchema>

// Generic response schema
export const JsonResponseSchema = <T extends z.ZodType>(itemSchema: T) =>
  z.object({
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    items: itemSchema,
  })

// Photo schema
export const JsonFilePhotoSchema = z.object({
  id: z.number().int().positive(),
  path: z.string(),
  hash: z.string(),
  extension: z.string(),
  filename: z.string(),
  folder_name: z.string(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  tags: z.string(),
  root: z.string(),
})

export type JsonFilePhoto = z.infer<typeof JsonFilePhotoSchema>

// Menu section props schema
export const MenuSectionPropsSchema = z.object({
  folders: z.array(FolderSchema).optional(),
  tags: z.array(z.string()).optional(),
  searchQuery: z.string().optional(),
  setSearchQuery: z.function({ input: [z.string()], output: z.void() }),
  selectedRoot: z.string().nullable().optional(),
  setSelectedRoot: z.function({ input: [z.string().nullable()], output: z.void() }),
  onTagClick: z.function({ input: [z.enum(['tag', 'root']), z.string()], output: z.void() }),
  onIndexation: z.function({ output: z.void() }),
  onApiDocsClick: z.function({ output: z.void() }),
  isIndexing: z.boolean().optional(),
  isOpen: z.boolean().optional(),
  onClose: z.function({ output: z.void() }),
})

export type MenuSectionProps = z.infer<typeof MenuSectionPropsSchema>

// Random photo props schema
export const RandomPhotoPropsSchema = z.object({
  photos: z.array(JsonFilePhotoSchema),
})

export type RandomPhotoProps = z.infer<typeof RandomPhotoPropsSchema>

// API response validation helpers
export const validateApiResponse = <T>(schema: z.ZodType<T>, data: unknown): T => {
  try {
    return schema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('API response validation error:', error.message)
      throw new Error(
        `Invalid API response: ${error.issues.map((e) => e.message + '' + e.path).join(', ')}`
      )
    }
    throw error
  }
}

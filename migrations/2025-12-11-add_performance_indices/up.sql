-- Add indices for improved query performance
-- These indices will significantly speed up common queries

-- Hash lookups (most critical - used in every file retrieval)
CREATE INDEX IF NOT EXISTS idx_files_hash ON files(hash);

-- Folder queries (used for browsing albums)
CREATE INDEX IF NOT EXISTS idx_files_folder_name ON files(folder_name);

-- Root directory filtering
CREATE INDEX IF NOT EXISTS idx_files_root ON files(root);

-- Extension filtering (for file type searches)
CREATE INDEX IF NOT EXISTS idx_files_extension ON files(extension);

-- Tag searches (sparse index - only non-null values)
CREATE INDEX IF NOT EXISTS idx_files_tags ON files(tags) WHERE tags IS NOT NULL AND tags != '[]';

-- Composite index for common query pattern (folder + root)
CREATE INDEX IF NOT EXISTS idx_files_folder_root ON files(folder_name, root);
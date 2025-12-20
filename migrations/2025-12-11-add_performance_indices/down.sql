-- Remove performance indices
DROP INDEX IF EXISTS idx_files_hash;
DROP INDEX IF EXISTS idx_files_folder_name;
DROP INDEX IF EXISTS idx_files_root;
DROP INDEX IF EXISTS idx_files_extension;
DROP INDEX IF EXISTS idx_files_tags;
DROP INDEX IF EXISTS idx_files_folder_root;
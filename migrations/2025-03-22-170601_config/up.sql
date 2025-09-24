CREATE TABLE config (
                        id INTEGER PRIMARY KEY,
                        random_equal_folders INTEGER NOT NULL,
                        photo_per_random INTEGER NOT NULL,
                        folders_per_page INTEGER NOT NULL,
                        equal_enabled INTEGER NOT NULL CHECK (equal_enabled IN (0, 1))
);

INSERT INTO config (id, random_equal_folders, photo_per_random, folders_per_page, equal_enabled)
VALUES (1, 100, 200, 4, 1);

-- Additional indexes for files table (avoid duplicating the ones already created)
CREATE INDEX IF NOT EXISTS idx_files_folder_name ON files(folder_name);
CREATE INDEX IF NOT EXISTS idx_files_root ON files(root);
CREATE INDEX IF NOT EXISTS idx_files_tags ON files(tags);
CREATE INDEX IF NOT EXISTS idx_files_composite ON files(folder_name, root);